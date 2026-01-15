/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/query', 'SuiteScripts/Libraries/RM-functions.js'], function(record, query, rmfunc) {

  function getInputData(){
    log.debug('begin');
    q=`select r.company, r.contact, r.role, c.category 
    from companycontactrelationship r 
    join contact c on c.id=r.contact
    where r.role is null and c.category is not null
    order by r.company desc`;
    var rs=rmfunc.getQueryResults(q);
    return rs;
  }

  function removeDuplicates(arr) {
      return arr.filter((item,
          index) => arr.indexOf(item) === index);
  }

  function map(context) {
    var val=JSON.parse(context['value']);
//    log.debug('context.value', context.value);
    try {
      var contactid=val.contact;
      var estateid=val.company;
      if(!val.category) {
        return true;
      }
      if(val.role) {
        return true;
      }
      var categories=val.category.split(', ');
      var category=removeDuplicates(categories);
      if(category.length==1) {
        var cat=category[0];
        var role=null;
        if(cat=='1')
          role='1';
        if(cat=='2')
          role='-10';
        try {
          //nlapiAttachRecord('contact', contactid, 'customer', estateid, {role:role})
          record.attach({record:{type:'contact', id:contactid}, to:{type:'customer', id:estateid}, attributes:{role:role}});
          log.debug('success', `contact ${contactid} successfully attached to estate ${estateid} and role set to ${role}`);
        } catch(e) {
          log.error('error', `error: failed attaching contact ${contactid} to estate ${estateid} with role ${role}: ${e.message}`);
        }
        if(categories.length>1) {
          try {
            record.submitFields({type:'contact', id:contactid, values:{category:cat}});
            log.debug('success', `contact ${contactid} successfully updated with category ${cat}`);
          } catch(e) {
            log.error('error', `error: failed updating contact ${contactid} with category ${cat}: ${e.message}`);
          }
        }
      } else {
        log.error('error', 'multiple categories', JSON.stringify(result));
      }
      return true;
    } catch(e) {
      log.error('error', `error: ${e.message}. ${JSON.stringify(result)}`);
    }
  }

  function summarize(context) {
    log.debug('end');
  }
  
  return {getInputData: getInputData, map: map, summarize:summarize};
});