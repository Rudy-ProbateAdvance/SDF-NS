/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

define(['N/record', 'N/search', 'N/runtime','N/file'], (record, search ,runtime,file) => {
    let getInputData = () => {
        try{
           var customerSearchObj = search.create({
   type: "customer",
   filters:
   [
      ["custentity_source","is","web services"], 
      "AND",
     //["datecreated","within","lastweek"],
      ["datecreated","within","today"],
     "AND"
     , ["parentcustomer.internalid","noneof","@NONE@"]     
     //,"AND",
     //["internalid","anyof",2287406]
   ],
   columns:
   [
      search.createColumn({name: "custentity_source", label: "source"}),
      search.createColumn({
         name: "entityid",
         sort: search.Sort.ASC,
         label: "ID"
      }),
      search.createColumn({name: "altname", label: "Name"}),
      search.createColumn({name: "email", label: "Email"}),
      search.createColumn({name: "phone", label: "Phone"}),
   ]
});

            return customerSearchObj;
        }catch(ex){
            log.error('getInputData error: ', ex.message);
        }
    }

    let map = (context) => {
        try {
            var data = JSON.parse(context.value);              
            try{
              let recordId=context.key;
              log.debug('map Customer ID', recordId);
              let newrec=record.load({id:recordId,type:'customer'})
               let exitingsource = newrec.getValue({
                    fieldId: 'custentity_source'
                });
                let parent = newrec.getValue({
                    fieldId: 'parent'
                });
                if(exitingsource=='web services'&&parent){
                    let customrecord_case_statusSearchObj = search.create({
                        type: "customrecord_case_status",
                        filters:
                        [
                           ["custrecord_case_status_customer","anyof",recordId]
                        ],
                        columns:
                        [
                           search.createColumn({
                              name: "scriptid",
                              sort: search.Sort.ASC,
                              label: "Script ID"
                           }),
                           search.createColumn({name: "custrecord_case_status_status", label: "Status"}),
                        ]
                     });
                     let searchResultCount = customrecord_case_statusSearchObj.runPaged().count;
                     log.debug("customrecord_case_statusSearchObj result count",searchResultCount);
                    if(searchResultCount==0){
                        var caseStatusRec = record.create({type:"customrecord_case_status"});
                        caseStatusRec.setValue("custrecord_case_status_status","1"); //Prospective
                        caseStatusRec.setValue("custrecord_case_status_customer",recordId);
                        caseStatusRec.setValue("owner",7); //751981
                      var caseStatusRecId =caseStatusRec.save();
                       log.debug('caseStatusRecId',caseStatusRecId)
                    }
                 
                }
             
            }catch (e) {
                 log.debug('error in map()', e);
            }
            
        }catch(e){
            log.debug('Error in map',e)
        }
    }

    let reduce = (context) => {
        try{
           
        }catch(E){
            log.error('Reduce',E);
        }
    }

    let summarize = (summary) => {
        
    }
    

    return {
        getInputData: getInputData,
        map: map,
        summarize: summarize
    };
});