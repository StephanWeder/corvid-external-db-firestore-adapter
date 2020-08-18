const BadRequestError = require('../../model/error/bad-request');
const EMPTY = '';
 


exports.parseFilter = (filter, query) => {
  if (filter && filter.operator) {
    return  parseInternal(filter, query);
    //return parsed ? `WHERE ${parsed}` : EMPTY;
  }
  return query;
};

const parseInternal = (filter, query) => {

  switch (filter.operator) {

    case '$and': {
      let partQuery = [];
      let fiteredQuery = query;
      console.log("we arrived at the filter")
      filter.value.forEach( filterOp => {
        console.log("we are inside the filter query appending all queries")
        partQuery.push(parseInternal(filterOp, query));
        //fiteredQuery = parseInternal(filterOp, query);
        });
      console.log("this is the final partQuery array list")
      console.log(partQuery)
      for (i = 0; i < partQuery.length; i++) {
        fiteredQuery = fiteredQuery.where(partQuery[i][0],partQuery[i][1],partQuery[i][2])
      }
      console.log("this is the final query")
      console.log(fiteredQuery)
      //return value ? `(${value})` : value;
      return fiteredQuery;
    }
    
    case '$or': {
      const value = filter.value.map(parseInternal).join(' OR ');
      return value ? `(${value})` : value;
    }
    // case '$not': {
    //   const value = parseInternal(filter.value);
    //   return value ? `NOT (${value})` : value;
    // }
    // case '$ne':
    //   return query.where(`${filter.fieldName}`, '!=', `${mapValue(filter.value)}`);
    case '$lt':
      return [`${filter.fieldName}`, "<", `${mapValue(filter.value)}`];
    case '$lte':
      return [`${filter.fieldName}`,  "<=", `${mapValue(filter.value)}`];
    case '$gt':
      return [`${filter.fieldName}`, '>', `${mapValue(filter.value)}`];
    case '$gte':
      return [`${filter.fieldName}`, '>=', `${mapValue(filter.value)}`];
    case '$hasSome':
    case '$contains': {
      const list = filter.value
        .map(mapValue)
        .map(date => date)
        .join(', ')
      return list ? `${filter.fieldName} IN (${list})` : EMPTY
    }
    // case '$urlized': {
    //   const list = filter.value.map(s => s.toLowerCase()).join('[- ]')
    //   return list ? `LOWER(${filter.fieldName}) RLIKE '${list}'` : EMPTY
    // }
    // case '$startsWith':
    //   return `${filter.fieldName} LIKE ${mysql.escape(`${filter.value}%`)}`
    // case '$endsWith':
    //   return `${filter.fieldName} LIKE ${mysql.escape(`%${filter.value}`)}`
    case '$eq': {
      console.log("fieldname")
      console.log(filter.fieldName)
      return filter.value === null || filter.value === undefined
        ? `${filter.fieldName} IS NULL`
        : [`${filter.fieldName}`, '==', `${mapValue(filter.value)}`];
    }
    default:
      throw new BadRequestError(
        `Filter of type ${filter.operator} is not supported.`
      )
  }
}

const mapValue = value => {
  return Date.parse(value) ? new Date(value) : value
}
