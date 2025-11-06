/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/query', 'N/runtime', 'N/https'], function(query, runtime, https) {

  function beforeSubmit(context) {
    try {
      log.debug('BEGIN');
      var rec=context.newRecord;
      var status=rec.getValue({fieldId:'custrecord_case_status_status'});
      var custintid=rec.getValue({fieldId:'custrecord_case_status_customer'});
      if(status==3) {
        log.debug('status ready for diligence');
        var q=`select custrecord_case_status_customer from customrecord_case_status where custrecord_case_status_customer=${custintid} and custrecord_case_status_status=3 and custrecord_latest_status='T' order by id desc`;
        var rs=query.runSuiteQLPaged({query:q, pageSize:1000});
        var rc=rs.count;
        if(rc>0) {
          log.debug({title:'Customer '+custintid+' is already in ready for diligence status. Exiting.'});
          log.debug('END');
          return true;
        }
        
//        var q=`
//  select c.entityid || ' ' || c.firstname || ' ' || c.lastname as customer_name, ca.addr1 || ' ' || ca.city || ' ' || ca.state || ' ' || ca.zip as customer_address, c.phone as customer_phone, c.email as customer_email, count(i.id) as invoices_count, c.custentity_click_id as gclid, BUILTIN.DF(c.leadsource) as lead_source, tl.rate as advance_amount
//  from customer c
//  LEFT JOIN entityaddressbook ab on ab.entity=c.id
//  LEFT JOIN entityaddress ca on ca.nkey=ab.addressbookaddress
//  left join transaction t on t.entity=c.id
//  left join transactionline tl on tl.transaction=t.id
//  left join transaction i on i.entity=c.id
//  where c.id='${custintid}' and t.type='Estimate' and tl.item=7 and t.custbody_preferred_quote='T'
//  group by c.entityid, c.firstname, c.lastname, ca.addr1, ca.city, ca.state, ca.zip, c.phone, c.email, c.custentity_click_id, BUILTIN.DF(c.leadsource), tl.rate`;
        var q=`
  select c.entityid || ' ' || c.firstname || ' ' || c.lastname as customer_name, 
      ca.addr1 || ' ' || ca.city || ' ' || ca.state || ' ' || ca.zip as customer_address, 
      c.phone as customer_phone, c.email as customer_email, count(i.id) as invoices_count, 
      c.custentity_click_id as gclid, BUILTIN.DF(c.leadsource) as lead_source, 
      tl.rate as advance_amount, to_char(sysdate, 'MM-DD-YYYY HH24:MI:SS') as date_of_change
  from customer c
  LEFT JOIN entityaddressbook ab on ab.entity=c.id
  LEFT JOIN entityaddress ca on ca.nkey=ab.addressbookaddress
  left join transaction t on t.entity=c.id
  left join transactionline tl on tl.transaction=t.id
  left join transaction i on i.entity=c.id
  where c.id='${custintid}' and t.type='Estimate' and tl.item=7 and t.custbody_preferred_quote='T'
  group by c.entityid, c.firstname, c.lastname, ca.addr1, ca.city, ca.state, ca.zip, c.phone, c.email, c.custentity_click_id, BUILTIN.DF(c.leadsource), tl.rate`;
        try {
          var rs=query.runSuiteQL({query:q});
          var result=rs.results[0].asMap();
        } catch(e) {
          log.error({title:'customer intid: '+custintid, details:e.message + '\n'+JSON.stringify(e)});
          return;
        }
        var b={
          "items":[
            result
          ]
        };
        var request={
          url:'https://probateadvance.app.n8n.cloud/webhook/e61e8efd-eea7-4ca7-8a09-4e8e5551984f3', 
          body:JSON.stringify(b),
          headers:{
            "Content-type":"application/json"
          }
        };
        log.debug(JSON.stringify(request));
        var response=https.post(request);
        log.debug(response.body);
      }
      log.debug('END');
    } catch(e) {
      log.error({title:e.name, details:e.message});
    }
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
