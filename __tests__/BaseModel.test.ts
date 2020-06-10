import {WebSQLDatabase} from "expo-sqlite";

jest.mock('../src/Repository')
import BaseModel, {Columns} from '../src/BaseModel'
import {DataTypes, types} from '../src/DataTypes'
import Repository from '../src/Repository'



const database = jest.fn((): WebSQLDatabase => ({
    exec: () => {},
    transaction: () => {},
    version: 'test',
    readTransaction: () => {}
}))

describe('setProperties', () => {
  it('should not set with empty columnMapping', () => {
    const bm = new BaseModel()
    bm.setProperties({ id: 1, nome: 'Daniel' })
    expect(bm.id).toBeUndefined()
    expect(bm.nome).toBeUndefined()
  })

  it('should set the properties', () => {
    class Tmp extends BaseModel {
      get columnMapping(): Columns {
        return {
          id: { type: DataTypes.INTEGER },
          nome: {type: DataTypes.TEXT},
          email: {type: DataTypes.TEXT},
          active: {type: DataTypes.BOOLEAN},
          timestamp: { type: DataTypes.DATETIME,  default: () => '123456' } }
      }
    }

    const tmp = new Tmp({ id: 1, nome: 'Daniel', email: '', active: false })
    // const ret = tmp.setProperties()
    expect(tmp.id).toBe(1)
    expect(tmp.nome).toBe('Daniel')
    expect(tmp.timestamp).toBe('123456')
    expect(tmp.email).toBe('')
    expect(tmp.active).toBe(false)
    expect(tmp).toBeInstanceOf(BaseModel)
  })

  it('should set the properties in the constructor', () => {
    class Tmp extends BaseModel {
      get columnMapping() {
        return {id: { type: DataTypes.INTEGER }, nome: {type: DataTypes.TEXT} }
      }
    }

    const tmp = new Tmp({ id: 1, nome: 'Daniel' })
    expect(tmp.id).toBe(1)
    expect(tmp.nome).toBe('Daniel')
  })
})

describe('getters', () => {
  it('database should thows an error', () => {
    expect(() => (new BaseModel).database).toThrow('Database não definida')
  })

  it('tableName should thows an error', () => {
    expect(() => (new BaseModel).tableName).toThrow('tableName não definido')
  })

  it('columnMapping should returns an empty object', () => {
    expect((new BaseModel).columnMapping).toEqual({})
  })
  it('repository should returns an instance of Repository', () => {
    class Tmp extends BaseModel {
      get database(): WebSQLDatabase {
        return database()
      }

      get tableName() {
        return 'tests'
      }

      get repository() {
        return new Repository(this.database, this.tableName, this.columnMapping)
      }
    }

    const tmp = (new Tmp);

    expect(tmp.repository).toMatchObject(new Repository(database(), 'tests', {}))
  })
})

describe('actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  });

  class Tmp extends BaseModel {
    get database(): WebSQLDatabase {
      return database()
    }

    get tableName(): string {
      return 'tests'
    }

    get columnMapping() :Columns {
      return {
        id: { type: DataTypes.INTEGER },
        nome: { type: DataTypes.TEXT }
      }
    }
  }


  it('createTable', () => {

    const tmp = (new Tmp);
    // jest.spyOn(tmp, 'database', 'get').mockImplementation((): WebSQLDatabase => ({
    //     exec: () => {},
    //     transaction: () => {},
    //     version: 'test',
    //     readTransaction: () => {}
    // }));
    const spyModel = jest.spyOn(Tmp, 'getInstance').mockImplementation((): BaseModel => tmp);

    Tmp.createTable();
    expect(tmp.repository.createTable).toHaveBeenCalledTimes(1)
  })

  it('dropTable', () => {
    Tmp.dropTable()
    expect((new Tmp).repository.dropTable).toHaveBeenCalledTimes(1)
  })

  it('create', () => {
    const obj = { id: 1, nome: 'Daniel' }
    return Tmp.create(obj)
      .then(res => {
        expect(res.repository.insert).toHaveBeenCalledTimes(1)
        expect(res.repository.insert).toBeCalledWith(obj)
        expect(res).toBeInstanceOf(Tmp)
      })
  })

  it('update', () => {
    const obj = { id: 1, nome: 'Daniel' }
    return Tmp.update(obj)
      .then(res => {
        expect(res.repository.update).toHaveBeenCalledTimes(1)
        expect(res.repository.update).toBeCalledWith(obj)
        expect(res).toBeInstanceOf(Tmp)
      })
  })

  describe('save', () => {
    it('without id', () => {
      const tmp = new Tmp({ nome: 'Daniel' })
      return tmp.save().then(res => {
        expect(res.repository.insert).toHaveBeenCalledTimes(1)
        expect(res.repository.insert).toBeCalledWith(tmp)
        expect(res.repository.update).toHaveBeenCalledTimes(0)
        expect(res).toBeInstanceOf(Tmp)
      })
    })

    it('with id', () => {
      const tmp = new Tmp({ id: 1, nome: 'Daniel' })
      return tmp.save().then(res => {
        expect(res.repository.update).toHaveBeenCalledTimes(1)
        expect(res.repository.update).toBeCalledWith(tmp)
        expect(res.repository.insert).toHaveBeenCalledTimes(0)
        expect(res).toBeInstanceOf(Tmp)
      })
    })
  })

  describe('destroy', () => {
    it('instance method', () => {
      const tmp = new Tmp({ id: 1, nome: 'Daniel' });
      return tmp.destroy().then(res => {
        expect(tmp.repository.destroy).toHaveBeenCalledTimes(1);
        expect(tmp.repository.destroy).toBeCalledWith(1);
        expect(res).toBeTruthy()
      })
    })

    it('static method', () => {
      const tmp = (new Tmp);
      const spyModel = jest.spyOn(Tmp, 'getInstance').mockImplementation((): BaseModel => tmp);

      return Tmp.destroy(1).then(res => {
        expect(tmp.repository.destroy).toHaveBeenCalledTimes(1)
        expect(tmp.repository.destroy).toBeCalledWith(1)
        expect(res).toBeTruthy()
      })
    })

    it('destroyAll', () => {
      const tmp = (new Tmp);
      // const spyDestroyAll = jest.spyOn(tmp, 'destroyAll');

      const spyModel = jest.spyOn(Tmp, 'getInstance').mockImplementation((): BaseModel => tmp);

      return Tmp.destroyAll().then(res => {
        expect(tmp.repository.destroyAll).toHaveBeenCalledTimes(1)
        expect(tmp.repository.destroyAll).toBeCalledWith()
        expect(res).toBeTruthy()
      })
    })
  })

  describe('find', () => {
    it('found', () => {
        const tmp = (new Tmp);
        const spyModel = jest.spyOn(Tmp, 'getInstance').mockImplementation((): BaseModel => tmp);

        return Tmp.find(1).then(res => {
        expect(tmp.repository.find).toHaveBeenCalledTimes(1)
        expect(tmp.repository.find).toBeCalledWith(1)
        expect(res).toBeInstanceOf(Tmp)
      })
    })

    it('not found', () => {
      const tmp = (new Tmp);
      const spyModel = jest.spyOn(Tmp, 'getInstance').mockImplementation((): BaseModel => tmp);

      return Tmp.find(999).then(res => {
        expect(tmp.repository.find).toHaveBeenCalledTimes(1);
        expect(tmp.repository.find).toBeCalledWith(999);
        expect(res).toBeNull()
      })
    })
  })

  describe('findBy', () => {
    it('found', () => {
      const tmp = (new Tmp);
      const spyModel = jest.spyOn(Tmp, 'getInstance').mockImplementation((): BaseModel => tmp);

      const where = { numero_eq: 12345, codigo_verificacao_eq: 'AXJFSD' }
      return Tmp.findBy(where).then(res => {
        expect(tmp.repository.findBy).toHaveBeenCalledTimes(1)
        expect(tmp.repository.findBy).toBeCalledWith(where)
        expect(res).toBeInstanceOf(Tmp)
      })
    })

    it('not found', () => {
      const tmp = (new Tmp);
      const spyModel = jest.spyOn(Tmp, 'getInstance').mockImplementation((): BaseModel => tmp);
      const where = { numero_eq: 999 }
      return Tmp.findBy(where).then(res => {
        expect(tmp.repository.findBy).toHaveBeenCalledTimes(1)
        expect(tmp.repository.findBy).toBeCalledWith(where)
        expect(res).toBeNull()
      })
    })
  })

  describe('query', () => {
    it('empty options', () => {
      const tmp = (new Tmp);
      const spyModel = jest.spyOn(Tmp, 'getInstance').mockImplementation((): BaseModel => tmp);
      return Tmp.query({}).then(res => {
        expect(tmp.repository.query).toHaveBeenCalledTimes(1)
        expect(tmp.repository.query).toBeCalledWith({})
        expect(res).toEqual([])
      })
    })

    it('not empty options', () => {
      const tmp = (new Tmp);
      const spyModel = jest.spyOn(Tmp, 'getInstance').mockImplementation((): BaseModel => tmp);
      const options = { columns: '*', where: { nome_cont: '%Daniel%' } }
      return Tmp.query(options).then(res => {
        expect(tmp.repository.query).toHaveBeenCalledTimes(1)
        expect(tmp.repository.query).toBeCalledWith(options)
        expect(res).toEqual([])
      })
    })
  })
})
