import {Columns} from "./BaseModel";
import {ModelObject} from "./Repository";

export const types = {
  INTEGER: 'INTEGER',
  FLOAT: 'FLOAT',
  TEXT: 'TEXT',
  NUMERIC: 'NUMERIC',
  DATE: 'DATE',
  DATETIME: 'DATETIME',
  BOOLEAN: 'BOOLEAN',
  JSON: 'JSON'
}

export enum DataTypes {
    INTEGER = 'INTEGER',
    FLOAT = 'FLOAT',
    TEXT = 'TEXT',
    NUMERIC = 'NUMERIC',
    DATE = 'DATE',
    DATETIME = 'DATETIME',
    BOOLEAN = 'BOOLEAN',
    JSON = 'JSON'
}

interface StringArray extends Array<any> {
    [index: number]: [string, any];
}

function toDatabaseValue(columnMapping: Columns, resource: ModelObject) {
  const entries: StringArray = Object.entries(resource);

  return entries.reduce((o: ModelObject, p: [string, any]) => {
      o[p[0]] = propertyToDatabaseValue(columnMapping[p[0]].type, p[1]);
      return o
  }, {})
}

function propertyToDatabaseValue(type: string, value: any): any {
  switch (type) {
    case types.JSON:
      return JSON.stringify(value);
    case types.BOOLEAN:
      return value ? 1 : 0;
    default:
      return value
  }
}

function toModelValue(columnMapping: Columns, obj: ModelObject) {
  return Object.entries(columnMapping).reduce((o: ModelObject, p: [string, any]) => {
    if (obj.hasOwnProperty(p[0])) {
      o[p[0]] = propertyToModelValue(p[1].type, obj[p[0]])
    }
    return o
  }, {})
}

function propertyToModelValue(type: string, value: any) {
  switch (type) {
    case types.JSON:
      return JSON.parse(value || null);
    case types.BOOLEAN:
      return Boolean(value);
    default:
      return value
  }
}

export default {
  toDatabaseValue,
  propertyToDatabaseValue,
  toModelValue,
  propertyToModelValue
}
