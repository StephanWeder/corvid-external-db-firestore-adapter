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
      //console.log("we arrived at the filter")
      for (filterOp of filter.value) {
       // console.log("we are inside the filter query appending all queries")
        partQuery.push(parseInternal(filterOp, query, collId));
        // - > this is the original code: fiteredQuery = parseInternal(filterOp, query);
        };

      //console.log("this is the final partQuery array list")
      //console.log(partQuery)
      for (i = 0; i < partQuery.length; i++) {
        //console.log(i)
        console.log(partQuery[i][0])
        console.log(partQuery[i][1])
        console.log(partQuery[i][2])
        console.log(typeof(partQuery[i][2]))
        if (collId === "allCompanies"){
          return partQuery[i][2]
        } else{
          fiteredQuery = fiteredQuery.where(partQuery[i][0],partQuery[i][1], partQuery[i][2])
          //console.log("after loup")
          //console.log(fiteredQuery)
        }
      }
      //console.log("this is the final query")
      //console.log(fiteredQuery)
      //return value ? `(${value})` : value;



      /**
       * This is special implementation for companyfinder.professional.ch to enablie Jobad Title Filter, SW, 01.09.2020
       */
      //console.log("here is collection name:")
      //onsole.log(collId)
      if (collId === "allJobads") {
        fiteredQuery = fiteredQuery//.select(["job_company_id","correct_job_url","job_title"])
      }

      var myCustomQuery
      /* if (collId === "allJobads") {
        let doc_ids = []
        console.log("inside special allJobads Filter!")
        myCustomQuery = fiteredQuery.select('job_company_id').limit(100).offset(0).get().then(() => {
        console.log("next")
          a = 1
          for(const doc of myCustomQuery.docs){
            console.log(doc.id, '=>', doc.data());
            doc_ids.push(doc.data()["job_company_id"])
          }
        })
    
        //for (var i in querySnapshot.docs) {
        
            // doc.data() is never undefined for query doc snapshots
        //    console.log("iterating over docs and then printing docs_ids")
        //    console.log(querySnapshot.docs[i])
        //    doc_ids.push(querySnapshot.docs[i]["job_company_id"])
            //if (a === querySnapshot.size) {
            //  return firestore.collection('allCompanies').where('company_id', "in", doc_ids)
            //}
            //a = a + 1
        //}
        //for i in results
        console.log(doc_ids)
        return firestore.collection('allCompanies').where('company_id', "in", "40000006")
          //fiteredQuery = companies
        
        //fiteredQuery = companies
          
      
      //Promise.all([myCustomQuery]).then(() => {
      //  console.log("returning if Jobads")
      //  return firestore.collection('allCompanies').where('company_id', "in", doc_ids)
      //});
      console.log("returning" + collId)
      //return fiteredQuery
    } else {

      return fiteredQuery;
    }
    Promise.all([myCustomQuery]).then(() => {
      console.log("first dead end...")
    }); */
    console.log("dead end...")
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
      filter_value = filter.value
      return [`${filter.fieldName}`, "array-contains-any", filter_value];
    case '$in':
      filter_value = filter.value
      return [`${filter.fieldName}`, "in", filter_value];
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


