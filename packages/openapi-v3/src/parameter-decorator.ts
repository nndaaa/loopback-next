import {
  ParameterObject,
  isSchemaObject,
  SchemaObject,
  ReferenceObject,
  ParameterLocation,
} from '@loopback/openapi-spec-types';
import {MetadataInspector, ParameterDecoratorFactory} from '@loopback/context';
import {getSchemaForParam} from '../';

const paramDecoratorStyle = Symbol('ParamDecoratorStyle');
const REST_PARAMETERS_KEY = 'rest:parameters';

/**
 * Describe an input parameter of a Controller method.
 *
 * `@param` can be applied to method itself or specific parameters. For example,
 * ```
 * class MyController {
 *   @get('/')
 *   @param(offsetSpec)
 *   @param(pageSizeSpec)
 *   list(offset?: number, pageSize?: number) {}
 * }
 * ```
 * or
 * ```
 * class MyController {
 *   @get('/')
 *   list(
 *     @param(offsetSpec) offset?: number,
 *     @param(pageSizeSpec) pageSize?: number,
 *   ) {}
 * }
 * ```
 * Please note mixed usage of `@param` at method/parameter level is not allowed.
 *
 * @param paramSpec Parameter specification.
 */
export function param(paramSpec: ParameterObject) {
  return function(
    target: Object,
    member: string | symbol,
    // deprecate method level decorator
    index: number,
  ) {
    paramSpec = paramSpec || {};
    // Get the design time method parameter metadata
    const methodSig = MetadataInspector.getDesignTypeForMethod(target, member);
    const paramTypes = (methodSig && methodSig.parameterTypes) || [];

    const targetWithParamStyle = target as any;
    // Map design-time parameter type to the OpenAPI param type

    let paramType = paramTypes[index];

    if (paramType) {
      if (
        !paramSpec.schema ||
        (isSchemaObject(paramSpec.schema) && !paramSpec.schema.type)
      ) {
        paramSpec.schema = getSchemaForParam(paramType, paramSpec.schema || {});
      }
    }
    targetWithParamStyle[paramDecoratorStyle] = 'parameter';
    ParameterDecoratorFactory.createDecorator<ParameterObject>(
      REST_PARAMETERS_KEY,
      paramSpec,
    )(target, member, index);

    if (
      paramSpec.schema &&
      isSchemaObject(paramSpec.schema) &&
      paramSpec.schema.type === 'array'
    ) {
      // The design-time type is `Object` for `any`
      if (paramType != null && paramType !== Object && paramType !== Array) {
        throw new Error(
          `The parameter type is set to 'array' but the JavaScript type is ${
            paramType.name
          }`,
        );
      }
    }
  };
}

export namespace param {
  export const array = function(
    name: string,
    source: ParameterLocation,
    itemSpec: SchemaObject | ReferenceObject,
  ) {
    return param({
      name,
      in: source,
      schema: {type: 'array', items: itemSpec},
    });
  };
}
