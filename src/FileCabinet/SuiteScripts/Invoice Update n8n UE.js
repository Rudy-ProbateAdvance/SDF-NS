/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/query', 'N/https'], function(record, query, https) {

  function beforeSubmit(context) {
  }
  
  function beforeLoad(context){
  }
  
  function afterSubmit(context) {
    if(context.type!='create') {
      return true;
    }
    log.debug({title:'context', details:JSON.stringify(context)});
    var rec=context.newRecord;
    var invintid=rec.id;
//    var q=`SELECT t.id, t.tranid AS invoice_number, c.firstname AS customer_first_name, c.lastname AS customer_last_name, cp.entityid || ' ' || cp.altname AS decedent_name, t.custbody_advance_size AS advance_amount, c.email AS customer_email, c.phone AS customer_phone, to_char(t.createddate, 'DS TS') AS date_created, c.custentity_click_id AS click_id, sc.title AS lead_source FROM transaction t LEFT JOIN customer c ON t.entity = c.id LEFT JOIN customer cp ON c.parent = cp.id LEFT JOIN searchcampaign sc ON sc.id = c.leadsource WHERE  t.id=${invintid}`;
    var q=`SELECT t.tranid AS invoice_number
, '<a href="/app/common/entity/custjob.nl?id=' || c.id || '" target="_blank">Go to Customer</a>' as link_to_customer
, c.firstname AS customer_first_name
, c.lastname AS customer_last_name
, cp.entityid || ' ' || cp.altname AS decedent_name
, t.foreigntotal AS invoice_amount
, t.custbody_advance_size AS advance_amount
, t.foreignamountunpaid AS outstanding_receivable
, f.name AS stamped_assignment
, c.email AS customer_email
, c.phone AS customer_phone
, sc.title AS lead_source 
, to_char(t.createddate, 'DS TS') AS date_created
, null AS age_in_days_of_date_billed
, t.trandate AS date_of_invoice
, t.closedate AS date_paid
, BUILTIN.DF(t.custbody_attorney) AS attorney
, BUILTIN.DF(t.custbody_attorney_name_address) AS attorney_name_address
, a.custentity_law_firm AS attorney_firm_name
, BUILTIN.DF(t.custbody_county) as estate_county
, BUILTIN.DF(c.custentity_adgroup) AS adgroup
, BUILTIN.DF(c.custentity_campaign) AS campaign
, c.custentity_click_id AS click_id
, c.custentity_creative AS creative
, BUILTIN.DF(c.custentity_keyword) AS keyword
, BUILTIN.DF(c.custentity_device) AS device
, BUILTIN.DF(c.custentity_matchtype) AS matchtype
, t.custbody_net_revenue AS net_revenue
, t.custbody_date_of_repayment AS date_of_repayment
, t.custbody_net_est_revenue AS net_est_revenue
, t.custbody_est_date_of_repayment AS est_date_of_repayment
, t.custbody_rebate_1_month AS rebate_1_month
, t.custbody_option_1_pricing AS option_1_dollars
, t.custbody_rebate_2_month AS rebate_2_month
, t.custbody_option_2_pricing AS option_2_dollars
, t.custbody_rebate_3_month AS rebate_3_month
, t.custbody_option_3_pricing AS option_3_dollars
, t.custbody_ct_filing_date AS filing_date
, c.datecreated AS customer_date_created
, cp.entityid || ' ' || cp.companyname AS estate_record
, t.duedate AS due_date_receive_by
, cp.custentity1 AS case_file_no
, cp.externalid AS estate_external_id
, BUILTIN.DF(t.custbody_estate_status_part1) AS estate_status
, c.firstname || ' ' || c.lastname || chr(10) || t.custbody_bill_address_1 || chr(10) || t.custbody_bill_city || ' ' || t.custbody_bill_state || ' ' || t.custbody_bill_zip_code AS customer_address
, BUILTIN.DF(custbody_personal_rep) AS personal_rep
--, BUILTIN.DF(t.custbody_attorney) AS attorney
, a.email AS attorney_email
--, BUILTIN.DF(t.custbody_attorney_name_address) AS attorney_address
, aa.city as attorney_city
, aa.state as attorney_state
, aa.zip as attorney_zip_code
, c.custentity_case_status_date_store AS case_status_first_created
, t.custbody_netrevenuecalc AS net_revenue_calculation
, c.entityid as customer_id
, ca.state as customer_state_province
, cp.custentity_estate_net_equity AS estate_net_equity
, t.custbody_invoice_datefiled AS date_filed
, t.custbody_securitizationgroupname AS securitization_group
, c.custentity_customer_totalduefromestate AS total_due_to_customer_current
, t.custbody_totaldueatcreation AS total_due_to_customer_at_approval
--, cp.custentity2 AS estate_county
, BUILTIN.DF(cp.custentity3) AS estate_state

FROM transaction t 
LEFT JOIN customer c ON t.entity = c.id 
LEFT JOIN customer cp ON c.parent = cp.id 
LEFT JOIN searchcampaign sc ON sc.id = c.leadsource 
LEFT JOIN contact a on a.id=t.custbody_attorney
LEFT JOIN contact p on p.id=t.custbody_personal_rep
LEFT JOIN file f on f.id=t.custbody_stamped_assignment
LEFT JOIN entityaddressbook ab on ab.entity=a.id
LEFT JOIN entityaddress aa on aa.nkey=ab.addressbookaddress
LEFT JOIN entityaddressbook cb on cb.entity=c.id
LEFT JOIN entityaddress ca on ca.nkey=cb.addressbookaddress

WHERE t.type = 'CustInvc' 
  AND t.posting = 'T'
  AND sys_extract_utc(t.createddate) >= sys_extract_utc(SYSTIMESTAMP) - 500
  AND t.id=${invintid}`;
    var rs=query.runSuiteQL({query:q});
    var result=rs.results[0].asMap();
    log.debug({title:'search results', details:JSON.stringify(result)});
    var b={
      "items":[
        result
      ]
    };
    var request={
      url:'https://probateadvance.app.n8n.cloud/webhook/e61e8efd-eea7-4ca7-8a09-4e8e5551984f1',
      body:JSON.stringify(b),
      headers:{
        "Content-type":"application/json"
      }
    }
    log.debug({title:'request body', details:request.body});
    var response=https.post(request);
    log.debug({title:'response', details:JSON.parse(response.body)});
  }
  
  return {
    beforeSubmit:beforeSubmit,
    beforeLoad:beforeLoad,
    afterSubmit:afterSubmit,
  };
});
