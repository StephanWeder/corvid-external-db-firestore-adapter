const uuid = require('uuid/v4');
const BadRequestError = require('../model/error/bad-request');
const NotFoundError = require('../model/error/not-found');
const client = require('../client/firestore');
const Firestore = require('@google-cloud/firestore');

const firestore = new Firestore({
    // client_email: serviceAccount.client_email,
    // private_key: serviceAccount.private_key,
    // projectId: serviceAccount.project_id,
  });

exports.find = async payload => {

    console.log('got payload: ' + JSON.stringify(payload));
    var query = { collectionName, filter, sort, skip, limit } = payload;
   //var user_email = payload.filter.value[0].value
   
    if (!query.collectionName)
        throw new BadRequestError('Missing collectionName in request body')
    if (!query.skip && query.skip !== 0)
        throw new BadRequestError('Missing skip in request body')
    if (!query.limit) throw new BadRequestError('Missing limit in request body')
    
    if (query.collectionName === "allJobads"){
        key_words = payload.filter.value[0].value
        key_words = key_words[0].toLowerCase().split(" ")
        payload.filter.value[0].value = key_words
        user_email = payload.filter.value[1].value
        user_email = user_email.replace("@","at")
        user_email = user_email.replace(/\./g,"dot")
        user_email = user_email.replace(/_/g,"UL")
        user_email = user_email.replace(/[^a-zA-Z-]/g,"")
        console.log(user_email)
        payload.filter.value.splice(1,1)
        console.log(payload)
        var skip = payload.skip
        var limit = payload.limit
        // defining the skip & limit for query
        payload.skip = 0
        payload.limit = 5000
        let doc_ids = []
        const tmp_query = await client.query(query)
        //console.log(tmp_query)
        for(var doc of tmp_query.docs){
            //console.log(doc.id);
            doc_ids.push(doc.data()["job_company_id"])
            }
        if (doc_ids.length === 0){
            return {
                items: [],
                totalCount: 0
            }
        } else {
            //console.log(doc_ids)
            doc_ids = [...new Set(doc_ids)]
            var user_doc_ref = []
            var user_docs = []
            var user_company_ids = []
            for (var item of doc_ids){
                user_doc_ref.push(firestore.doc('userMatchingforCompanyFinder/'+ user_email + item))
                //console.log("creating usermatching references")
                //console.log("userMatchingforCompanyFinder/" + user_email + item)

            // console.log("quering user matching")
                //console.log(item)
                //var tmp_user_doc = await firestore.collection("userMatchingforCompanyFinder").where("company_id", "==", item).get()//.where("u_email", "==", "stephan.weder@outlook.com")
                //console.log(tmp_user_doc.docs[0].data())
                //console.log("hahahahahahahahahahahahhaahahah")
                //if (!tmp_user_doc.empty){
                //    for (let doc of tmp_user_doc.docs){
                //        //console.log("doc estists")
                //        user_docs.push(doc)
                        //console.log(1)
                        //console.log(tmp_user_doc.docs[0])
                //       user_company_ids.push(doc.data().company_id)
                        //console.log(2)
                        //console.log(user_company_ids)
                //    }
                    //console.log("iterrating")
                //} else {
                    //console.log("document does not exists")
                //}
            }
            console.log("before getting al usermatching docs")
            var userMatching = await firestore.getAll(...user_doc_ref)
            console.log("got all userMatching Docs")
            console.log(userMatching.length)
            //console.log(userMatching)
            var userDocIds = []
            for (var doc of userMatching){
                //console.log(doc)
                //console.log(typeof(doc))
                if (doc.exists){
                    //console.log("iterating over user Matching docs")
                    //console.log(doc.data())
                    userDocIds.push(doc.data()["company_id"])
                } else {
                    console.log("no document found")
                }
            }
            query = {"collectionName":"allCompanies", "filter":{"operator":"$and","value":[{"operator":"$in","fieldName":"company_id","value":userDocIds}]}, "sort":[],"skip":0,"limit":5000}
            const allCompanyiesDocs = await client.query(query)
            var allUserMatchings = userMatching.map(doc => { return wrapDates({_id: doc.id,  ...doc.data() }) })
            var allCompanies = allCompanyiesDocs.map(doc => { return wrapDates({_id: doc.id,  ...doc.data() }) })


            console.log("before merging")
            let finalArray = allUserMatchings.map((item, i) => Object.assign({}, item, allCompanies[i]));
            //console.log(finalArray)
            console.log("after merging")
            //reomoving "deleted items"
            finalArray = finalArray.filter(( obj ) => obj.delete.slice(-3) !== 'yes')
            console.log("after filter")
            finalArray = finalArray.sort((a, b) => b.sum_match_percentage - a.sum_match_percentage)
            console.log("after sort")
            sorted_IDs = []
            for (var id of finalArray.slice(0,500)){
                sorted_IDs.push(id.company_id)
            }
            console.log("after ids")
            TotalLength = finalArray.length
            finalArray = finalArray.slice(skip, limit)
            console.log("after slicing")
            finalArray.slice(-1)[0].doc_ids = sorted_IDs
            console.log("before returning")
                //query = query;
            //enhanced = await finalArray.map(doc => { return wrapDates({ ...doc.data(), _id: doc.id }) })
            return {
                items: finalArray,
                totalCount: TotalLength
            }
        }
    } 


    if (query.collectionName === "userMatchingforCompanyFinder"){
        var favourite = payload.filter.value[0].value
        if (favourite === "yes"){
            var skip = payload.skip
            var limit = payload.limit
            // defining the skip & limit for query
            payload.skip = 0
            payload.limit = 5000
            payload.filter.value[0].value = payload.filter.value[1].value + payload.filter.value[0].value

            const favourite_companies = await client.query(query)
            var doc_ids = []
            for(var doc of favourite_companies.docs){
                //console.log(doc.id);
                doc_ids.push(doc.data()["company_id"])
                }
            if (doc_ids.length === 0){
                return {
                    items: [],
                    totalCount: 0
                }
            } else {
                query = {"collectionName":"allCompanies", "filter":{"operator":"$and","value":[{"operator":"$in","fieldName":"company_id","value":doc_ids}]}, "sort":[],"skip":0,"limit":5000}
                const allCompanyiesDocs = await client.query(query)
                console.log("query successfully executed")
                var allUserMatchings = favourite_companies.docs.map(doc => { return wrapDates({_id: doc.id,  ...doc.data() }) })
                var allCompanies = allCompanyiesDocs.map(doc => { return wrapDates({_id: doc.id,  ...doc.data() }) })
        
        
                console.log("before merging")
                let finalArray = allUserMatchings.map((item, i) => Object.assign({}, item, allCompanies[i]));
                //console.log(finalArray)
                console.log("after merging")
                //reomoving "deleted items"
                finalArray = finalArray.filter(( obj ) => obj.delete.slice(-3) !== 'yes')
                finalArray = finalArray.sort((a, b) => b.sum_match_percentage - a.sum_match_percentage)
                sorted_IDs = []
                for (var id of finalArray.slice(0,500)){
                    sorted_IDs.push(id.company_id)
                }
                TotalLength = finalArray.length
                finalArray = finalArray.slice(skip, limit)
                finalArray.slice(-1)[0].doc_ids = sorted_IDs
                    //query = query;
                //enhanced = await finalArray.map(doc => { return wrapDates({ ...doc.data(), _id: doc.id }) })
                return {
                    items: finalArray,
                    totalCount: TotalLength
                }
            }
        } else {
            var skip = payload.skip
            var limit = payload.limit
            // defining the skip & limit for query
            payload.skip = 0
            payload.limit = 600

            const favourite_companies = await client.query(query)
            var doc_ids = []
            for(var doc of favourite_companies.docs){
                console.log(doc.id);
                doc_ids.push(doc.data()["company_id"])
                }
            query = {"collectionName":"allCompanies", "filter":{"operator":"$and","value":[{"operator":"$in","fieldName":"company_id","value":doc_ids}]}, "sort":[],"skip":0,"limit":5000}
            const allCompanyiesDocs = await client.query(query)

            // get all assigned company jobs
            //query = {"collectionName":"allJobads", "filter":{"operator":"$and","value":[{"operator":"$eq","fieldName":"job_company_id","value":doc_ids[0]}]}, "sort":[],"skip":0,"limit":5000}
            //const allAssignedJobads = await client.query(query)


            console.log("query successfully executed")
            var allUserMatchings = favourite_companies.docs.map(doc => { return wrapDates({_id: doc.id,  ...doc.data() }) })
            var allCompanies = allCompanyiesDocs.map(doc => { return wrapDates({_id: doc.id,  ...doc.data() }) })
            
            console.log("before merging")
            let finalArray = allUserMatchings.map((item, i) => Object.assign({}, item, allCompanies[i]));
            console.log(finalArray)
            console.log("after merging")
            //reomoving "deleted items"
            //finalArray = finalArray.filter(( obj ) => obj.delete.slice(-3) !== 'yes')
            //finalArray = finalArray.sort((a, b) => b.sum_match_percentage - a.sum_match_percentage)
            TotalLength = finalArray.length
            finalArray = finalArray.slice(skip, limit)
            finalArray.slice(-1)[0].doc_ids = doc_ids
                //query = query;
            //enhanced = await finalArray.map(doc => { return wrapDates({ ...doc.data(), _id: doc.id }) })
            return {
                items: finalArray,
                totalCount: 600
            }
        }
    }

    
    const results = await client.query(query);
    var enhanced
   // console.log("printing final final final result")
    //console.log(results)
    if (query.collectionName === "allCompanies"){
        enhanced = await results.map(doc => { return wrapDates({ ...doc.data(), _id: doc.id }) })
        //enhanced = enhanced.sort(function(a,b) {return (a.last_nom > b.last_nom) ? 1 : ((b.last_nom > a.last_nom) ? -1 : 0);} );
    } else {
        enhanced = await results.docs.map(doc => { return wrapDates({ ...doc.data(), _id: doc.id }) })
        //console.log(enhanced)
    }
    //console.log("printing enhanced:")
    //console.log(enhanced)

    return {
        items: enhanced,
        totalCount: enhanced.length
    }
};

exports.get = async payload => {
    const { collectionName, itemId } = payload;
    if (!collectionName) throw new BadRequestError('Missing collectionName in request body');
    if (!itemId) throw new BadRequestError('Missing itemId in request body');

    // console.log('get: ' + JSON.stringify(payload));

    const document = await client.get(collectionName, itemId);

    if (!document.exists) {
        throw new NotFoundError(`item ${itemId} not found`);
    }

    return {
        item: wrapDates({
            _id: document.id,
            ...document.data()
        })
    }
};

exports.insert = async payload => {
    const { collectionName, item } = payload;
    if (!collectionName) throw new BadRequestError('Missing collectionName in request body');
    if (!item) throw new BadRequestError('Missing item in request body');

    // console.log('insert: ' + JSON.stringify(payload));

    if (!item._id) item._id = uuid();
    await client.insert(collectionName, extractDates(item));

    return { item: wrapDates(item) };
};

exports.update = async payload => {
    const { collectionName, item } = payload;
    if (!collectionName) throw new BadRequestError('Missing collectionName in request body');
    if (!item) throw new BadRequestError('Missing item in request body');

    // console.log('update: ' + JSON.stringify(payload));

    await client.update(collectionName, extractDates(item));

    return { item: wrapDates(item) };
};

exports.remove = async payload => {
    const { collectionName, itemId } = payload;
    if (!collectionName) throw new BadRequestError('Missing collectionName in request body');
    if (!itemId) throw new BadRequestError('Missing itemId in request body');

    const item = await client.get(collectionName, itemId);
    await client.delete(collectionName, itemId);

    return { item: wrapDates(item) };
};

exports.count = async payload => {
    const { collectionName } = payload;
    if (!collectionName) throw new BadRequestError('Missing collectionName in request body');

    const results = await client.query({ collectionName: collectionName, limit: 1000, skip: 0, select: 'id' });

    return {
        totalCount: results.size
    };
};

const extractDates = item => {
    Object.keys(item).map(key => {
        const value = item[key];
        if (value === null) return;

        const reISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*))(?:Z|(\+|-)([\d|:]*))?$/;
        if (typeof value === 'string') {
            const re = reISO.exec(value);
            if (re) {
                item[key] = Firestore.Timestamp.fromDate(new Date(value));
            }
        }

        if (typeof value === 'object' && '$date' in value) {
            item[key] = Firestore.Timestamp.fromDate(value['$date']);
        }
    })

    return item
}

const wrapDates = item => {
    Object.keys(item)
        .map(key => {
            const value = item[key];
            if (value instanceof Firestore.Timestamp) {
                item[key] = { $date: item[key].toDate() }
            }
        })

    return item
}
