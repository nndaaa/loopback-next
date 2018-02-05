// // short cut for
// // in
// // style
// // schema's `type`
// // and `format`
// export namespace param {
//   export const path = {
//     matrix: {
//       integer: createParameterShortcut('path', 'matrix', 'integer', 'int32'),
//       long: createParameterShortcut('path', 'matrix','integer', 'int64'),
//       float: createParameterShortcut('path', 'matrix','number', 'float'),
//       double: createParameterShortcut('path', 'matrix','number', 'double'),
//       string: createParameterShortcut('path', 'matrix','string'),
//       byte: createParameterShortcut('path', 'matrix','string', 'byte'),
//       binary: createParameterShortcut('path', 'matrix','string', 'binary'),
//       boolean: createParameterShortcut('path', 'matrix','boolean'),
//       date: createParameterShortcut('path', 'matrix','string', 'date'),
//       dateTime: createParameterShortcut('path', 'matrix','string', 'date-time'),
//       password: createParameterShortcut('path', 'matrix','string', 'password'),
//     },
//     label: {

//     },
//     simple: {

//     }

//   }

// };

// export namespace param {

// }

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
//     itemSpec: ItemType | ItemsObject,
//   ) {
//     const items = typeof itemSpec === 'string' ? {type: itemSpec} : itemSpec;
//     if (source !== 'cookie') {
//       return param({name, in: source, type: 'array', items});
//     } else {
//       return param({name, in: source, schema: {type: 'array', items}});
//     }
//   };
// }
