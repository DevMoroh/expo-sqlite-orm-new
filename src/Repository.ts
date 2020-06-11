import Types, {DataTypes} from './DataTypes'
import DatabaseLayer from './DatabaseLayer'
import {WebSQLDatabase} from "expo-sqlite";
import {Column, Columns} from "./BaseModel";

export type ModelObject = {
    [key:  string]: any
}

export type UpdateObject = ModelObject & { primaryKey: string }

export interface ModelObjects {
    [index:  number]: ModelObject
}

export default class Repository {

  public columnMapping: Columns;
  public databaseLayer: DatabaseLayer;

  constructor(database: WebSQLDatabase, tableName: string, columnMapping: Columns) {
    this.columnMapping = columnMapping;
    this.databaseLayer = new DatabaseLayer(database, tableName)
  }

  createTable(): Promise<boolean> {
    return this.databaseLayer.createTable(this.columnMapping)
  }

  dropTable() {
    return this.databaseLayer.dropTable()
  }

  insert(_obj: ModelObject) {
    const obj = Types.toDatabaseValue(this.columnMapping, this._sanitize(_obj))

    return this.databaseLayer.insert(obj).then(res => Types.toModelValue(this.columnMapping, res))
  }

  update(_obj: UpdateObject) {
    const {primaryKey, ...props} = _obj;
    const obj: ModelObject = Types.toDatabaseValue(this.columnMapping, this._sanitize(props));
    return this.databaseLayer.update({...obj, primaryKey})
  }

  destroy(id: string|number): Promise<boolean> {
    return this.databaseLayer.destroy(id)
  }

  destroyAll() {
    return this.databaseLayer.destroyAll()
  }

  find(id: number|string) {
    return this.databaseLayer.find(id).then(res => (res ? Types.toModelValue(this.columnMapping, res) : null))
  }

  findBy(where = {}) {
    return this.databaseLayer.findBy(where).then(res => (res ? Types.toModelValue(this.columnMapping, res) : null))
  }

  query(options = {}) {
    return this.databaseLayer.query(options).then(
        (res) => {
          const _rows: any[] = [];
          for (let i: number = 0; i <= res.length; i++) {
              _rows.push(Types.toModelValue(this.columnMapping, res.item(i)))
          }

          return _rows
        }
    )
  }

  _sanitize(obj: ModelObject): ModelObject {
    const allowedKeys: string[] = Object.keys(this.columnMapping);
    return Object.keys(obj).reduce((ret, key) => {
      return allowedKeys.includes(key) ? { ...ret, [key]: obj[key] } : ret
    }, {})
  }
}
