import {SchemaObject, isSchemaObject} from '@loopback/openapi-spec-types';

// export them from openapi-spec-types
export class Integer extends Number {}
export class Long extends Number {}
export class Float extends Number {}
export class Double extends Number {}
export class Byte extends String {}
export class Binary extends String {}
export class Date extends String {}
export class DateTime extends String {}
export class Password extends String {}

const typeAndFormatMap = {
  integer: {type: 'integer', format: 'int32'},
  long: {type: 'integer', format: 'int64'},
  float: {type: 'number', format: 'float'},
  double: {type: 'number', format: 'double'},
  byte: {type: 'string', format: 'byte'},
  binary: {type: 'string', format: 'binary'},
  date: {type: 'string', format: 'date'},
  dateTime: {type: 'string', format: 'date-time'},
  password: {type: 'string', format: 'password'},
};

export function getSchemaForParam(
  type: Function,
  schema: SchemaObject,
): SchemaObject {
  if (isSchemaObject(schema) && schema.type && schema.format) return schema;

  let typeAndFormat: any = {};
  if (type === String) {
    typeAndFormat.type = 'string';
  } else if (type === Number) {
    typeAndFormat.type = 'number';
  } else if (type === Boolean) {
    typeAndFormat.type = 'boolean';
  } else if (type === Array) {
    // item type cannot be inspected
    typeAndFormat.type = 'array';
  } else if (type === Object) {
    typeAndFormat.type = 'object';
  } else if (type === Integer) {
    typeAndFormat = typeAndFormatMap.integer;
  } else if (type === Long) {
    typeAndFormat = typeAndFormatMap.long;
  } else if (type === Float) {
    typeAndFormat = typeAndFormatMap.float;
  } else if (type === Double) {
    typeAndFormat = typeAndFormatMap.double;
  } else if (type === Byte) {
    typeAndFormat = typeAndFormatMap.byte;
  } else if (type === Binary) {
    typeAndFormat = typeAndFormatMap.binary;
  } else if (type === Date) {
    typeAndFormat = typeAndFormatMap.date;
  } else if (type === DateTime) {
    typeAndFormat = typeAndFormatMap.dateTime;
  } else if (type === Password) {
    typeAndFormat = typeAndFormatMap.password;
  }
  if (typeAndFormat.type && !schema.type) schema.type = typeAndFormat.type;
  if (typeAndFormat.format && !schema.format)
    schema.format = typeAndFormat.format;
  return schema;
}

/**
 * Get openapi schema for a JavaScript type for a body parameter
 * @param type JavaScript type
 */
export function getSchemaForRequestBody(type: Function): SchemaObject {
  let generatedSchema = getSchemaForParam(type, {});
  if (!generatedSchema.type)
    generatedSchema.$ref = '#/components/schemas/' + type.name;
  return generatedSchema;
}
