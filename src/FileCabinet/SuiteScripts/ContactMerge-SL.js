/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/search', 'N/ui/serverWidget', 'SuiteScripts/Libraries/RM-functions.js'], function(record, search, sw, rmfunc) {

  function processdata(params) {
    var pid=params.primary;
    log.debug('dupes', '-'+dupes+'-');
    var dupes=(!!params.dupes?params.dupes:'').split(/\u0005/);
    log.debug(`dupes: -${dupes}-`);
    var p={};
//    var primary=record.load({type:'contact', id:pid});
    var success=[];
    var errors=[];
    var contactid;
    var companyid;
    if(dupes.length>0 && dupes[0]) {
      log.debug('dupes length', dupes.length);
      for(i=0;i<dupes.length;i++) {
        var dupe=dupes[i];
        var q=`select * from companycontactrelationship where contact=${dupe}`;
        rs=rmfunc.getQueryResults(q);
      //role 1=Attorney, -10=Primary Contact (PR)
        rs.forEach(function(relationship){ 
          var contactid=relationship.contact;
          var companyid=relationship.company;
          var role=relationship.role?relationship.role:1;
          log.debug(contactid + ' ' + companyid + ' ' + role);
          try{
            record.attach({record:{type:'contact', id:pid}, to:{type:'customer', id:companyid}, attributes:{role:1}});
            success.push("successfully attached contact with id "+pid+" to customer with id "+companyid);
          } catch(e) {
            errors.push("error attaching contact with id "+pid+" to customer with id "+companyid+": "+e.message);
          }
          try{
            record.detach({record:{type:'contact', id:contactid}, from:{type:'customer', id:companyid}});
            success.push("successfully detached contact with id "+contactid+" from customer with id "+companyid);
          } catch(e) {
            errors.push("error detaching contact with id "+contactid+" from customer with id "+companyid+": "+e.message);
          }
        });
        try {
          record.delete({type:'contact', id:dupe});
          success.push("successfully deleted contact with id "+dupe);
        } catch(e) {
          errors.push("error deleting contact with id "+dupe+": "+e.message);
        }
      }
    }
    if(errors.length==0) {
      var q=`select * from companycontactrelationship where contact=${pid}`;
      var rs=rmfunc.getQueryResults(q);
      rs.forEach(function(relationship){ 
        contactid=pid;
        companyid=relationship.company;
        var role=relationship.role
        if(role==null || role==''){
          try{
              record.detach({record:{type:'contact', id:contactid}, from:{type:'customer', id:companyid}});
              success.push("successfully detached contact with id "+contactid+" from customer with id "+companyid);
          } catch(e) {
            errors.push("error detaching contact with id "+contactid+" from customer with id "+companyid+": "+e.message);
          }
          try{
            record.attach({record:{type:'contact', id:pid}, to:{type:'customer', id:companyid}, attributes:{role:1}});
            success.push("successfully attached contact with id "+contactid+" to customer with id "+companyid);
          } catch(e) {
            errors.push("error attaching contact with id "+contactid+" to customer with id "+companyid+": "+e.message);
          }
        }
      });
      try {
        var primary=record.load({type:'contact', id:pid});
        primary.setValue({fieldId:'category', value:1});
        primary.setValue({fieldId:'subsidiary', value:2});
        var company=primary.getValue({fieldId:'company'});
        if(company!=null && company!='')
          primary.setValue({fieldId:'company', value:null});
        var name=primary.getValue({fieldId:'entityid'});
        var phone=primary.getValue({fieldId:'phone'});
        if(!name.match(phone)) {
          name=name.replace(/ :.*/,'');
          name=`${name} : ${phone}`;
          primary.setValue({fieldId:'entityid', value:name});
        }
        primary.save({enableSourcing:false, ignoreMandatoryFields:true});
        success.push(`successfully updated name and company for primary contact with id ${pid}`)
      } catch(e) {
        errors.push(`error updating primary contact with id ${pid}: ${e.message}`);
      }
    }
    results={success:success,errors:errors};
    return results;
  }
  
  function parsefields(id) {
    try {
      var results=search.lookupFields({type:'contact', id:id, columns:['internalid', 'entityid', 'company', 'custentity_law_firm', 'category', 'address']});
      if(Object.keys(results).length==0) {
        return "*contact with id "+id+" does not exist";
      }
    } catch(e) {
      return "error looking up contact with id "+id+": "+e.message;
    }
    var retval=[];
    var intid=results.internalid[0].value;
    var contactlink=`<a target="_blank" href="https://5295340-sb1.app.netsuite.com/app/common/entity/entity.nl?id=${intid}">(view contact)</a>`;
    retval.push(contactlink);
    retval.push(intid);
    retval.push(results.entityid);
    if(results.category.length>0) {
      retval.push(results.category[0].text);
    }
    if(results.company.length>0) {
      retval.push(results.company[0].text);
    }
    retval.push(results.custentity_law_firm);
    if(results.address) {
      retval.push(results.address.replace(/\n/g,', ').replace(/\r/g,''));
    }
    return retval.join(' ■ ');
  }
  
  function drawForm1(){
    var form=sw.createForm({title:'Merge Contacts'});
    var fld;
    fld=form.addField({label:'Instructions', type:'textarea', id:'instructions'});
    fld.defaultValue=`Please verify that all contacts to be merged are the same person!
    1. Enter the internal id of the primary (the one that will remain and take the place of the others) in the Primary Contact field.
    2. Enter the internal id's of the duplicates (their data will be merged into the primary, and then be deleted) in the Duplicates field, one id per line.
    3. Press the Submit button.`;
    fld.updateDisplayType({displayType:'inline'});
    fld=form.addField({label:'Primary Contact', type:'text', id:'primary'});
    fld.updateLayoutType({layoutType:'outsidebelow'});
    fld.updateBreakType({breakType:'startrow'});
    fld.setHelpText(`Primary Contact's internalid. This contact will absorb data from the duplicates and will be the remaining one after the process is complete.`);
    fld=form.addField({label:'Duplicates', type:'textarea', id:'dupes'});
    fld.updateLayoutType({layoutType:'outsidebelow'});
    fld.updateBreakType({breakType:'startrow'});
    fld.setHelpText(`Duplicate Contacts internal id's go here, one per line. Their relationships will be added to the primary, and then they will be deleted.`)
    fld=form.addField({label:'stage', type:'text', id:'stage'});
    fld.defaultValue='1';
    fld.updateDisplayType({displayType:'hidden'});
    fld=form.addSubmitButton({label:'Submit'});
    return form;
  }

  function drawForm2(params) {
    var form=sw.createForm({title:'Confirm Contacts'});
    var fld;
    fld=form.addField({label:'Note:', type:'textarea', id:'instructions'});
    fld.updateDisplayType({displayType:'inline'});
    fld.defaultValue=`<font color=red>Please confirm all duplicates are correct. THEY WILL BE DELETED after this operation!</font>`;
    fld=form.addField({label:'Primary', type:'textarea', id:'pc'});
    fld.updateDisplayType({displayType:'inline'});
    fld.updateLayoutType({layoutType:'outsidebelow'});
    fld.updateBreakType({breakType:'startrow'});
    var id=params.primary;
    fld.defaultValue=parsefields(id);
    fld=form.addField({label:'Duplicates', type:'textarea', id:'dc'});
    var dupes=params.dupes.replace(/\r/g,'').split(/\n/);
    fld.updateDisplayType({displayType:'inline'});
    fld.updateLayoutType({layoutType:'outsidebelow'});
    fld.updateBreakType({breakType:'startrow'});
    var dupevals=[];
    var dupids=[];
    for(var i=0; i<dupes.length; i++) {
      id=dupes[i];
      var val=parsefields(id);
      if(val[0]!='*') {
        dupids.push(id);
      }
      dupevals.push(val);
    };
    fld.defaultValue=dupevals.join('\n');
    fld=form.addField({label:'stage', type:'text', id:'primary'});
    fld.updateDisplayType({displayType:'hidden'});
    fld.defaultValue=params.primary;
    fld=form.addField({label:'stage', type:'text', id:'dupes'});
    fld.updateDisplayType({displayType:'hidden'});
    fld.defaultValue=dupids;
    fld=form.addField({label:'stage', type:'text', id:'stage'});
    fld.updateDisplayType({displayType:'hidden'});
    fld.defaultValue='2';
    form.addSubmitButton({label:'Process Contacts'});
    return form;
  }

  function drawForm3(params) { //displaying results
    var status=processdata(params);
//    var form=sw.createForm({title:'Processing Results'});
//    var fld;
//    fld=form.addField({label:'stage', type:'text', id:'stage'});
//    fld.updateDisplayType({displayType:'hidden'});
//    fld.defaultValue='3';
//    form.addSubmitButton({label:'Process Contacts'});
    //return form;
    return status;
  }
  
  function onRequest(context) {
    log.debug({title:'parameters', details:JSON.stringify(context.request.parameters)});
    var stage='0';
    var params=context.request.parameters;
    if(!!params.stage) {
      stage=params.stage;
    }
    switch(stage) {
      case '0':
        var form=drawForm1();
        context.response.writePage(form);
        break;
      case '1': // Confirm contacts
        var form=drawForm2(params);
        context.response.writePage(form);
        break;
      case '2': // Processing contacts
        var form=drawForm3(params);
        context.response.writeLine(JSON.stringify(form));
        //context.response.writePage(form);
        break;
      default:
    } 
    return;
  }

  return {
    onRequest: onRequest
  };
});