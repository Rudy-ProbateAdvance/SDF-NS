/**
 *@NApiVersion 2.x
 */
define(['N/record', 'N/search'], function(record, search){

  function doSearch(options) {
    var custintid=options.custintid;
    log.debug({title:'custintid: '+custintid});
    if(!custintid) {
      return {error:'ERROR - No Customer Supplied'};
    }
    var columns=[];
    var filters=[
      ["name","anyof",custintid],
      "AND",
      ["account", "anyof", "230"],
      "AND",
      ["memorized", "is", "F"]
    ];

    columns.push(search.createColumn({name:'entity'}));
    columns.push(search.createColumn({name:'trandate'}));
    columns.push(search.createColumn({name:'type'}));
    columns.push(search.createColumn({name:'internalid'}));
    columns.push(search.createColumn({name:'tranid'}));
    columns.push(search.createColumn({name:'amount'}));
    columns.push(search.createColumn({name:'tranid', join:'custbody_invoice'}));
    var s=search.create({type:'transaction', columns:columns, filters:filters});
    var rc=s.runPaged().count;
//    log.debug({title:'initial result count:'+rc});
    var results=[];
    var pagedData=s.runPaged({pageSize:1000});
    for(i=0;i<pagedData.pageRanges.length; i++) {
      var page=pagedData.fetch(i);
      page.data.forEach(function(result) {
        var data={};
        data.entity=result.getValue('entity');
        data.trandate=result.getValue('trandate');
        data.type=result.getValue('type');
        data.tranintid=result.getValue('internalid');
        data.tranid=result.getValue('tranid');
        data.invoice=result.getValue({name:'tranid', join:'custbody_invoice'});
        data.amount=result.getValue('amount');
        results.push(data);
        return true;
      });
    }
//    log.debug({title:'results', details:JSON.stringify(results)});
    return results;
  }

  /*
   * takes a netsuite search object as an argument.
   * returns an array of netsuite search.result objects,
   * overriding the 4000 result limit
   */
  function getAllResults(s) {
    var rs=s.run();
    var rc=s.runPaged().count;
//    log.debug({title:'resultcount:'+rc});
    var start=0;
    var step=1000;
    var end=start+step;
    var allresults=[];
    do {
//      log.debug({title:'start/step/end', details:start+'/'+step+'/'+end});
      var r=[];
      r=rs.getRange({start:start, end:end});
      r.forEach(function(result){
        allresults.push(result.getAllValues());
        return true;
      });
      start+=step;
      end=start+step;
    } while(start < rc);
    return allresults;
  }

  /*
   * takes search object as primary argument.
   * if secondary argument is 'o' then it returns an object, otherwise returns an array.
   * Each property/array member is an object consisting of one search result row and its properties.
   */
  function getSearchResults(s,ao) {
    if(ao=='o')
      var results={};
    else
      var results=[];
    var rc=s.runPaged().count;
    var pd=s.runPaged({pageSize:1000});
    for(var i=0; i<pd.pageRanges.length; i++) {
      var page=pd.fetch(i);
      page.data.forEach(function(result) {
        var r={};
        r['internalid']={label:'Internal Id', name:'internalid', text:result.id, value:result.id};
        for(var i=0; i<result.columns.length; i++) {
          var label=result.columns[i].label;
          var name=result.columns[i].name;
          var summary=result.columns[i].summary;
          var fn=result.columns[i].function;
          var join=result.columns[i].join;
          var text=result.getText({name:name, summary:summary, join:join, function:fn});
          var value=result.getValue({name:name, summary:summary, join:join, function:fn});
          r[name]={label:label, name:name, text:text, value:value};
        }
        if(ao=='o')
          results[result.id]=r;
        else
          results.push(r);
        return true;
      });
    }
    return results;
  }

  function getDate(date) {
    var d;
    if(date) {
      d=new Date(date);
    } else {
      d=new Date();
    }
    var date=d.getMonth()+1+'/'+d.getDate()+'/'+d.getFullYear();
    return date;
  }

  return {
    doSearch:doSearch,
    getAllResults:getAllResults,
    getSearchResults:getSearchResults,
    getDate:getDate,
  };
});

//      [[["type","anyof","Deposit"],"AND",["account","anyof","230"]],"OR",[["type","anyof","CustInvc"],"AND",["item","anyof","7"]]]
