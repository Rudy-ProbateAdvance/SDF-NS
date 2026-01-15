/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 */
 define(['N/currentRecord','N/record','N/search'], function(currentRecord,record,search) {
    function pageInit(){
        try{
            var currentRec = currentRecord.get();//10047-file id
            var leadRec = search.lookupFields({
                type: currentRec.type,
                id: currentRec.id,
                columns: ['name','custrecord_last_name','custrecord_case_number','custrecord_file_origin','custrecord_zip','custrecord_decedent','custrecord_city','custrecord_address','custrecord_state','custrecord_estate_county']
            });
            var firstName = leadRec.name;
            var lastName = leadRec.custrecord_last_name;
            var isCustExist = custEmailSearch(firstName,lastName);
            
            if(!isCustExist){
               // alert('Click OK to Create Customer');    
                var caseNum = leadRec.custrecord_case_number;
               // var custId = leadRec.getValue('custrecord_state')
                var fileOrigin = leadRec.custrecord_file_origin;
                var decedent = leadRec.custrecord_decedent;
                var address = leadRec.custrecord_address;
                var statetext = leadRec.custrecord_state;
                var zip = leadRec.custrecord_zip;
                var country = leadRec.custrecord_estate_county;
                var city = leadRec.custrecord_city;
               // log.debug(custId,state);

                var state   = searchState(statetext);
                log.debug(state,'state-'+state);
                
                var estateRecord = record.create({
                    type: 'customer',
                    isDynamic: true
                });
                estateRecord.setValue('subsidiary',2);
                estateRecord.setValue('category',2);

                if(lastName){
                    estateRecord.setValue('isperson','T');
                    estateRecord.setValue('firstname',firstName);
                    estateRecord.setValue('lastname',lastName);
                }
                else{
                    estateRecord.setValue('isperson','F');
                    estateRecord.setValue('companyname',firstName);
                }
                var estateid =estateRecord.save({
                    ignoreMandatoryFields:true
                });
               

                var custRecord = record.create({
                    type: 'customer',
                    isDynamic: true
                });
                custRecord.setValue('customform',-2);
                custRecord.setValue('subsidiary',2);

                    custRecord.selectLine({
                      sublistId: 'addressbook',
                      line: 0
                    });     
                   
              
                  var billaddr_subrecord = custRecord.getCurrentSublistSubrecord({
                    sublistId: 'addressbook',
                    fieldId: 'addressbookaddress'
                  });
               // var billaddr_subrecord = custRecord.getSubrecord({fieldId: 'address'});
              billaddr_subrecord.setValue({sublistId: 'addressbook',fieldId:'state',value:state});  
              billaddr_subrecord.setValue({sublistId: 'addressbook',fieldId:'country',value:country});
                billaddr_subrecord.setValue({sublistId: 'addressbook',fieldId:'addressee',value:firstName});
                //billaddr_subrecord.setValue({fieldId:'addrphone',value:sh_bill_phone});
                billaddr_subrecord.setValue({sublistId: 'addressbook',fieldId:'addr1',value:address});
               //billaddr_subrecord.setValue({fieldId:'addr2',value:sh_bill_line_two});
                billaddr_subrecord.setValue({sublistId: 'addressbook',fieldId:'city',value:city});
                
                billaddr_subrecord.setValue({sublistId: 'addressbook',fieldId:'zip',value:zip});
                custRecord.commitLine({
                    sublistId: 'addressbook'
                 });
                custRecord.setValue('custentity_decedent',decedent);
                custRecord.setValue('leadsource',-2);
                custRecord.setValue('category',1);

                custRecord.setText('custentity_filing_date',fileOrigin);
                custRecord.setValue('custentity1',caseNum);
                custRecord.setValue('parent',estateid);

                if(lastName){
                    custRecord.setValue('isperson','T');
                    custRecord.setValue('firstname',firstName);
                    custRecord.setValue('lastname',lastName);
                }
                else{
                    custRecord.setValue('isperson','F');
                    custRecord.setValue('companyname',firstName);
                }
                var id =custRecord.save({
                    ignoreMandatoryFields:true
                });
               log.debug('Customer Id: ',id);
               alert('Customer Id: '+id);

            }
            else{
                log.debug('Customer Already Exist: ',isCustExist);
                alert('Customer Already Exist: '+isCustExist);
            }
        }catch(e){
            log.error('e',e);
        }
    }
    function searchState(stateName){

        if (stateName) {
           var stateSearchObj = search.create({
             type: "state",
             filters: [
               ["country", "is", 'US'] ,
                "AND",
                [
                  ["shortname", "is", stateName],
  
                  "OR",
  
                  ["fullname", "is", stateName]]
             ],
             columns: [
               search.createColumn({
                 name: "id"
               })
             ]
           });
           var stateid;
           var searchResultCount = stateSearchObj.runPaged().count;
           log.debug("stateSearchObj result count", searchResultCount);
           stateSearchObj.run().each(function(result) {
            stateid = result.getValue({
               name: 'id'
             });
             return true;
           });
           return stateid;
         }else{
           return null;
         }
      }

    function custEmailSearch(firstName,lastName){
        try{
          var custName;
            if(lastName){
                custName = firstName+' '+lastName;
            }
            else{
                custName = firstName;
            }  
            var customerSearchObj = search.create({
                type: 'customer',
                filters:
                [
                   ['entityid',"is",custName]
                ]
            });
            var custId;
            customerSearchObj.run().each(function(result){
                custId = result.id;
                return true;
            });
            if(custId)
                return custId;
            else
                return false;
        }catch(err){
            log.debug('customer search',err);
        }
    }
    return {
        pageInit: pageInit
    }
});