/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(['N/record', 'N/search', 'N/query', 'N/runtime', 'SuiteScripts/Libraries/RM-functions.js'], function(record, search, query, runtime, rmfunc) {

  function exporttocsv() {
    debugger;
    rmfunc.csvexport('custpage_invoices_sl');
  }

  function fieldChanged(context) {
    var rec=context.currentRecord;
    var ids=rec.getValue('custpage_viewsingle');
    window.ischanged=false;
    window.location.href=`https://5295340.app.netsuite.com/app/site/hosting/scriptlet.nl?script=2826&deploy=1&ids=${ids}`;
    return true;
  }

  return {
    exporttocsv:exporttocsv,
    fieldChanged:fieldChanged,
  };
});
