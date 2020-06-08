const defaultOptions = {
  columns: '*',
  page: null,
  limit: 30,
  where: {},
  order: 'id DESC'
}

// Creates the "SELECT" sql statement for find one record
export function find(tableName: string): string {
  return `SELECT * FROM ${tableName} WHERE id = ? LIMIT 1;`
}

export type Options = {
    columns?: string;
    page?: number;
    limit?: number;
    where?: Where;
    order?: string;
};

export type Where = {
    [name: string]: string | number | Date
}

export type WhereQuery = {
    where?: Where;
}


/* Creates the "SELECT" sql statement for query records
 * Ex: qb.query({
 *   columns: 'id, nome, status',
 *   where: {status_eq: 'encerrado'}
 * })
 */
export function query(tableName: string, options: Options = {}): string {
  const { columns, page, limit, where, order } = {
    ...defaultOptions,
    ...options
  }

  const whereStatement = queryWhere(where);
  let sqlParts: any[] = [
    'SELECT',
    columns,
    'FROM',
    tableName,
    whereStatement,
    'ORDER BY',
    order
  ];

  if(page !== null) {
    sqlParts.push(...[
      'LIMIT',
      limit,
      'OFFSET',
      limit * (page - 1)
    ])
  }

  return sqlParts.filter(p => p !== '').join(' ')
}

// Convert operators to database syntax
export function propertyOperation(statement: string) {

  type Operations = {
    [name: string]: string;
  }

  const operations: Operations = {
    eq: '=',
    neq: '<>',
    lt: '<',
    lteq: '<=',
    gt: '>',
    gteq: '>=',
    cont: 'LIKE'
  }
  const pieces = statement.split('_')
  const operation = pieces.pop()
  const property = pieces.join('_')
  if (!operation || !operations.hasOwnProperty(operation)) {
    throw new Error(
      'Operation not found, use (eq, neq, lt, lteq, gt, gteq, cont)'
    )
  }

  return `${property} ${operations[operation]}`
}

// Build where query
export function queryWhere(options: Where): string {
  const list = Object.keys(options).map(p => `${propertyOperation(p)} ?`)
  return list.length > 0 ? `WHERE ${list.join(' AND ')}` : ''
}

export default { find, query }
