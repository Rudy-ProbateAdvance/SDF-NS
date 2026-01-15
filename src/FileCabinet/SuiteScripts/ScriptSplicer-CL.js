/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(['N/currentRecord', 'N/runtime', 'SuiteScripts/Libraries/RM-functions.js'], function(cr, runtime, rmfunc) {
  function csvexport(sublistId, filename='Combined Search Results (PLEASE RENAME)', mapfunction=null) {
//    debugger;
    var rec=cr.get();
    var val=rec.getValue({fieldId:'custpage_csvfilename'});
//    alert('filename: '+val);
    if(val)
      filename=val
    rmfunc.csvexport(sublistId, filename, mapfunction);
  }

  function pageInit(context) {
    context.currentRecord.setValue({fieldId:'custpage_csvfilename', value:'Combined Search Results (PLEASE RENAME)'});
  }


  return {
    csvexport:csvexport,
    pageInit:pageInit,
  };
});
