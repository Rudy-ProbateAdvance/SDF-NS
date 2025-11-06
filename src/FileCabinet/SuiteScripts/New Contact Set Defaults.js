/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/redirect', 'N/record'], function(redirect, record){

  function beforeLoad(context){
    try {
      var recordid=context.request.parameters.id;
      var mode=context.type;
      if(mode=='view') {
//        redirect.toRecord({id:recordid, type:'contact', isEditMode:true});
      }
    } catch(e) {
      log.debug(e.message)
    }
  }

  function beforeSubmit(context){
    try{
      var rec=context.newRecord;
      var subsidiary=rec.getValue({fieldId:'subsidiary'});
      var company=rec.getValue({fieldId:'company'});
      var name=rec.getValue({fieldId:'entityid'});
      var phone=rec.getValue({fieldId:'phone'});
      if(subsidiary==null || subsidiary=='') {
        rec.setValue({fieldId:'subsidiary', value:'2'});
      }
      if(company && rec.id) {
        record.attach({record:{type:'contact', id:rec.id}, to:{type:'customer', id:company}, attributes:{role:'-10'}});
        rec.setValue({fieldId:'company', value:null});
      }
      if(!name.match(phone)) {
        name=name.replace(/ :.*/,'');
        name=`${name} : ${phone}`;
        rec.setValue({fieldId:'entityid', value:name});
      }
    } catch(e) {
      log.error({title:e.message});
    }
  }

  return {
    beforeLoad:beforeLoad,
    beforeSubmit:beforeSubmit,
  };
});