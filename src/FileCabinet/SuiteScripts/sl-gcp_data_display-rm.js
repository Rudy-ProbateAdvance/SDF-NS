/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/search', 'N/query', 'N/runtime', 'N/ui/serverWidget'], function(record, search, query, runtime, sw) {
  function drawForm() {
    var form=sw.createForm({title:'GCP Lookup Data'});
    var fld=null;
    var grp=null;

    grp=form.addFieldGroup({id:'custpage_customer', label:'Customer'});
    grp=form.addFieldGroup({id:'custpage_petitioner', label:'Petitioner'});
    grp=form.addFieldGroup({id:'custpage_attorney', label:'Attorney'});
    grp=form.addFieldGroup({id:'custpage_estate', label:'Estate'});

    var data={};
//    data=getData();
    var fields=getFields();
    for(i in fields) {
      fld=form.addField(fields[i]);
      var fieldid=fields[i].id;
      var val='Test';
      if(!!data[fieldid])
        val=data[fieldid];
      else
        val=fields[i].id;
      fld.defaultValue=val;
    }
  
    return form;
  }

  function doGet(context){
    var form=drawForm();
    context.response.writePage(form);
  }

  function doPost(context) {
    context.response.writeLine('Complete');
    return;
  }


  function onRequest(context) {
    if (context.request.method === "GET") {
      doGet(context);
    } else {
      doPost(context);
    }
  }

  function getFields() {
    return [
      {type:'text', id:'custpage_estate_case_number', label:'Case Number', container:'custpage_estate'},
      {type:'text', id:'custpage_estate_county', label:'County', container:'custpage_estate'},
      {type:'text', id:'custpage_estate_state', label:'State', container:'custpage_estate'},
      {type:'text', id:'custpage_estate_sort', label:'Sort', container:'custpage_estate'},
      {type:'text', id:'custpage_estate_case_file', label:'Case File', container:'custpage_estate'},
      {type:'text', id:'custpage_estate_year', label:'Year', container:'custpage_estate'},
      {type:'text', id:'custpage_estate_proceeding_type', label:'Proceeding Type', container:'custpage_estate'},
      {type:'text', id:'custpage_estate_comments', label:'Comments', container:'custpage_estate'},
      {type:'text', id:'custpage_estate_petition_cost_in_dollars', label:'Cost ($)', container:'custpage_estate'},
      {type:'text', id:'custpage_estate_petition_page_count', label:'Petition Page Count', container:'custpage_estate'},
      {type:'text', id:'custpage_estate_filing_date', label:'Filing Date', container:'custpage_estate'},
      {type:'text', id:'custpage_estate_petition_hearing_date', label:'Petition Hearing Date', container:'custpage_estate'},
      {type:'text', id:'custpage_estate_next_hearing_date', label:'Next Hearing Date', container:'custpage_estate'},
      {type:'text', id:'custpage_estate_attorney_name', label:'Attorney Name', container:'custpage_attorney'},
      {type:'text', id:'custpage_estate_attorney_address', label:'Attorney Address', container:'custpage_attorney'},
      {type:'text', id:'custpage_estate_attorney_city', label:'Attorney City', container:'custpage_attorney'},
      {type:'text', id:'custpage_estate_attorney_state', label:'Attorney State', container:'custpage_attorney'},
      {type:'text', id:'custpage_estate_attorney_zip_code', label:'Attorney Zip', container:'custpage_attorney'},
      {type:'text', id:'custpage_estate_attorney_phone', label:'Attorney Phone', container:'custpage_attorney'},
      {type:'text', id:'custpage_estate_attorney_email_address', label:'Attorney Email', container:'custpage_attorney'},
      {type:'text', id:'custpage_estate_be_appointed_as', label:'Be Appointed As', container:'custpage_estate'},
      {type:'text', id:'custpage_estate_full_or_limited_authority', label:'Full Or Limitied Authority', container:'custpage_estate'},
      {type:'text', id:'custpage_estate_bond_amount_in_dollars', label:'Bond Amount ($)', container:'custpage_estate'},
      {type:'text', id:'custpage_estate_estate_of_decedent_name', label:'Estate Name', container:'custpage_estate'},
      {type:'text', id:'custpage_estate_decedent_died_on', label:'Decedent Died On', container:'custpage_estate'},
      {type:'text', id:'custpage_estate_decedent_residence', label:'Estate Residence', container:'custpage_estate'},
      {type:'text', id:'custpage_estate_city_of_decedent', label:'Estate City', container:'custpage_estate'},
      {type:'text', id:'custpage_estate_decedent_state', label:'Estate State', container:'custpage_estate'},
      {type:'text', id:'custpage_estate_decedent_zip_code', label:'Estate Zip', container:'custpage_estate'},
      {type:'text', id:'custpage_estate_number_of_heirs', label:'Number Of Heirs', container:'custpage_estate'},
      {type:'text', id:'custpage_estate_personal_property_in_dollars', label:'Personal Property ($)', container:'custpage_estate'},
      {type:'text', id:'custpage_estate_annual_income_real_property_in_dollars', label:'Annual Income Real Property ($)', container:'custpage_estate'},
      {type:'text', id:'custpage_estate_annual_gross_income_personal_property_in_dollars', label:'Annual Gross Income Personal Property ($)', container:'custpage_estate'},
      {type:'text', id:'custpage_estate_gross_fm_real_property_in_dollars', label:'FM Real Property ($)', container:'custpage_estate'},
      {type:'text', id:'custpage_estate_encumbrances_in_dollars', label:'Encumbrances ($)', container:'custpage_estate'},
      {type:'text', id:'custpage_estate_petitioner_name', label:'Petitioner Name', container:'custpage_petitioner'},
      {type:'text', id:'custpage_estate_petitioner_address', label:'Petitioner Address', container:'custpage_petitioner'},
      {type:'text', id:'custpage_estate_petitioner_city', label:'Petitioner City', container:'custpage_petitioner'},
      {type:'text', id:'custpage_estate_petitioner_state', label:'Petitioner State', container:'custpage_petitioner'},
      {type:'text', id:'custpage_estate_petitioner_zip_code', label:'Petitioner Zip', container:'custpage_petitioner'},
      {type:'text', id:'custpage_estate_petitioner_relationship', label:'Petitioner Relationship', container:'custpage_petitioner'},
      {type:'text', id:'custpage_estate_petitioner_phone', label:'Petitioner Phone', container:'custpage_petitioner'},
      {type:'text', id:'custpage_estate_excel_file_name', label:'Excel File Name', container:'custpage_estate'},
      {type:'text', id:'custpage_estate_excel_sheet_name', label:'Excel Sheet Name', container:'custpage_estate'},
      {type:'text', id:'custpage_estate_sent_to_mailer_at', label:'Sent To Mailer At', container:'custpage_estate'},
      {type:'text', id:'custpage_estate_created_at', label:'Created At', container:'custpage_estate'},
      {type:'text', id:'custpage_estate_status', label:'Status', container:'custpage_estate'},
      {type:'text', id:'custpage_estate_error_reason', label:'Error Reason', container:'custpage_estate'},
      {type:'text', id:'custpage_customer_name', label:'Customer Name', container:'custpage_customer'},
      {type:'text', id:'custpage_customer_address', label:'Customer Address', container:'custpage_customer'},
      {type:'text', id:'custpage_customer_city', label:'Customer City', container:'custpage_customer'},
      {type:'text', id:'custpage_customer_state', label:'Customer State', container:'custpage_customer'},
      {type:'text', id:'custpage_customer_zip_code', label:'Customer Zip', container:'custpage_customer'},
      {type:'text', id:'custpage_customer_status', label:'Customer Status', container:'custpage_customer'},
      {type:'text', id:'custpage_customer_exclusion_reason', label:'Customer Exclusion Reason', container:'custpage_customer'},
      {type:'text', id:'custpage_customer_unsubscribe', label:'Customer Unsubscribe Code', container:'custpage_customer'},
      {type:'text', id:'custpage_customer_comment', label:'Customer Comment', container:'custpage_customer'}
    ];
  }

  return {onRequest:onRequest}
});
