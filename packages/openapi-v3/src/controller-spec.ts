// Copyright IBM Corp. 2018. All Rights Reserved.
// Node module: @loopback/openapi-v3
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {
  MetadataInspector,
  ClassDecoratorFactory,
  MethodDecoratorFactory,
  ParameterDecoratorFactory,
  DecoratorFactory,
  MethodParameterDecoratorFactory,
} from '@loopback/context';

import {jsonToSchemaObject} from '../';
import {
  OperationObject,
  ParameterLocation,
  ParameterObject,
  SchemaObject,
  ServerObject,
  PathsObject,
  MapObject,
  ComponentsObject,
  ReferenceObject,
  isSchemaObject,
  RequestBodyObject,
  ItemType,
  ItemsObject,
} from '@loopback/openapi-spec-types';
import {getJsonSchema, JsonDefinition} from '@loopback/repository-json-schema';
import * as _ from 'lodash';
import * as stream from 'stream';
import {inspect} from 'util';

const debug = require('debug')('loopback:rest:router:metadata');

const REST_METHODS_KEY = 'rest:methods';
const REST_PARAMETERS_KEY = 'rest:parameters';
const REST_CLASS_KEY = 'rest:class';
const REST_CONTROLLER_SPEC_KEY = 'rest:controller-spec';
const REST_REQUEST_BODY_KEY = 'rest:request-body';

// tslint:disable:no-any

export interface ControllerSpec {
  /**
   * The base path on which the Controller API is served.
   * If it is not included, the API is served directly under the host.
   * The value MUST start with a leading slash (/).
   */
  basePath?: string;

  /**
   * The available paths and operations for the API.
   */
  paths: PathsObject;

  /**
   * openapi components.schemas generated from model metadata
   */
  components?: ComponentsObject;
}
/**
 * Decorate the given Controller constructor with metadata describing
 * the HTTP/REST API the Controller implements/provides.
 *
 * `@api` can be applied to controller classes. For example,
 * ```
 * @api({basePath: '/my'})
 * class MyController {
 *   // ...
 * }
 * ```
 *
 * @param spec OpenAPI specification describing the endpoints
 * handled by this controller
 *
 * @decorator
 */
export function api(spec: ControllerSpec) {
  return ClassDecoratorFactory.createDecorator<ControllerSpec>(
    REST_CLASS_KEY,
    spec,
  );
}

/**
 * Data structure for REST related metadata
 */
interface RestEndpoint {
  verb: string;
  path: string;
  spec?: OperationObject;
}

/**
 * Build the api spec from class and method level decorations
 * @param constructor Controller class
 */
function resolveControllerSpec(constructor: Function): ControllerSpec {
  debug(`Retrieving OpenAPI specification for controller ${constructor.name}`);

  let spec = MetadataInspector.getClassMetadata<ControllerSpec>(
    REST_CLASS_KEY,
    constructor,
  );
  if (spec) {
    debug('  using class-level spec defined via @api()', spec);
    spec = DecoratorFactory.cloneDeep(spec);
  } else {
    spec = {paths: {}};
  }

  let endpoints =
    MetadataInspector.getAllMethodMetadata<RestEndpoint>(
      REST_METHODS_KEY,
      constructor.prototype,
    ) || {};

  endpoints = DecoratorFactory.cloneDeep(endpoints);
  // console.log(`endpoints: ${endpoints}`);
  for (const op in endpoints) {
    debug('  processing method %s', op);

    const endpoint = endpoints[op];
    const verb = endpoint.verb!;
    const path = endpoint.path!;

    let endpointName = '';
    /* istanbul ignore if */
    if (debug.enabled) {
      const className = constructor.name || '<AnonymousClass>';
      const fullMethodName = `${className}.${op}`;
      endpointName = `${fullMethodName} (${verb} ${path})`;
    }

    let operationSpec = endpoint.spec;
    if (!operationSpec) {
      // The operation was defined via @operation(verb, path) with no spec
      operationSpec = {
        responses: {},
      };
      endpoint.spec = operationSpec;
    }
    debug('  operation for method %s: %j', op, endpoint);

    debug('  processing parameters for method %s', op);
    let params = MetadataInspector.getAllParameterMetadata<ParameterObject>(
      REST_PARAMETERS_KEY,
      constructor.prototype,
      op,
    );
    debug('  parameters for method %s: %j', op, params);
    if (params != null) {
      params = DecoratorFactory.cloneDeep(params);
      /**
       * If a controller method uses dependency injection, the parameters
       * might be sparsed. For example,
       * ```ts
       * class MyController {
       *   greet(
       *     @inject('prefix') prefix: string,
       *     @param.query.string('name) name: string) {
       *      return `${prefix}`, ${name}`;
       *   }
       * ```
       */
      operationSpec.parameters = params.filter(p => p != null);
    }
    debug('  processing requestBody for method %s', op);
    let requestBodies = MetadataInspector.getAllParameterMetadata<
      RequestBodyObject
    >(REST_REQUEST_BODY_KEY, constructor.prototype, op);
    let requestBody: RequestBodyObject;
    // workaround
    // console.log(`bodies: ${requestBodies}`);
    if (requestBodies) {
      if (requestBodies.length > 1)
        throw new Error(
          'An operation should only have one parameter decorated by @requestBody',
        );
      requestBody = requestBodies[0];
      debug('  requestBody for method %s: %j', op, requestBody);
      // console.log(`requestBody + ${requestBody}`);
      if (requestBody) {
        operationSpec.requestBody = requestBody;
      }
    }

    operationSpec['x-operation-name'] = op;

    if (!spec.paths[path]) {
      spec.paths[path] = {};
    }

    if (spec.paths[path][verb]) {
      // Operations from subclasses override those from the base
      debug(`  Overriding ${endpointName} - endpoint was already defined`);
    }

    debug(`  adding ${endpointName}`, operationSpec);
    spec.paths[path][verb] = operationSpec;
    // console.log(`path spec: ${inspect(spec.paths[path][verb])}`);

    debug(`  inferring schema object for method %s`, op);
    const paramTypes = MetadataInspector.getDesignTypeForMethod(
      constructor.prototype,
      op,
    ).parameterTypes;

    const isComplexType = (ctor: Function) =>
      !_.includes([String, Number, Boolean, Array, Object], ctor);

    for (const p of paramTypes) {
      if (isComplexType(p)) {
        if (!spec.components) {
          spec.components = {};
        }
        if (!spec.components.schemas) {
          spec.components.schemas = {};
        }
        const jsonSchema = getJsonSchema(p);
        const openapiSchema = jsonToSchemaObject(jsonSchema);
        if (openapiSchema.definitions) {
          for (const key in openapiSchema.definitions) {
            spec.components.schemas[key] = openapiSchema.definitions[key];
          }
          delete openapiSchema.definitions;
        }

        spec.components.schemas[p.name] = openapiSchema;
        break;
      }
    }
  }
  return spec;
}

/**
 * Get the controller spec for the given class
 * @param constructor Controller class
 */
export function getControllerSpec(constructor: Function): ControllerSpec {
  let spec = MetadataInspector.getClassMetadata<ControllerSpec>(
    REST_CONTROLLER_SPEC_KEY,
    constructor,
    {ownMetadataOnly: true},
  );
  if (!spec) {
    spec = resolveControllerSpec(constructor);
    MetadataInspector.defineMetadata(
      REST_CONTROLLER_SPEC_KEY,
      spec,
      constructor,
    );
  }
  return spec;
}

/**
 * Expose a Controller method as a REST API operation
 * mapped to `GET` request method.
 *
 * @param path The URL path of this operation, e.g. `/product/{id}`
 * @param spec The OpenAPI specification describing parameters and responses
 *   of this operation.
 */
export function get(path: string, spec?: OperationObject) {
  return operation('get', path, spec);
}

/**
 * Expose a Controller method as a REST API operation
 * mapped to `POST` request method.
 *
 * @param path The URL path of this operation, e.g. `/product/{id}`
 * @param spec The OpenAPI specification describing parameters and responses
 *   of this operation.
 */
export function post(path: string, spec?: OperationObject) {
  return operation('post', path, spec);
}

/**
 * Expose a Controller method as a REST API operation
 * mapped to `PUT` request method.
 *
 * @param path The URL path of this operation, e.g. `/product/{id}`
 * @param spec The OpenAPI specification describing parameters and responses
 *   of this operation.
 */
export function put(path: string, spec?: OperationObject) {
  return operation('put', path, spec);
}

/**
 * Expose a Controller method as a REST API operation
 * mapped to `PATCH` request method.
 *
 * @param path The URL path of this operation, e.g. `/product/{id}`
 * @param spec The OpenAPI specification describing parameters and responses
 *   of this operation.
 */
export function patch(path: string, spec?: OperationObject) {
  return operation('patch', path, spec);
}

/**
 * Expose a Controller method as a REST API operation
 * mapped to `DELETE` request method.
 *
 * @param path The URL path of this operation, e.g. `/product/{id}`
 * @param spec The OpenAPI specification describing parameters and responses
 *   of this operation.
 */
export function del(path: string, spec?: OperationObject) {
  return operation('delete', path, spec);
}

/**
 * Expose a Controller method as a REST API operation.
 *
 * @param verb HTTP verb, e.g. `GET` or `POST`.
 * @param path The URL path of this operation, e.g. `/product/{id}`
 * @param spec The OpenAPI specification describing parameters and responses
 *   of this operation.
 */
export function operation(verb: string, path: string, spec?: OperationObject) {
  return MethodDecoratorFactory.createDecorator<Partial<RestEndpoint>>(
    REST_METHODS_KEY,
    {
      verb,
      path,
      spec,
    },
  );
}

class RestMethodParameterDecoratorFactory extends MethodParameterDecoratorFactory<
  ParameterObject
> {}
