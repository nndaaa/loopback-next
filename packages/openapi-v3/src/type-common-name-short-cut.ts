import {
  SchemaObject,
  ReferenceObject,
  ParameterLocation,
} from '@loopback/openapi-spec-types';
import {param} from '../';
// export namespace param {
//   export const query = {
//     /**
//      * Define a parameter of "string" type that's read from the query string.
//      *
//      * @param name Parameter name.
//      */
//     string: createParamShortcut('query', 'string'),

//     /**
//      * Define a parameter of "number" type that's read from the query string.
//      *
//      * @param name Parameter name.
//      */
//     number: createParamShortcut('query', 'number'),

//     /**
//      * Define a parameter of "integer" type that's read from the query string.
//      *
//      * @param name Parameter name.
//      */
//     integer: createParamShortcut('query', 'integer'),

//     /**
//      * Define a parameter of "boolean" type that's read from the query string.
//      *
//      * @param name Parameter name.
//      */
//     boolean: createParamShortcut('query', 'boolean'),
//   };

//   export const header = {
//     /**
//      * Define a parameter of "string" type that's read from a request header.
//      *
//      * @param name Parameter name, it must match the header name
//      *   (e.g. `Content-Type`).
//      */
//     string: createParamShortcut('header', 'string'),

//     /**
//      * Define a parameter of "number" type that's read from a request header.
//      *
//      * @param name Parameter name, it must match the header name
//      *   (e.g. `Content-Length`).
//      */
//     number: createParamShortcut('header', 'number'),

//     /**
//      * Define a parameter of "integer" type that's read from a request header.
//      *
//      * @param name Parameter name, it must match the header name
//      *   (e.g. `Content-Length`).
//      */
//     integer: createParamShortcut('header', 'integer'),

//     /**
//      * Define a parameter of "boolean" type that's read from a request header.
//      *
//      * @param name Parameter name, it must match the header name,
//      *   (e.g. `DNT` or `X-Do-Not-Track`).
//      */
//     boolean: createParamShortcut('header', 'boolean'),
//   };

//   export const path = {
//     /**
//      * Define a parameter of "string" type that's read from request path.
//      *
//      * @param name Parameter name matching one of the placeholders in the path
//      *   string.
//      */
//     string: createParamShortcut('path', 'string'),

//     /**
//      * Define a parameter of "number" type that's read from request path.
//      *
//      * @param name Parameter name matching one of the placeholders in the path
//      *   string.
//      */
//     number: createParamShortcut('path', 'number'),

//     /**
//      * Define a parameter of "integer" type that's read from request path.
//      *
//      * @param name Parameter name matching one of the placeholders in the path
//      *   string.
//      */
//     integer: createParamShortcut('path', 'integer'),

//     /**
//      * Define a parameter of "boolean" type that's read from request path.
//      *
//      * @param name Parameter name matching one of the placeholders in the path
//      *   string.
//      */
//     boolean: createParamShortcut('path', 'boolean'),
//   };

//   /**
//    * Define a parameter that's set to the full request body.
//    *
//    * @param name Parameter name
//    * @param schema The schema defining the type used for the body parameter.
//    */
//   export const body = function(
//     name: string,
//     schema?: SchemaObject | ReferenceObject,
//   ) {
//     return param({name, in: 'body', schema});
//   };

//   /**
//    * Define a parameter of `array` type
//    *
//    * @example
//    * ```ts
//    * export class MyController {
//    *   @get('/greet')
//    *   greet(@param.array('names', 'query', 'string') names: string[]): string {
//    *     return `Hello, ${names}`;
//    *   }
//    * }
//    * ```
//    * @param name Parameter name
//    * @param source Source of the parameter value
//    * @param itemSpec Item type for the array or the full item object
//    */
//   export const array = function(
//     name: string,
//     source: ParameterLocation,
//     itemSpec: SchemaObject | ReferenceObject,
//   ) {
//     const items = typeof itemSpec === 'string' ? {type: itemSpec} : itemSpec;
//     if (source !== 'cookie') {
//       return param({name, in: source, type: 'array', items});
//     } else {
//       return param({name, in: source, schema: {type: 'array', items}});
//     }
//   };
// }

export namespace param {
  export const array = function(
    name: string,
    source: ParameterLocation,
    itemSpec: SchemaObject | ReferenceObject,
  ) {
    return param({name, in: source, schema: {type: 'array', items: itemSpec}});
  };
}
