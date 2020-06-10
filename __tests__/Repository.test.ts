import {WebSQLDatabase} from "expo-sqlite";

jest.mock('../src/DatabaseLayer')
import Repository from '../src/Repository'
import Types, { DataTypes } from '../src/DataTypes'
import DatabaseLayer from '../src/DatabaseLayer'
import {Columns} from "../src/BaseModel";

const columnMapping: Columns = {
  id: { type: DataTypes.INTEGER, primary_key: true },
  name: { type: DataTypes.TEXT }
}

const database = jest.fn((): WebSQLDatabase => ({
    exec: () => {},
    transaction: () => {},
    version: 'test',
    readTransaction: () => {}
}))

describe('constructor', () => {
  it('should not set props', () => {
    const _database = database();
    const repository = new Repository(_database, 'test', columnMapping)
    expect(repository.columnMapping).toEqual(columnMapping)
    expect(repository.databaseLayer).toEqual(new DatabaseLayer(_database, 'test'))
    expect(DatabaseLayer.prototype.constructor).toHaveBeenCalledWith(_database, 'test')
  })
})


describe('actions', () => {
  let repository
  beforeEach(() => {
    repository = new Repository(database(), 'test', columnMapping)
    jest.clearAllMocks()
  })

  it('createTable', () => {
    repository.createTable()
    expect(repository.databaseLayer.createTable).toHaveBeenCalledTimes(1)
    expect(repository.databaseLayer.createTable).toBeCalledWith(columnMapping)
  })

  it('dropTable', () => {
    repository.dropTable()
    expect(repository.databaseLayer.dropTable).toHaveBeenCalledTimes(1)
  })

  it('insert', () => {
    const obj = { id: 1, name: 'Daniel', email: 'test@test.com', other: { p1: 'asd' } }
    const objSanitized = { id: 1, name: 'Daniel', other: JSON.stringify({ p1: 'asd' }) }
    jest.spyOn(Types, 'toDatabaseValue').mockImplementationOnce(jest.fn(() => objSanitized))
    jest.spyOn(Types, 'toModelValue').mockImplementationOnce(jest.fn((p) => p))
    return repository.insert(obj).then(() => {
      expect(repository.databaseLayer.insert).toHaveBeenCalledTimes(1)
      expect(repository.databaseLayer.insert).toBeCalledWith(objSanitized)
      expect(Types.toModelValue).toBeCalledWith(columnMapping, objSanitized)
    })
  })

  it('update', () => {
    const obj = { id: 1, name: 'Daniel', email: 'test@test.com' }
    const objSanitized = { id: 1, name: 'Daniel' }
    jest.spyOn(Types, 'toDatabaseValue').mockImplementationOnce(jest.fn(() => objSanitized))
    repository.update(obj)
    expect(repository.databaseLayer.update).toHaveBeenCalledTimes(1)
    expect(repository.databaseLayer.update).toBeCalledWith(objSanitized)
  })

  it('destroy', () => {
    repository.destroy(2)
    expect(repository.databaseLayer.destroy).toHaveBeenCalledTimes(1)
    expect(repository.databaseLayer.destroy).toBeCalledWith(2)
  })

  it('destroyAll', () => {
    repository.destroyAll()
    expect(repository.databaseLayer.destroyAll).toHaveBeenCalledTimes(1)
  })

  describe('find', () => {
    it('found', () => {
      jest.spyOn(Types, 'toModelValue').mockImplementationOnce(jest.fn((_, p) => p))
      return repository.find(999).then(res => {
        expect(Types.toModelValue).toBeCalledWith(columnMapping, { id: 999 })
        expect(repository.databaseLayer.find).toHaveBeenCalledTimes(1)
        expect(repository.databaseLayer.find).toBeCalledWith(999)
        expect(res).toEqual({ id: 999 })
      })
    })

    it('not found', () => {
      jest.spyOn(Types, 'toModelValue').mockImplementationOnce(jest.fn((_, p) => p))
      return repository.find(1).then(res => {
        expect(Types.toModelValue).not.toBeCalled()
        expect(repository.databaseLayer.find).toHaveBeenCalledTimes(1)
        expect(repository.databaseLayer.find).toBeCalledWith(1)
        expect(res).toEqual(null)
      })
    })
  })

  describe('findBy', () => {
    it('found', () => {
      jest.spyOn(Types, 'toModelValue').mockImplementationOnce(jest.fn((_, p) => p))
      return repository.findBy({ numero_eq: 999 }).then(res => {
        expect(Types.toModelValue).toBeCalledWith(columnMapping, { id: 999, numero: 999 })
        expect(repository.databaseLayer.findBy).toHaveBeenCalledTimes(1)
        expect(repository.databaseLayer.findBy).toBeCalledWith({ numero_eq: 999 })
        expect(res).toEqual({ id: 999, numero: 999 })
      })
    })

    it('not found', () => {
      jest.spyOn(Types, 'toModelValue').mockImplementationOnce(jest.fn((_, p) => p))
      return repository.findBy().then(res => {
        expect(Types.toModelValue).not.toBeCalled()
        expect(repository.databaseLayer.findBy).toHaveBeenCalledTimes(1)
        expect(repository.databaseLayer.findBy).toBeCalledWith({})
        expect(res).toEqual(null)
      })
    })
  })

  describe('query', () => {
    it('found', () => {
      jest.spyOn(Types, 'toModelValue').mockImplementationOnce(jest.fn((_, p) => p))
      const options = { where: { status_eq: 'ativo' } }
      return repository.query(options).then(res => {
        expect(Types.toModelValue).toHaveBeenNthCalledWith(1, columnMapping, { id: 2 })
        expect(Types.toModelValue).toHaveBeenNthCalledWith(2, columnMapping, { id: 3 })
        expect(repository.databaseLayer.query).toHaveBeenCalledTimes(1)
        expect(repository.databaseLayer.query).toBeCalledWith(options)
        expect(res).toEqual([{ id: 2 }, { id: 3 }])
      })
    })

    it('not found', () => {
      jest.spyOn(Types, 'toModelValue').mockImplementationOnce(jest.fn((_, p) => p))
      return repository.query().then(res => {
        expect(Types.toModelValue).not.toBeCalled()
        expect(repository.databaseLayer.query).toHaveBeenCalledTimes(1)
        expect(repository.databaseLayer.query).toBeCalledWith({})
        expect(res).toEqual([])
      })
    })

    it('sanitize', () => {
      const obj = {
        id: 1,
        name: 'Daniel',
        teste2: 3.5,
        teste3: { prop: 123 },
        abacaxi: 'amarelo'
      }
      const expected = {
        id: 1,
        name: 'Daniel'
      }
      const response = repository._sanitize(obj)
      expect(response).toEqual(expected)
    })
  })
})
