/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/query', 'N/runtime', 'SuiteScripts/Libraries/RM-functions.js'], function(record, search, query, runtime, rmfunc) {

  function beforeSubmit(context) {
  }
  
  function beforeLoad(context){
  }
  
  function afterSubmit(context) {
    try {
      log.debug('BEGIN');
      var rec=context.newRecord;
  //  	log.debug({title:'context', details:JSON.stringify(context)});
  //    var rec=record.load({type:newrec.type, id:newrec.id});
      var custintid=rec.getValue('customer');
      var s=search.create({
        type: "invoice",
        filters:
        [
          ["type","anyof","CustInvc"], 
          "AND", 
          ["name","anyof",custintid], 
          "AND", 
          ["mainline","is","T"], 
  //        "AND", 
  //        ["status","noneof","CustInvc:B"], 
  //        "AND", 
  //        ["sum(amount)","greaterthan","0.00"]
        ],
        columns:
        [
          search.createColumn({name: "amount", label: "Amount"}),
          search.createColumn({name: "statusref", label: "Status"})
        ]
      });
      var rc=s.runPaged().count;
      if(rc==0) {
        log.debug('no invoices');
      }
      var rs=s.run().getRange(0,100);
      for(i in rs) {
        var result=rs[i];
        var status=result.getValue('statusref');
        var pass=true;
        if(status=='paidInFull') {
          continue;
        } else {
          log.debug('customer: ' + custintid + '; invoice: ' + result.id + '; status: ' + status);
          return;
        }
      }
      if(pass) {
        var s=search.create({
          type: "customrecord_case_status",
          filters:
          [
            ["custrecord_case_status_customer","anyof","448900"], 
            "AND", 
            ["custrecord_latest_status","is","T"]
          ],
          columns:
          [
            search.createColumn({name: "scriptid", label: "Script ID"}),
            search.createColumn({name: "custrecord_case_status_status", label: "Status"}),
            search.createColumn({name: "custrecord_case_status_notes", label: "Status Notes"}),
            search.createColumn({name: "custrecord_case_status_customer", label: "Customer"}),
            search.createColumn({name: "custrecord_latest_status", label: "Latest Status Flag"})
          ]
        });
        var rc=s.runPaged().count;
        log.debug("latest case status result count",rc);
        if(rc>0) {
          s.run().each(function(result){
            var csintid=result.id;
            record.submitFields({type:'customrecord_case_status', id:csintid, values:{custrecord_latest_status:false}});
            return true;
          });
        }
  
        csrec=record.create({type:'customrecord_case_status'});
        csrec.setValue({fieldId:'custrecord_case_status_status', value:13});
        csrec.setValue({fieldId:'custrecord_case_status_customer', value:custintid});
        csrec.setValue({fieldId:'custrecord_latest_status', value:true});
        csrec.setValue({fieldId:'custrecord_case_status_notes', value:'Customer set to "Paid Off:Closed" by script'});
        csrec.save();
        log.debug('customer '+ custintid + ' closed');
      }
    } catch(e) {
      log.error(e.message, JSON.stringify(e));
    }
  }
  
  return {
    beforeSubmit:beforeSubmit,
    beforeLoad:beforeLoad,
    afterSubmit:afterSubmit,
  };
});
