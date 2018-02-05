import {RequestBodyObject, isSchemaObject} from '@loopback/openapi-spec-types';
import {MetadataInspector, ParameterDecoratorFactory} from '@loopback/context';
import {getSchemaForRequestBody} from '../';

const REST_REQUEST_BODY_KEY = 'rest:request-body';
/**
 * Describe the request body of a Controller method parameter.
 *
 * @param requestBodySpec
 */
export function requestBody(requestBodySpec?: Partial<RequestBodyObject>) {
  return function(target: Object, member: string | symbol, index: number) {
    // Use 'application/json' as default content if `requestBody` is undefined
    requestBodySpec = requestBodySpec || {content: {}};
    if (_.isEmpty(requestBodySpec.content))
      requestBodySpec.content = {'application/json': {}};

    const methodSig = MetadataInspector.getDesignTypeForMethod(target, member);
    const paramTypes = (methodSig && methodSig.parameterTypes) || [];
    let paramType = paramTypes[index];
    let schema = getSchemaForRequestBody(paramType);
    requestBodySpec.content = _.mapValues(requestBodySpec.content, c => {
      c.schema = c.schema || schema;
      return c;
    });

    ParameterDecoratorFactory.createDecorator<RequestBodyObject>(
      REST_REQUEST_BODY_KEY,
      requestBodySpec as RequestBodyObject,
    )(target, member, index);
  };
}
