/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/search', 'N/record', 'SuiteScripts/Libraries/calculateMaxAdvance.js'], function(search, record, calcmaxadv){

  function beforeSubmit(context) {
    try {
      log.debug('beforesubmit event fired', JSON.stringify(context));
      var newrec=context.newRecord;
      var oldrec=context.oldRecord;
      results=calcmaxadv.getMaxAdvance(oldrec, newrec);
      log.debug('results', JSON.stringify(results));
    } catch(e) {
      log.debug(e.name, e.message+'; '+JSON.stringify(e));
    }
    

    return true;
  }
  
  function beforeLoad(context){
//    log.debug('beforeload event fired', JSON.stringify(context));
    return true;
  }
  
  function afterSubmit(context) {
//    log.debug('aftersubmit event fired', JSON.stringify(context));
    return true;
  }
  
  return {
    beforeSubmit:beforeSubmit,
    beforeLoad:beforeLoad,
    afterSubmit:afterSubmit,
  };
});