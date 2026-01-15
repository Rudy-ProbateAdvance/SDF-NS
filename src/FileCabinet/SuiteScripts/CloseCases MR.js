/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record','N/query', 'N/file', 'SuiteScripts/Libraries/RM-functions.js'], function(record,search, file, rmfunc) {

  function getInputData(){
    log.debug({title:'begin'});
    var contents=file.load({id:404053}).getContents();
    var customers=contents.split('\n');
    var custids=customers.map(function(customer){return customer.split(' ')[0]});
    var custidstring="('"+custids.join("', '")+"')";
    var q=`select s.id as casestatusid, s.custrecord_latest_status, s.custrecord_case_status_customer as custintid, c.entityid as custid, c.altname as custname from customrecord_case_status s
join customer c on s.custrecord_case_status_customer=c.id
where
	s.custrecord_latest_status='T'
and c.entityid in ${custidstring}
order by c.id`;
    var rs=rmfunc.getQueryResults(q);
    var contents=JSON.stringify(rs);
    try{
    var fileObject = file.create({
      name: 'casesrollback.txt',
      fileType: file.Type.PLAINTEXT,
      contents: contents,
      folder: -15
    });
    } catch(e) {
      log.debug('error logging backup results', JSON.stringify(e));
    }
    log.debug({title:`found ${rs.length} results`});
    var inputdata=rmfunc.arrayToObject(rs, 'custintid');
    return inputdata;
  }

  function map(context) { 
    var val=JSON.parse(context['value']);
    try {
    var csrec=record.load({type:"customrecord_case_status", id:val.casestatusid});
    csrec.setValue({fieldId:"custrecord_latest_status", value:false});
    var status=csrec.save();
    var newcsrec=record.create({type:"customrecord_case_status"});
    newcsrec.setValue({fieldId:"custrecord_latest_status", value:true});
    newcsrec.setValue({fieldId:"custrecord_case_status_customer", value:val.custintid});
    newcsrec.setValue({fieldId:"custrecord_case_status_status", value:13});
    var status=newcsrec.save();
    log.debug(`${val.custid}: done.`);
    } catch(e) {
      log.error({title:`problem updating case status for ${val.custid}, id ${val.custintid}`, details:JSON.stringify(e)});
    }
    
    return;
  }

  function summarize(context) {
    log.debug({title:'end'});
  }
  
  return {
    getInputData:getInputData,
    map:map,
    summarize:summarize
  };
});