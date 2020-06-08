import QueryBuilder from './query_builder'
import {WebSQLDatabase} from "expo-sqlite";
import {SQLError, SQLResultSet, SQLTransaction} from "expo-sqlite/src/SQLite.types";
import {ModelObject} from "./Repository";
import {Columns} from "./BaseModel";
import {Options, Where} from "./query_builder/read";

export default class DatabaseLayer {

  public database: WebSQLDatabase;
  public tableName: string;

  constructor(database: WebSQLDatabase, tableName: string) {
    this.database = database;
    this.tableName = tableName
  }

  async executeBulkSql(sqls: string[], params: any[] = []): Promise<any> {
    const database = this.database;
    return new Promise((txResolve, txReject) => {
      database.transaction(tx => {
        Promise.all(sqls.map((sql: string, index: number) => {
          return new Promise((sqlResolve, sqlReject) => {
            tx.executeSql(
              sql,
              params[index],
              (_, resultSet) => {
                sqlResolve(resultSet)
              },
              (transaction: SQLTransaction, error: SQLError): boolean => {
                sqlReject(error);
                return false;
              }
            )
          })
        })).then(txResolve).catch(txReject)
      })
    })
  }

  async executeSql(sql: string, params: any[] = []): Promise<any> {
    return this.executeBulkSql([sql], [params])
      .then(res => res[0])
      .catch(errors => { throw errors })
  }

  createTable(columnMapping: Columns): Promise<boolean> {
    const sql = QueryBuilder.createTable(this.tableName, columnMapping)
    return this.executeSql(sql).then(() => true)
  }

  dropTable() {
    const sql = QueryBuilder.dropTable(this.tableName)
    return this.executeSql(sql).then(() => true)
  }

  insert(obj: ModelObject) {
    const sql = QueryBuilder.insert(this.tableName, obj)
    const params = Object.values(obj)
    return this.executeSql(sql, params).then(({ insertId }) => this.find(insertId))
  }

  update(obj) {
    const sql = QueryBuilder.update(this.tableName, obj)
    const { id, ...props } = obj
    const params = Object.values(props)
    return this.executeSql(sql, [...params, id])
  }

  bulkInsertOrReplace(objs: ModelObject[]) {
    const list = objs.reduce((accumulator, obj) => {
      const params = Object.values(obj);
      accumulator.sqls.push(QueryBuilder.insertOrReplace(this.tableName, obj))
      accumulator.params.push(params);
      return accumulator
    }, { sqls: [], params: [] })
    return this.executeBulkSql(list.sqls, list.params)
  }

  destroy(id: string|number): Promise<any> {
    const sql = QueryBuilder.destroy(this.tableName)
    return this.executeSql(sql, [id]).then(() => true)
  }

  destroyAll() {
    const sql = QueryBuilder.destroyAll(this.tableName)
    return this.executeSql(sql).then(() => true)
  }

  find(id: string|number) {
    const sql = QueryBuilder.find(this.tableName)
    return this.executeSql(sql, [id]).then(({ rows }) => rows[0])
  }

  findBy(where: Where = {}) {
    const options = { where, limit: 1 }
    const sql = QueryBuilder.query(this.tableName, options)
    const params = Object.values(options.where)
    return this.executeSql(sql, params).then(({ rows }) => rows[0])
  }

  query(options: Options = {}) {
    const sql = QueryBuilder.query(this.tableName, options)
    const params = Object.values(options.where || {})
    return this.executeSql(sql, params).then(({ rows }) => rows)
  }
}
