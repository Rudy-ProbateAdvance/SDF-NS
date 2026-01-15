/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 */
define(['N/record','N/search'], function(record,search) {

  function getInputData(){
    log.debug({title:'begin'});
    log.debug('get input data');
    var columns=[];
    var filters=[];
    filters.push(search.createFilter({name:'isinactive', operator:'is', values:false}));
    filters.push(search.createFilter({name:'custrecord_property_address_to_update', operator:'is', values:true}));
    filters.push(search.createFilter({name:'custrecord_property_geocode_response', operator:'isnotempty'}));
//    filters.push(search.createFilter({name:'formulanumeric', formula:'rownum', operator:'lessthanorequalto', values:'10'}));
    var s=search.create({type:'customrecord_property', columns:columns, filters:filters});
    var pageddata=s.runPaged({pageSize:1000});
    var rc=pageddata.count;
    log.debug('found '+rc+' results');
    var propertylist=[];
    var index=0;
    do {
      var page=pageddata.fetch(index++);
      page.data.forEach(function(result) {
        propertylist.push(result.id);
      });
    } while(!page.isLast);
    return propertylist;
  }

  function map(context) {
    var propertyid=context.value;
    var success=record.submitFields({type:'customrecord_property', id:propertyid, values:{'custrecord_property_address_to_update':false}});
    log.debug('map - property id:'+propertyid+'; '+success);
    return;
  }

  function summarize(context) {
    log.debug('end');
  }

  return {getInputData: getInputData, map: map, summarize:summarize};
});