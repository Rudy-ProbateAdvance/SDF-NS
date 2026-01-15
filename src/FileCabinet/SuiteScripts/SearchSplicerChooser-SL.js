/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/search', 'N/query', 'N/redirect', 'N/runtime', 'N/ui/serverWidget', 'SuiteScripts/Libraries/RM-functions.js'], function(record, search, query, redirect, runtime, sw, rmfunc) {
  function getdata2(searches) {
    log.debug('getdata2 searches:'+ JSON.stringify(searches));
    var results=[];
    for(var i=0; i<searches.length; i++) {
      var s=search.load(searches[i]);
      s.filters.push(search.createFilter({name:'formulanumeric', operator:'equalto', values:'1', formula:'case when rownum <=10 then 1 else 0 end'}));
      log.debug('searchid:'+searches[i]);
      var rs=rmfunc.getSearchResults(s);
      results.push({cols:s.columns, res:rs});
      log.debug('one result', JSON.stringify(rs[0]));
    }
    return results;
  }
  
  function getdata1() {
    if(stage=1)var columns=[];
    var filters=[];
    columns.push(search.createColumn({name:'id'}));
    columns.push(search.createColumn({name:'recordtype', sort:'ASC'}));
    columns.push(search.createColumn({name:'internalid'}));
    columns.push(search.createColumn({name:'title', sort:'ASC'}));
    var s=search.create({columns:columns, filters:filters, type:'savedsearch'});
    var rs=rmfunc.getSearchResults(s);
    return rs;
  }
  
function drawForm2(searches) {
  var data=getdata2(searches);
  var form=sw.createForm({id:'custpage_mainform', title:'Select Key Columns'});
  var fld=null;
  fld=form.addField({id:'custpage_searchkey0', label:'Select Key Field for Search 0', type:'select'});
  fld.addSelectOption({text:'Select...', value:'-1'});
  for(var j=0; j<data[0].cols.length; j++) {
    var col=data[0].cols[j];
    var join=col.join+'_';
    if(join=='_' || join=='undefined_')
      join='';
    var name=join+col.name;
    fld.addSelectOption({text:name, value:j});
  }
  fld=form.addField({id:'custpage_searchkey1', label:'Select Key Field for Search 1', type:'select'});
  fld.addSelectOption({text:'Select...', value:'-1'});
  for(var j=0; j<data[1].cols.length; j++) {
    var col=data[1].cols[j];
    var join=col.join+'_';
    if(join=='_' || join=='undefined_')
      join='';
    var name=join+col.name;
    fld.addSelectOption({text:name, value:j});
  }
  fld=form.addField({id:'custpage_stage', label:'Stage', type:'text'});
  fld.updateDisplayType({displayType:'hidden'});
  fld.defaultValue='3';
  fld=form.addField({id:'custpage_searchids', label:'Search IDs', type:'text'});
  fld.updateDisplayType({displayType:'hidden'});
  fld.defaultValue=searches.join(',');
  log.debug('searches:'+fld.defaultValue);
  
  for(var i=0; i<data.length; i++) {
    var d=data[i];
    var cols=d.cols;
    var sl=form.addSublist({label:'Search '+i, id:'custpage_sublist_search'+i, type:'list'});
    for(var j=0; j<cols.length; j++) {
      var col=cols[j];
      var join=col.join+'_';
      if(join=='_' || join=='undefined_')
        join='';
      var label=join+col.label;
      name='f'+j;
      log.debug('column name', JSON.stringify({label:label, id:name, type:'textarea'}));
      sl.addField({label:label, id:name, type:'textarea'});
    }
    var results=d.res;
    log.debug('one result', JSON.stringify(results[0]));
    for(var j=0; j<results.length; j++) {
      var result=results[j];
      for(var k=0; k<cols.length; k++) {
        var col=cols[k];
        var join=col.join+'_';
        if(join=='_' || join=='undefined_')
          join='';
        var name=join+col.name;
        var val=result[name].text;
        if(!val)
          val=result[name].value;
        if(!val)
          val=' ';
//        sl.setSublistValue({id:'f'+k, value:result[name].value || ' ', line:j});
        sl.setSublistValue({id:'f'+k, value:val, line:j});
      }
    }
  }
  form.addSubmitButton({label:'Submit'});
  return form;
}
  
  function drawForm1() {
    var data=getdata1();
    log.debug(JSON.stringify(data[0]));
    var form=sw.createForm({id:'custpage_mainform', title:'Select Searches'});
    var fld=null;
    fld=form.addField({id:'custpage_search1', label:'Search 1 Selector', type:'select'});
    fld.addSelectOption({text:'Select...', value:'Select...'});
    for(var i=0; i<data.length; i++) {
      var result=data[i];
      var text=result.recordtype.value + ' : ' + result.title.value;
      var value=result.internalid.value;
      fld.addSelectOption({text:text, value:value});
    }
    fld=form.addField({id:'custpage_search2', label:'Search 2 Selector', type:'select'});
    fld.addSelectOption({text:'Select...', value:'Select...'});
    for(var i=0; i<data.length; i++) {
      var result=data[i];
      var text=result.recordtype.value + ' : ' + result.title.value;
      var value=result.internalid.value;
      fld.addSelectOption({text:text, value:value});
    }
    fld=form.addField({id:'custpage_stage', label:'Stage', type:'text'});
    fld.updateDisplayType({displayType:'hidden'});
    fld.defaultValue='2';
    form.addSubmitButton({label:'Submit'});
    return form;
  }

  function doGet(context){
    var form=drawForm1();
    context.response.writePage(form);
  }

  function doPost(context) {
    var stage=context.request.parameters.custpage_stage;
    var searches=[];
    var search1=context.request.parameters.custpage_search1;
    var search2=context.request.parameters.custpage_search2;
    if(search1 && search2 && search1!='Select...' && search2!='Select...' && search1!=search2)
      searches=[search1, search2];
    else
      stage='1';
    log.debug('stage:'+stage);
    log.debug('searches', JSON.stringify(searches));
    switch(stage) {
      case '1':
        log.debug('switch stage case=1')
        form=drawForm1();
        break;
      case '2':
        log.debug('switch stage case=2')
        form=drawForm2(searches);
        break;
      default:
        log.debug('no stage, skipping')
    }
    context.response.writePage(form);
    return;
  }


  function onRequest(context) {
    var stage=context.request.parameters.custpage_stage;
    var searchids=context.request.parameters.custpage_searchids;
    var key0=context.request.parameters.custpage_searchkey0;
    var key1=context.request.parameters.custpage_searchkey1;
    if(stage=='3') {
      log.debug('redirect parameters:', JSON.stringify({scriptId:'2306', deploymentId:'1', parameters:{searchids:searchids, keys:key0+','+key1}}));
      redirect.toSuitelet({scriptId:'2306', deploymentId:'1', parameters:{searchids:searchids, keys:key0+','+key1}});
      return;
    }
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
