/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record'], function(record){

  function beforeSubmit(context) {
    return true;
    log.debug({title:'beforeSubmit', details:JSON.stringify(context)});
    var newrec=context.newRecord;
    var invintid=newrec.getValue('internalid');
    var invid=newrec.getValue('tranid');
    var custintid=newrec.getValue('entity');
    var customer=record.load({type:'customer', id:custintid});
    var totaldue=customer.getValue('custentity_customer_totalduefromestate');
    log.debug({title:'new invoice', details:invintid+'; '+invid+'; '+custintid});
    newrec.setValue({fieldId:'custbody_totaldueatcreation', value:totaldue});
  }
  
  function beforeLoad(context){
  }
  
  function afterSubmit(context) {
  }
  
  return {
    beforeSubmit:beforeSubmit,
    beforeLoad:beforeLoad,
    afterSubmit:afterSubmit,
  };
});