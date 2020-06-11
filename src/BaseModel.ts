import Repository, {ModelObject} from './Repository'
import {WebSQLDatabase} from "expo-sqlite/build/index";
import {DataTypes} from "./DataTypes";
import {Options, Where} from "./query_builder/read";

const isFunction = (p: any) =>
  Object.prototype.toString.call(p) === '[object Function]'

export interface Column {
    type: DataTypes,
    primary_key?: boolean,
    not_null?: boolean,
    unique?: boolean,
    default?: () => any
}

export interface Columns {
    [key:  string]: Column
}

export interface Props {
    [key:  string]: any
}

export default class BaseModel {

  protected primaryKey: string = 'id';
  public properties: Props = [];

  [key: string]: any;

  constructor(obj: object = {}) {
    this.setProperties(obj);
    let handler = {
          get: (target: BaseModel, prop: string, receiver: any) => {
              if(this[prop] === undefined && target.properties[prop] !== undefined) {
                  return target.properties[prop];
              }

              return Reflect.get(target, prop, receiver);
          }
    }
    return new Proxy(this, handler);
  }

  setProperties(props: Props) {
    const cm = this.columnMapping;
    Object.keys(cm).forEach(k => {
      if (props[k] !== undefined) {
        // const my = BaseModel.getInstance() as BaseModel & { [key: string]: string };
        this.properties[k] = props[k]
      } else if (isFunction(cm[k].default)) {
          let def =  cm[k].default;

          if (def) {
              def = def.bind(this);
              this.properties[k] = def();
          }
      } else {
          this.properties[k] = null
      }
    })
    return this
  }

  getPrimaryKey(): string {
     return this[this.primaryKey];
  }

  get database(): WebSQLDatabase {
      throw new Error('Database não definida')
  };

  get repository() {
    return new Repository(this.database, this.tableName, this.columnMapping)
  }

  get tableName(): string {
      throw new Error('tableName não definido')
  }

  get columnMapping(): Columns {
      return {}
  }

  static createTable() {
    return this.getInstance().repository.createTable()
  }

  static dropTable() {
      return this.getInstance().repository.dropTable()
  }

  static create(obj: ModelObject) {
    const model = this.getInstance();
    return model.repository.insert(obj).then(res => model.setProperties(res))
  }

  static update(obj: ModelObject) {
    const model = this.getInstance();
    const { [model.primaryKey]: primaryKey, ...props } = obj;

    return model.repository.update({...props, primaryKey}).then(res => model.setProperties(res))
  }

  save() {
    if (this.getPrimaryKey()) {

      const { [this.primaryKey]: primaryKey, ...properties } = this.properties;

      return this.repository
        .update({...properties, primaryKey})
        .then(res => this.setProperties(res))
    } else {
      return this.repository
        .insert(this)
        .then(res => this.setProperties(res))
    }
  }

  destroy(): Promise<boolean> {
    return this.repository.destroy(this.getPrimaryKey())
  }

  static destroy(id: string|number) {
    return this.getInstance().repository.destroy(id)
  }

  static destroyAll() {
      const model = this.getInstance();
      return model.repository.destroyAll()
  }

  static find(id: string|number) {
      const model = this.getInstance();
      return model.repository.find(id).then(res => (res ? model.setProperties(res) : res))
  }

  static findBy(where: Where) {
      const model = this.getInstance();
      return model.repository
      .findBy(where)
      .then(res => (res ? model.setProperties(res) : res))
  }


  /**
   * @param options
   */
  static query(options: Options) {
    return this.getInstance().repository.query(options)
  }

  public static getInstance(): BaseModel {
      return (new this);
  }
}
