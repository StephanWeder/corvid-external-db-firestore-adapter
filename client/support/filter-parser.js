const Firestore = require('@google-cloud/firestore');
const client = require('../client/firestore');
const BadRequestError = require('../../model/error/bad-request');
const EMPTY = '';
 


exports.parseFilter = (filter, query) => {
  if (filter && filter.operator) {
    return  parseInternal(filter, query);
    //return parsed ? `WHERE ${parsed}` : EMPTY;
  }
  return query;
};

const parseInternal = (filter, query, colName) => {

  switch (filter.operator) {

    case '$and': {
      let partQuery = [];
      let fiteredQuery = query;
      console.log("we arrived at the filter")
      filter.value.forEach( filterOp => {
        console.log("we are inside the filter query appending all queries")
        partQuery.push(parseInternal(filterOp, query));
        // - > this is the original code: fiteredQuery = parseInternal(filterOp, query);
        });

      console.log("this is the final partQuery array list")
      console.log(partQuery)
      for (i = 0; i < partQuery.length; i++) {
        fiteredQuery = fiteredQuery.where(partQuery[i][0],partQuery[i][1],partQuery[i][2])
      }
      console.log("this is the final query")
      console.log(fiteredQuery)
      //return value ? `(${value})` : value;



      /**
       * This is special implementation for companyfinder.professional.ch to enablie Jobad Title Filter, SW, 01.09.2020
       */
      if (colName === "allJobads") {
        let doc_ids = []
        let results = fiteredQuery.limit(query.limit).offset(query.skip).get().then(function(querySnapshot) {
          querySnapshot.forEach(function(doc) {
              // doc.data() is never undefined for query doc snapshots
              doc_ids.push(doc.id)
              console.log(doc.id, " => ", doc.data());
          });
        //for i in results
        let companies = Firestore.collection('allCompanies').where('_name_', 'in', doc_ids)
        fiteredQuery = companies

      })
    }

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
      if (typeof(filter.value) === 'number'){
        return [`${filter.fieldName}`, "<", filter.value];
      } else {
        return [`${filter.fieldName}`, "<", `${mapValue(filter.value)}`];
      }
    case '$lte':
      if (typeof(filter.value) === 'number'){
        return [`${filter.fieldName}`,  "<=", filter.value];
      } else {
        return [`${filter.fieldName}`,  "<=", `${mapValue(filter.value)}`];
      }
    case '$gt':
      if (typeof(filter.value) === 'number'){
        return [`${filter.fieldName}`, ">", filter.value];
      } else {
        return [`${filter.fieldName}`, ">", `${mapValue(filter.value)}`];
      }
    case '$gte':
      if (typeof(filter.value) === 'number'){
        return [`${filter.fieldName}`, ">=", filter.value];
      } else {
        return [`${filter.fieldName}`, ">=", `${mapValue(filter.value)}`];
      }
    // PRO: Used for querying Job titles in a more sophisticated way
    case '$hasSome':
      return [`${filter.fieldName}`, "array-contains-any"]
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
      console.log(typeof(filter.value))
      if (typeof(filter.value) === 'number'){
        return filter.value === null || filter.value === undefined
          ? `${filter.fieldName} IS NULL`
          : [`${filter.fieldName}`, '==', filter.value];
      } else {
        return filter.value === null || filter.value === undefined
          ? `${filter.fieldName} IS NULL`
          : [`${filter.fieldName}`, '==', `${mapValue(filter.value)}`];
      }
    }
    default:
      throw new BadRequestError(
        `Filter of type ${filter.operator} is not supported.`
      )
  }
}

const mapValue = value => {
  //return Date.parse(value) ? new Date(value) : value
  return Date.parse(value) ? value : value
}

console.log(typeof(10))
