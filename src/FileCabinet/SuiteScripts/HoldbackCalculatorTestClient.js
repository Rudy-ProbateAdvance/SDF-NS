/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/runtime', 'N/record', 'N/search'], function(runtime, record, search){

  function fieldChanged(context) {
//    var user=runtime.getCurrentUser();
//    if(user.id=='2299863') {
//      alert(context.fieldId);
//    }
//    alert('function:fieldChanged; sublist:'+context.sublistId+'; field:'+context.fieldId)
	  return true;
  }

  function lineInit(context) {
//    alert('function:lineInit; sublist:'+context.sublistId+'; field:'+context.fieldId)
	  return true;
  }

  function pageInit(context) {
//    alert('function:pageInit; sublist:'+context.sublistId+'; field:'+context.fieldId)
	  return true;
  }

  function postSourcing(context) {
//    alert('function:postSourcing; sublist:'+context.sublistId+'; field:'+context.fieldId)
	  return true;
  }

  function saveRecord(context) {
//    alert('function:saveRecord; sublist:'+context.sublistId+'; field:'+context.fieldId)
	  return true;
  }

  function sublistChanged(context) {
//    alert('function:sublistChanged; sublist:'+context.sublistId+'; field:'+context.fieldId)
	  return true;
  }

  function validateDelete(context) {
//    alert('function:validateDelete; sublist:'+context.sublistId+'; field:'+context.fieldId)
	  return true;
  }

  function validateField(context) {
//    alert('function:validateField; sublist:'+context.sublistId+'; field:'+context.fieldId)
	  return true;
  }

  function validateInsert(context) {
//    alert('function:validateInsert; sublist:'+context.sublistId+'; field:'+context.fieldId)
	  return true;
  }

  function validateLine(context) {
//    alert('function:validateLine; user:'+user.name+'; sublist:'+context.sublistId+'; field:'+context.fieldId);
	  return true;
  }

  function localizationContextEnter(context) {
//    alert('function:localizationContextEnter; sublist:'+context.sublistId+'; field:'+context.fieldId)
	  return true;
  }

  function localizationContextExit(context) {
//    alert('function:localizationContextExit; sublist:'+context.sublistId+'; field:'+context.fieldId)
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