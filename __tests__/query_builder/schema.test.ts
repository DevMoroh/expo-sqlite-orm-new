import {
  _createTableColumns,
  createTable,
  dropTable
} from '../../src/query_builder/schema'
import {DataTypes, types} from '../../src/DataTypes'
import {Columns} from "../../src/BaseModel";

const columnMapping: Columns = {
  id: { type: DataTypes.INTEGER, primary_key: true },
  numero: { type: DataTypes.INTEGER, unique: true, not_null: true },
  codigo_verificacao: { type: DataTypes.TEXT },
  created_at: { type: DataTypes.DATETIME, not_null: true },
  checklist: { type: DataTypes.JSON }
}

describe('create table', () => {
  const expectedColumns =
    'id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, numero INTEGER UNIQUE NOT NULL, codigo_verificacao TEXT, created_at DATETIME NOT NULL, checklist TEXT'
  it('columns string to create a table', () => {
    const ret = _createTableColumns(columnMapping)
    expect(ret).toBe(expectedColumns)
  })

  it('create table statement', () => {
    const ret = createTable('tests', columnMapping)
    const expected = `CREATE TABLE IF NOT EXISTS tests (${expectedColumns});`
    expect(ret).toBe(expected)
  })
})

describe('drop table', () => {
  it('drop table statement', () => {
    const ret = dropTable('tests')
    const expected = `DROP TABLE IF EXISTS tests;`
    expect(ret).toBe(expected)
  })
})
