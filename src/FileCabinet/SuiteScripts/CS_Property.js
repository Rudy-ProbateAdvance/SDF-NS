/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/runtime', 'N/record', 'N/search'], function(runtime, record, search){

  function fieldChanged(context) {
    if(context.fieldId=='name') {
      rec=context.currentRecord;
      rec.setValue({fieldId:'custrecord_property_address_to_update', value:true});
    }
	  return true;
  }

  return {
	  fieldChanged:fieldChanged,
  };
});