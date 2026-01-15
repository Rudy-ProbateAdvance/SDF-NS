/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/search', 'N/query', 'N/runtime', 'N/ui/serverWidget'], function(record, search, query, runtime, sw) {
  function drawForm1(params) {
    var form=sw.createForm({title:'Search Lead Data'});
    form.clientScriptModulePath='SuiteScripts/cl-lead_data_search_form-rm.js'
    var fld=null;
    var grp=null;
    grp=form.addFieldGroup({id:'custpage_statecountycase', label:'Search By State/County/Case #'});
    grp=form.addFieldGroup({id:'custpage_unsubscribe', label:'Search By Unsubscribe Code'});
    fld=form.addField({id:'custpage_state', label:'State', type:'text', container:'custpage_statecountycase'});
    fld.defaultValue=params.state?params.state:'';
    fld=form.addField({id:'custpage_county', label:'County', type:'text', container:'custpage_statecountycase'});
    fld.defaultValue=params.county?params.county:'';
    fld=form.addField({id:'custpage_casenum', label:'Case #', type:'text', container:'custpage_statecountycase'});
    fld.defaultValue=params.casenum?params.casenum:'';
    fld=form.addField({id:'custpage_unsubscribe', label:'Unsubscribe Code', type:'text', container:'custpage_unsubscribe'});
    fld.defaultValue=params.unsubscribe?params.unsubscribe:'';
    fld=form.addField({id:'custpage_stage', label:'Stage', type:'text'});
    fld.defaultValue='1';
    fld.updateDisplayType({displayType:'hidden'});
    fld=form.addField({id:'custpage_data', label:'Data', type:'textarea'});
    fld.updateDisplayType({displayType:'hidden'});
    form.addButton({id:'custpage_search_data', label:'Search', functionName:'executesearch'});
//    form.addSubmitButton({label:'Search'});
    return form;
  }

  function drawForm2(params) {
    var data=JSON.parse(params.custpage_data);
    log.debug({title:'data', details:JSON.stringify(data)});
    if(data.length==0) {
      return drawErrorForm();
    }
    if(data.length==1) {
      return drawForm3(data[0]);
    }

    var form=sw.createForm({title:'Lead Data Search Results'});
    form.clientScriptModulePath='SuiteScripts/cl-lead_data_search_form-rm.js'
    var fld=null;
//    fld=form.addField({id:'custpage_stage', label:'Stage', type:'text'});
//    fld.defaultValue='2';
//    fld.updateDisplayType({displayType:'hidden'});
    fld=form.addField({id:'custpage_data', label:'Data', type:'longtext'});
    fld.updateDisplayType({displayType:'hidden'});
    fld.defaultValue=params.custpage_data;
    var results=form.addSublist({type:'list', id:'custpage_resultstable', label:'Search Results'});
    results.addField({id:'custpage_select', label:'Select', type:'textarea'});
    results.addField({id:'custpage_customer_name', label:'Customer Name', type:'text'});
    results.addField({id:'custpage_customer_address', label:'Customer Address', type:'text'});
    results.addField({id:'custpage_customer_city', label:'Customer City', type:'text'});
    results.addField({id:'custpage_customer_state', label:'Customer State', type:'text'});
    results.addField({id:'custpage_customer_zip', label:'Customer Zip', type:'text'});
    results.addField({id:'custpage_customer_unsubscribe', label:'Unsubscribe Code', type:'text'});
    results.addField({id:'custpage_estate_name', label:'Decedent Name', type:'text'});
    results.addField({id:'custpage_estate_casenum', label:'Estate Case #', type:'text'});
    results.addField({id:'custpage_estate_county', label:'Estate County', type:'text'});
    results.addField({id:'custpage_estate_state', label:'Estate State', type:'text'});

    log.debug('results: '+data.length);
    for(var i=0; i<data.length; i++) {
      log.debug('i: '+i);
      var result=data[i];
      log.debug({title:'result', details:JSON.stringify(result)});
      log.debug(result.cd_estateOfDecedentName);
      results.setSublistValue({
        id:'custpage_select', 
        value:`<input type="button" name="Select" id="select${i}" value="Select" onclick="x=[JSON.parse(nlapiGetFieldValue('custpage_data'))[${i}]];nlapiSetFieldValue('custpage_data',JSON.stringify(x));document.getElementById('main_form').submit();"/>`, 
        line:i
      });
      results.setSublistValue({id:'custpage_customer_name', value:result.beneficiary_name||null, line:i});
      results.setSublistValue({id:'custpage_customer_address', value:result.beneficiary_address||null, line:i});
      results.setSublistValue({id:'custpage_customer_city', value:result.beneficiary_city||null, line:i});
      results.setSublistValue({id:'custpage_customer_state', value:result.beneficiary_state||null, line:i});
      results.setSublistValue({id:'custpage_customer_zip', value:result.beneficiary_zipCode||null, line:i});
      results.setSublistValue({id:'custpage_customer_unsubscribe', value:result.mr_unsubscribeCode||null, line:i});
      results.setSublistValue({id:'custpage_estate_name', value:result.cd_estateOfDecedentName||null, line:i});
      results.setSublistValue({id:'custpage_estate_casenum', value:result.cd_caseNumber||null, line:i});
      results.setSublistValue({id:'custpage_estate_county', value:result.cd_county||null, line:i});
      results.setSublistValue({id:'custpage_estate_state', value:result.cd_state||null, line:i});
//      log.debug({title:'i:'+i});
//      for(j in result) {
//        log.debug({title:'fieldname:'+j+'; value:'+result[j]+'; line:'+i});
//        results.setSublistValue({id:j, value:result[j], line:i});
//      }
    }
    return form;
  }

  function drawForm3(data) {
    log.debug({title:'drawForm3 data', details:JSON.stringify(data)});
    var form=sw.createForm({title:'Mailer Data Lookup'});
    form.clientScriptModulePath='SuiteScripts/cl-lead_data_search_form-rm.js'
    var fld=null;
    var grp=null;
    form.addButton({id:'custpage_all_insert', label:'Insert Customer/Estate Data', functionName:'allinsert'});
    form.addButton({id:'custpage_cust_insert', label:'Insert Customer Data', functionName:'custinsert'});
    form.addButton({id:'custpage_est_insert', label:'Insert Estate Data', functionName:'estinsert'});
    form.addButton({id:'custpage_pr_insert', label:'Insert PR Data', functionName:'prinsert'});
    form.addButton({id:'custpage_atty_insert', label:'Insert Attorney Data', functionName:'attyinsert'});

    grp=form.addFieldGroup({id:'custpage_customer', label:'Customer'});
    grp=form.addFieldGroup({id:'custpage_estate', label:'Estate'});
    grp=form.addFieldGroup({id:'custpage_petitioner', label:'Petitioner'});
    grp=form.addFieldGroup({id:'custpage_attorney', label:'Attorney'});

    var fields=getFields();
    for(i in fields) {
      fld=form.addField(fields[i]);
      var fieldname=fields[i].id;
      var fieldid=fields[i].foreignname;
      var fieldvalue=data[fieldid];
      if(['custpage_estate_state', 'custpage_estate_county'].includes(fieldname)) {
        var f1=data.cd_caseId.indexOf('-');
        var f2=data.cd_caseId.indexOf('-',f1+1);
        if(fieldname=='custpage_estate_state') {
          var temp=data.cd_caseId.substring(f1+1,f2);
          if(temp.length==2) {
            fieldvalue=temp.toUpperCase();
          } else {
            fieldvalue=toProperCase(temp);
          }
        }
        else {
          fieldvalue=toProperCase(data.cd_caseId.substring(0,f1));
        }
      }
      log.debug({title:fields[i].id, details:fields[i].foreignname+': '+data[fields[i].foreignname]});
      var val=fieldvalue?fieldvalue:'';
      fld.defaultValue=val;
    }
  
    return form;
  }

  function drawErrorForm() {
    var form=sw.createForm({title:'No results found'});
    return form;
  }

  function doGet(context) {
    var params=context.request.parameters;
    context.response.writeLine("Parameters");
    context.response.writeLine(JSON.stringify(params));
    var form=drawForm1(params);
    context.response.writePage(form);
  }

  function doPost(context) {
    var params=context.request.parameters;
    var form=drawForm2(params);
    context.response.writePage(form);
    return;
  }


  function onRequest(context) {
    if (context.request.method == "GET") {
      doGet(context);
    } else {
      doPost(context);
    }
  }

  function getFields() {
    return [
      {type:'text', id:'custpage_estate_case_number', label:'Case Number', container:'custpage_estate', foreignname:'cd_caseNumber'},
      {type:'text', id:'custpage_estate_county', label:'County', container:'custpage_estate', foreignname:'cd_caseId'},
      {type:'text', id:'custpage_estate_state', label:'State', container:'custpage_estate', foreignname:'cd_caseId'},
      {type:'text', id:'custpage_estate_sort', label:'Sort', container:'custpage_estate', foreignname:'cd_sort'},
      {type:'text', id:'custpage_estate_case_file', label:'Case File', container:'custpage_estate', foreignname:'cd_caseFile'},
      {type:'text', id:'custpage_estate_year', label:'Year', container:'custpage_estate', foreignname:'cd_year'},
      {type:'text', id:'custpage_estate_proceeding_type', label:'Proceeding Type', container:'custpage_estate', foreignname:'cd_proceedingType'},
      {type:'text', id:'custpage_estate_comments', label:'Comments', container:'custpage_estate', foreignname:'cd_comments'},
      {type:'text', id:'custpage_estate_petition_cost_in_dollars', label:'Petition Cost ($)', container:'custpage_estate', foreignname:'cd_petitionCostInDollars'},
      {type:'text', id:'custpage_estate_petition_page_count', label:'Petition Page Count', container:'custpage_estate', foreignname:'cd_petitionPageCount'},
      {type:'text', id:'custpage_estate_filing_date', label:'Filing Date', container:'custpage_estate', foreignname:'cd_filingDate'},
      {type:'text', id:'custpage_estate_petition_hearing_date', label:'Petition Hearing Date', container:'custpage_estate', foreignname:'cd_petitionHearingDate'},
      {type:'text', id:'custpage_estate_next_hearing_date', label:'Next Hearing Date', container:'custpage_estate', foreignname:'cd_nextHearingDate'},
      {type:'text', id:'custpage_attorney_name', label:'Attorney Name', container:'custpage_attorney', foreignname:'cd_attorneyName'},
      {type:'text', id:'custpage_attorney_address', label:'Attorney Address', container:'custpage_attorney', foreignname:'cd_attorneyAddress'},
      {type:'text', id:'custpage_attorney_city', label:'Attorney City', container:'custpage_attorney', foreignname:'cd_attorneyCity'},
      {type:'text', id:'custpage_attorney_state', label:'Attorney State', container:'custpage_attorney', foreignname:'cd_attorneyState'},
      {type:'text', id:'custpage_attorney_zip_code', label:'Attorney Zip', container:'custpage_attorney', foreignname:'cd_attorneyZipCode'},
      {type:'text', id:'custpage_attorney_phone', label:'Attorney Phone', container:'custpage_attorney', foreignname:'cd_attorneyPhone'},
      {type:'text', id:'custpage_attorney_email_address', label:'Attorney Email', container:'custpage_attorney', foreignname:'cd_attorneyEmailAddress'},
      {type:'text', id:'custpage_estate_be_appointed_as', label:'Be Appointed As', container:'custpage_estate', foreignname:'cd_beAppointedAs'},
      {type:'text', id:'custpage_estate_full_or_limited_authority', label:'Full Or Limitied Authority', container:'custpage_estate', foreignname:'cd_fullOrLimitedAuthority'},
      {type:'text', id:'custpage_estate_bond_amount_in_dollars', label:'Bond Amount ($)', container:'custpage_estate', foreignname:'cd_bondAmountInDollars'},
      {type:'text', id:'custpage_estate_estate_of_decedent_name', label:'Estate Name', container:'custpage_estate', foreignname:'cd_estateOfDecedentName'},
      {type:'text', id:'custpage_estate_decedent_died_on', label:'Decedent Died On', container:'custpage_estate', foreignname:'cd_decedentDiedOn'},
      {type:'text', id:'custpage_estate_decedent_residence', label:'Estate Residence', container:'custpage_estate', foreignname:'cd_decedentResidence'},
      {type:'text', id:'custpage_estate_city_of_decedent', label:'Estate City', container:'custpage_estate', foreignname:'cd_cityOfDecedent'},
      {type:'text', id:'custpage_estate_decedent_state', label:'Estate State', container:'custpage_estate', foreignname:'cd_decedentState'},
      {type:'text', id:'custpage_estate_decedent_zip_code', label:'Estate Zip', container:'custpage_estate', foreignname:'cd_decedentZipCode'},
      {type:'text', id:'custpage_estate_number_of_heirs', label:'Number Of Heirs', container:'custpage_estate', foreignname:'cd_numberOfHeirs'},
      {type:'text', id:'custpage_estate_personal_property_in_dollars', label:'Personal Property ($)', container:'custpage_estate', foreignname:'cd_personalPropertyInDollars'},
      {type:'text', id:'custpage_estate_annual_income_real_property_in_dollars', label:'Annual Income Real Property ($)', container:'custpage_estate', foreignname:'cd_annualIncomeRealPropertyInDollars'},
      {type:'text', id:'custpage_estate_annual_gross_income_personal_property_in_dollars', label:'Annual Gross Income Personal Property ($)', container:'custpage_estate', foreignname:'cd_annualGrossIncomePersonalPropertyInDollars'},
      {type:'text', id:'custpage_estate_gross_fm_real_property_in_dollars', label:'FM Real Property ($)', container:'custpage_estate', foreignname:'cd_annualIncomeRealPropertyInDollars'},
      {type:'text', id:'custpage_estate_encumbrances_in_dollars', label:'Encumbrances ($)', container:'custpage_estate', foreignname:'cd_encumbrancesInDollars'},
      {type:'text', id:'custpage_petitioner_name', label:'Petitioner Name', container:'custpage_petitioner', foreignname:'cd_petitionerName'},
      {type:'text', id:'custpage_petitioner_address', label:'Petitioner Address', container:'custpage_petitioner', foreignname:'cd_petitionerAddress'},
      {type:'text', id:'custpage_petitioner_city', label:'Petitioner City', container:'custpage_petitioner', foreignname:'cd_petitionerCity'},
      {type:'text', id:'custpage_petitioner_state', label:'Petitioner State', container:'custpage_petitioner', foreignname:'cd_petitionerState'},
      {type:'text', id:'custpage_petitioner_zip_code', label:'Petitioner Zip Code', container:'custpage_petitioner', foreignname:'cd_petitionerZipCode'},
      {type:'text', id:'custpage_petitioner_relationship', label:'Petitioner Relationship', container:'custpage_petitioner', foreignname:'cd_petitionerRelationship'},
      {type:'text', id:'custpage_petitioner_phone', label:'Petitioner Phone', container:'custpage_petitioner', foreignname:'cd_petitionerPhone'},
      {type:'text', id:'custpage_estate_excel_file_name', label:'Excel File Name', container:'custpage_estate', foreignname:'cd_excelFileName'},
      {type:'text', id:'custpage_estate_excel_sheet_name', label:'Excel Sheet Name', container:'custpage_estate', foreignname:'cd_excelSheetName'},
      {type:'text', id:'custpage_estate_sent_to_mailer_at', label:'Sent To Mailer At', container:'custpage_estate', foreignname:'cd_sentToMailerAt'},
      {type:'text', id:'custpage_estate_created_at', label:'Created At', container:'custpage_estate', foreignname:'cd_createdAt'},
      {type:'text', id:'custpage_estate_status', label:'Status', container:'custpage_estate', foreignname:'cd_status'},
      {type:'text', id:'custpage_estate_error_reason', label:'Error Reason', container:'custpage_estate', foreignname:'cd_errorReason'},
      {type:'text', id:'custpage_customer_name', label:'Customer Name', container:'custpage_customer', foreignname:'beneficiary_name'},
      {type:'text', id:'custpage_customer_address', label:'Customer Address', container:'custpage_customer', foreignname:'beneficiary_address'},
      {type:'text', id:'custpage_customer_city', label:'Customer City', container:'custpage_customer', foreignname:'beneficiary_city'},
      {type:'text', id:'custpage_customer_state', label:'Customer State', container:'custpage_customer', foreignname:'beneficiary_state'},
      {type:'text', id:'custpage_customer_zip_code', label:'Customer Zip', container:'custpage_customer', foreignname:'beneficiary_zipCode'},
      {type:'text', id:'custpage_customer_status', label:'Customer Status', container:'custpage_customer', foreignname:'beneficiary_status'},
      {type:'text', id:'custpage_customer_unsubscribe', label:'Customer Unsubscribe Code', container:'custpage_customer', foreignname:'mr_unsubscribeCode'},
      {type:'text', id:'custpage_customer_comment', label:'Customer Comment', container:'custpage_customer', foreignname:'beneficiary_comment'}
    ];
  }

    function toProperCase(str) {
      if (!str) {
        return "";
      }
      return str.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
    }

  return {
    onRequest: onRequest
  }
});

