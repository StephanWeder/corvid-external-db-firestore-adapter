const Firestore = require('@google-cloud/firestore');
const BadRequestError = require('../../model/error/bad-request');
const EMPTY = '';
 
const firestore = new Firestore({
  // client_email: serviceAccount.client_email,
  // private_key: serviceAccount.private_key,
  // projectId: serviceAccount.project_id,
});

exports.parseFilter = (filter, query, collId) => {
  if (filter && filter.operator) {
    return  parseInternal(filter, query, collId);
    //return parsed ? `WHERE ${parsed}` : EMPTY;
  }
  return query;
};

const parseInternal = (filter, query, collId) => {

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
        console.log(i)
        console.log(partQuery[i][0])
        console.log(partQuery[i][1])
        console.log(partQuery[i][2])
        console.log(typeof(partQuery[i][2]))
        fiteredQuery = fiteredQuery.where(partQuery[i][0],partQuery[i][1], partQuery[i][2])
        console.log("after loup")
        console.log(fiteredQuery)
      }
      console.log("this is the final query")
      console.log(fiteredQuery)
      //return value ? `(${value})` : value;



      /**
       * This is special implementation for companyfinder.professional.ch to enablie Jobad Title Filter, SW, 01.09.2020
       */
      console.log("here is collection name:")
      console.log(collId)
      if (collId === "allJobads") {
        let doc_ids = []
        console.log("inside special allJobads Filter!")
        fiteredQuery.limit(100).offset(0).get().then((querySnapshot) => {
          console.log("next")
          a = 1
          querySnapshot.forEach((doc) =>{
              // doc.data() is never undefined for query doc snapshots
              console.log("iterating over docs and then printing docs_ids")
              doc_ids.push(doc.get("job_company_id"))
              if (a === querySnapshot.size) {
                return firestore.collection('allCompanies').where('company_id', "in", doc_ids)
              }
              a = a + 1
          })
          //for i in results
          console.log(doc_ids)
          //return firestore.collection('allCompanies').where('company_id', "in", doc_ids)
            //fiteredQuery = companies
          
          //fiteredQuery = companies
          
      })
      console.log("returning" + collId)
      //return fiteredQuery
    } else {

      return fiteredQuery;
    }
    console.log("dead end...")
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
      filter_value = filter.value
      return [`${filter.fieldName}`, "array-contains", filter_value[0]];
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
