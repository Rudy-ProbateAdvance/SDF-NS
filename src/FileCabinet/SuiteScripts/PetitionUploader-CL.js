/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(['N/record', 'N/search', 'N/query', 'N/runtime', 'SuiteScripts/Libraries/RM-functions.js'], function(record, search, query, runtime, rmfunc) {

  function blank(n) {
    if(n=='' || n==null)
      return true;
    else
      return false;
  }

  function fieldChanged(context) {
    if(runtime.getCurrentUser().id=='2299863') {
//      alert('function:fieldChanged');
    }
	  return true;
  }

  function lineInit(context) {
    if(runtime.getCurrentUser().id=='2299863') {
//      alert('function:lineInit');
    }
	  return true;
  }

  function pageInit(context) {
    if(runtime.getCurrentUser().id=='2299863') {
//      alert('function:pageInit');
    }
    return true;
  }

  function postSourcing(context) {
    if(runtime.getCurrentUser().id=='2299863') {
//      alert('function:postSourcing');
    }
	  return true;
  }

  function saveRecord(context) {
    var rec=context.currentRecord;
    var uid=rec.getValue('custpage_userid');
    var pw=rec.getValue('custpage_password');
    var newpw=rec.getValue('custpage_newpassword');
    var confnewpw=rec.getValue('custpage_confirmnewpassword');
    var fileupl=rec.getValue('custpage_file');
    var county=rec.getValue('custpage_county');
    var casenum=rec.getValue('custpage_casenum');
    if(true || runtime.getCurrentUser().id=='2299863') {
      if(blank(uid)||blank(pw)) {
        alert('UserID and Password cannot be blank.');
        return false;
      }
      if(newpw!=confnewpw){
        alert('New passwords must match.');
        return false;
      }
      if(blank(newpw)){
        if(blank(fileupl)){
          alert('A file must be selected.');
          return false;
        }
        if(blank(county)) {
          alert('County cannot be blank.');
          return false;
        }
        if(blank(casenum)){
          alert('Case Number cannot be blank.');
          return false;
        }
      }
    }
    return true;
  }

  function sublistChanged(context) {
    if(runtime.getCurrentUser().id=='2299863') {
//      alert('function:sublistChanged');
    }
	  return true;
  }

  function validateDelete(context) {
    if(runtime.getCurrentUser().id=='2299863') {
//      alert('function:validateDelete');
    }
	  return true;
  }

  function validateField(context) {
    if(runtime.getCurrentUser().id=='2299863') {
//      alert('function:validateField');
    }
	  return true;
  }

  function validateInsert(context) {
    if(runtime.getCurrentUser().id=='2299863') {
//      alert('function:validateInsert');
    }
	  return true;
  }

  function validateLine(context) {
    if(runtime.getCurrentUser().id=='2299863') {
//      alert('function:validateLine');
    }
	  return true;
  }

  function localizationContextEnter(context) {
    if(runtime.getCurrentUser().id=='2299863') {
//      alert('function:localizationContextEnter');
    }
	  return true;
  }

  function localizationContextExit(context) {
    if(runtime.getCurrentUser().id=='2299863') {
//      alert('function:localizationContextExit');
    }
	  return true;
  }

  return {
	  fieldChanged:fieldChanged,
	  lineInit:lineInit,
	  pageInit:pageInit,
	  postSourcing:postSourcing,
	  saveRecord:saveRecord,
	  sublistChanged:sublistChanged,
	  validateDelete:validateDelete,
	  validateField:validateField,
	  validateInsert:validateInsert,
	  validateLine:validateLine,
	  localizationContextEnter:localizationContextEnter,
	  localizationContextExit:localizationContextExit
  };
});
