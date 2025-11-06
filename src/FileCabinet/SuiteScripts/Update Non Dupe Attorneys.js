/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record','N/search', 'N/https'], function(record,search,https) {

  function getInputData(){
    log.debug({title:'begin'});
    var s = search.load({id: 'customsearch1094'});
    return s;
  }

// For each result in the search above, the system will call this function in a separate process
  function map(context) {
//    log.debug({title:'context', details:JSON.stringify(context)});
    try {
      var intid=context.key;
      var rec=record.load({type:'contact', id:intid});
      var result=rec.save({ignoreMandatoryFields:true, enableSourcing:false});
      log.debug('record saved: '+result);
    } catch(e) {
      log.debug('error updating contact with id '+intid+': '+e.message);
    }
    return;
  }

  return {
    getInputData: getInputData,
    map: map
  };
});