/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/search', 'N/query', 'N/runtime', 'N/ui/serverWidget', 'SuiteScripts/Libraries/RM-functions.js'], function(record, search, query, runtime, sw, rmfunc) {
  function drawForm(custintid, lateststatusid) {
    var fld=null;
    var form=sw.createForm({title:'New Case Status'});
    form.clientScriptModulePath='SuiteScripts/NewCaseStatusPopup-CL';
    fld=form.addField({id:'custpage_case_status_customer', label:'CustomerID', type:'text'});
    fld.defaultValue=custintid;
    fld.updateDisplayType({displayType:'hidden'});
    var q;
    q=`select id, custrecord_case_status_status, custrecord_case_status_notes from customrecord_case_status where custrecord_case_status_customer=${custintid} and custrecord_latest_status='T' order by id desc`;
    var casestatusdata=rmfunc.getQueryResults(q);
    q=`select entitytitle, fullname from customer where id=${custintid}`;
    var custdata=rmfunc.getQueryResults(q);
    var custid=custdata[0].fullname;
    fld=form.addField({id:'custpage_customer_name', label:'Customer', type:'text'});
    fld.defaultValue=custid;
    fld.updateDisplaySize({width:75, height:1});
    fld.updateDisplayType({displayType:'inline'});
    fld.updateLayoutType({layoutType:'outside'});
    fld.updateBreakType({breakType:'startrow'});
    fld=form.addField({id:'custpage_case_status_status', label:'Status', type:'select', source:'customlist_case_statuses'});
    fld.defaultValue=casestatusdata[0].custrecord_case_status_status;
    fld.updateLayoutType({layoutType:'outside'});
    fld.updateBreakType({breakType:'startrow'});
    fld=form.addField({id:'custpage_case_status_notes', label:'Notes', type:'textarea'});
    fld.defaultValue=casestatusdata[0].custrecord_case_status_notes;
    fld.updateDisplaySize({height:15, width:60})
    fld.updateLayoutType({layoutType:'outside'});
    fld.updateBreakType({breakType:'startrow'});
    form.addSubmitButton();
    return form;
  }

  function doGet(context){
    if(!!context.request.parameters.lateststatusid) {
      var lateststatusid=context.request.parameters.lateststatusid;
    }
    if(!!context.request.parameters.custintid) {
      var custintid=context.request.parameters.custintid
    } else {
      context.response.writeLine('No customer id was provided');
      return;
    }
    var form=drawForm(custintid, lateststatusid);
    context.response.writePage(form);
  }

  function doPost(context) {
    var params=context.request.parameters;
    var casestatus={};
    casestatus.custintid=params.custpage_case_status_customer;
    casestatus.statusid=params.custpage_case_status_status;
    casestatus.notes=params.custpage_case_status_notes;
    casestatus.customername=params.custpage_customer_name;
    var q=`select * from customrecord_case_status where custrecord_case_status_customer=${casestatus.custintid} and custrecord_latest_status is not null`;
    var rs=rmfunc.getQueryResults(q);
    rs.forEach(function(result){
      var id=result.id;
      record.submitFields({type:'customrecord_case_status', id:id, values:{custrecord_latest_status:null}});
    });
    var rec=record.create({type:'customrecord_case_status'});
    rec.setValue({fieldId:'custrecord_case_status_customer', value:casestatus.custintid});
    rec.setValue({fieldId:'custrecord_case_status_status', value:casestatus.statusid});
    rec.setValue({fieldId:'custrecord_case_status_notes', value:casestatus.notes});
    rec.setValue({fieldId:'custrecord_latest_status', value:true});
    statusrecid=rec.save();
    
    //    context.response.writeLine('Complete');

    var form=sw.createForm({title:"Done"});
//    form.addButton({id:'custpage_close_button', label:'Close', functionName:testt});
    var fld=form.addField({id:"custpage_information", type:"textarea", label:"Information"});
    fld.updateLayoutType({layoutType:'outside'});
    fld.updateBreakType({breakType:'startrow'});
    fld.updateDisplayType({displayType:'inline'});
    fld.defaultValue=`Created a new case status\nfor customer ${casestatus.customername}\nwith internalid ${statusrecid}.\nPlease close this window.`;
    fld=form.addField({id:"custpage_close", type:"inlinehtml", label:"Close Window"});
    fld.updateLayoutType({layoutType:'outside'});
    fld.updateBreakType({breakType:'startrow'});
    fld.defaultValue="<input type='button' name='closewindow' id='closewindow' value='Close Window' onclick='window.opener.saveall();window.close();'/>";
    context.response.writePage(form);
    return;
  }


  function onRequest(context) {
    if (context.request.method === "GET") {
      doGet(context);
    } else {
      doPost(context);
    }
  }

  return {
    onRequest: onRequest
  };
});
