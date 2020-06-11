// Creates the "Update" sql statement

import {UpdateObject} from "../Repository";

export function update(tableName: string, object: UpdateObject): string {
  const { primaryKey, ...props } = object;
  const values = Object.keys(props)
    .map(k => `${k} = ?`)
    .join(', ');

  return `UPDATE ${tableName} SET ${values} WHERE ${primaryKey} = ?;`
}

export default { update }
