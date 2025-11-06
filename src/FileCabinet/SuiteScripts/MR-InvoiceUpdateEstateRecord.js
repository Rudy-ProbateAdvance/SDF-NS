/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record','N/query', 'SuiteScripts/Libraries/RM-functions.js'], function(record,query, rmfunc) {

  function getInputData(){
    log.debug('begin');
    var q=`select t.id
	, t.tranid
	, t.custbody_invoice_estate 
	, c.parent as estate
from transaction t
join customer c
	on c.id=t.entity
where type='CustInvc' 
	and custbody_invoice_estate is null`
    var rs = rmfunc.getQueryResults(q);
    log.debug(rs.length+' results');
    return rs;
  }

  function map(context) {
    var val=JSON.parse(context.value);
    var invintid=val.id;
    var estrec=val.estate;
    var result=-1;
    try {
      result=record.submitFields({type:'invoice', id:invintid, values:{'custbody_invoice_estate':estrec}});
      log.debug(`invintid:${invintid}; estintid:${estrec}; result:${result}`);
    } catch(e) {
      result=e.message;
      log.error(`invintid:${invintid}; estintid:${estrec}; result:${result}`);
    }
    return;
  }

  function summarize(context) {
    log.debug('end');
    return;
  }

  return {
    getInputData: getInputData,
    map: map,
    summarize:summarize
  };
});