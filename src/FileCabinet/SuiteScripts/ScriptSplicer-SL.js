/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define(['N/record', 'N/search', 'N/query', 'N/runtime', 'N/ui/serverWidget', 'SuiteScripts/Libraries/RM-functions.js'], function(record, search, query, runtime, sw, rmfunc) {
  function getData(context) {
    var param1=context.request.parameters.searchids;
    var param2=context.request.parameters.keys;
    var searchids=param1.trim().split(',').map(k=>k.trim());
    var keys=param2.trim().split(',').map(k=>k.trim());
    var results=[];
    var searchcolumns=[];
    var keymaps=[];
    log.debug('searchids:'+JSON.stringify(searchids));
    log.debug('keys:'+JSON.stringify(keys));
    for(var i=0; i<searchids.length; i++) {
      var key=keys[i];
      var rs=[];
      var s=search.load(searchids[i]);
      cols=s.columns;
      searchcolumns.push(cols);
      if(i>0) {
        s.filters.push(search.createFilter({name:cols[key].name, join:cols[key].join, operator:'anyof', values:keymaps[0]}));
      }
      var pageddata=s.runPaged();
      pageddata.pageRanges.forEach(function(pagerange) {
        var page=pageddata.fetch(pagerange);
        for(var j=0; j<page.data.length; j++) {
          var result=page.data[j];
          var line=[];
          for(var k=0; k<cols.length; k++) {
            var col=cols[k];
            var join=col.join+'_';
            if(join=='_' || join=='undefined_') {
              join='';
            }
            var name=join+col.name;
            var label=col.label;
            var val=result.getText({name:col.name, join:col.join});
            if(!val)
              val=result.getValue({name:col.name, join:col.join});
            line.push({name:name, value:val, label:label});
          }
          rs.push(line);
        }
      });
      results.push(rs);
      var keymap=rs.map(result=>result[key].value);
      keymaps.push(keymap);
    }

    var data=[];
    var results0=results[0];
    var results1=results[1];
    for(i=0; i<results0.length; i++) {
      var result = results0[i];
      var keyval = keymaps[0][i];
      var exitloop = false;
      matches = [];
      idx = -1;
      while (!exitloop) {
        idx = keymaps[1].indexOf(keyval, ++idx);
        if (idx>=0) {
          matches.push(idx);
        } else {
          exitloop = true;
        }
      }
      var line0=[];
      for (var j=0; j<result.length; j++) {
        var cell=result[j];
        if(j!=keys[0]) {
//        if (cell.name!=cols[keys[0]].name) {
          line0.push(cell);
        }
      }
      if (matches.length==0) {
        var line=[...line0];
        for (var k=0; k<searchcolumns[1].length; k++) {
          var col = searchcolumns[1][k];
          var join = col.join + '_';
          if (join == '_' || join == 'undefined_') {
            join = '';
          }
          var name = join + col.name;
          line.push({name: name, value: ' ', label:col.label});
        }
        data.push(line);
      } else {
        for (var m=0; m<matches.length; m++) {
          var line=[...line0];
          var result = results1[matches[m]];
          for (var j = 0; j < searchcolumns[1].length; j++) {
            var cell = result[j];
            if(j!=keys[1]) {
//            if (cell.name!=cols[keys[1]].name) {
              line.push(cell);
            }
          }
          data.push(line);
        }
      }
    }
    return data;
  }

  function drawForm(data) {
    var form=sw.createForm({title:'Combined Search Results'});
    form.clientScriptModulePath='SuiteScripts/ScriptSplicer-CL.js';
    form.addButton({
      id:'custpage_btn_csvexport',
      label:'Export as CSV',
      functionName:"csvexport"
    });
    var fld=null;
    fld=form.addField({id:'custpage_csvfilename', label:'CSV filename Without Extension (optional)', type:'text'});
    var table=form.addSublist({label:'Combined Search Results', id:'custpage_sl_results', type:'list'});
    for(var i=0; i<data[0].length; i++) {
      var f=data[0][i];
      var fieldid='custpage_field'+i;
      var label=f.label.trim();
      log.debug('fieldlabel:-'+label+'-')
      fld=table.addField({id:fieldid, label:label, type:'textarea'});
    }

    for(var i=0; i<data.length; i++) {
      var line=data[i];
      for(var j=0; j<line.length; j++) {
        var cell=line[j];
        var fieldid='custpage_field'+j;
        var label=cell.label;
        var value=cell.value.trim();
        if(!value)
          value=' ';
        table.setSublistValue({id:fieldid, line:i, value:value});
      }
    }
    return form;
  }

  function doGet(context){
    var data=getData(context);
//    log.debug({title:'data', details:JSON.stringify(data)});
    var form=drawForm(data);
    context.response.writePage(form);
//    context.response.writeLine(JSON.stringify(data));
  }

  function doPost(context) {
    context.response.writeLine('Complete');
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

function quickdata() {
  return {"searchdata":[{"title":null,"id":1161,"type":"phonecall","filters":[["assigned","anyof","3535291"]],"columns":[{"name":"company","label":"Estate","function":"none"},{"name":"startdate","label":"Date Opened","function":"none"},{"name":"message","label":"Comment (include Client Name)","function":"none"},{"name":"lastmodifieddate","label":"Last Update","function":"none"},{"name":"custentity1","label":"Case #","join":"companyCustomer","function":"none"},{"name":"custentity3","label":"State","join":"companyCustomer","function":"none"},{"name":"custentity2","label":"County","join":"companyCustomer","function":"none"},{"name":"owner","label":"Created By","function":"none"},{"name":"status","label":"Status","function":"none"},{"name":"title","label":"Subject","function":"none"},{"name":"assigned","label":"Organizer","function":"none"}]},{"title":null,"id":1162,"type":"customer","filters":[["category","anyof","1"]],"columns":[{"name":"entityid","label":"ID","function":"none"},{"name":"altname","label":"Name","function":"none"},{"name":"custentity_sales_rep","label":"Sales Rep","function":"none"},{"name":"internalid","label":"Internal ID","join":"parentCustomer","function":"none"}]}],"searchresults":[[{"internalid":{"label":"Internal Id","name":"internalid","text":"66634","value":"66634"},"company":{"label":"Estate","name":"company","text":"10156 final name","value":"143904"},"startdate":{"label":"Date Opened","name":"startdate","text":null,"value":"2/27/2025"},"message":{"label":"Comment (include Client Name)","name":"message","text":null,"value":"test"},"lastmodifieddate":{"label":"Last Update","name":"lastmodifieddate","text":null,"value":"3/4/2025 12:42 pm"},"companyCustomer_custentity1":{"label":"companyCustomer_Case #","name":"companyCustomer_custentity1","text":null,"value":""},"companyCustomer_custentity3":{"label":"companyCustomer_State","name":"companyCustomer_custentity3","text":"Colorado","value":"8"},"companyCustomer_custentity2":{"label":"companyCustomer_County","name":"companyCustomer_custentity2","text":"Colorado_Douglas","value":"263"},"owner":{"label":"Created By","name":"owner","text":"Jeffrey Mezzancello","value":"2698763"},"status":{"label":"Status","name":"status","text":"Completed","value":"COMPLETE"},"title":{"label":"Subject","name":"title","text":null,"value":"Docket Check"},"assigned":{"label":"Organizer","name":"assigned","text":"Doc U Ment","value":"3535291"}},{"internalid":{"label":"Internal Id","name":"internalid","text":"66657","value":"66657"},"company":{"label":"Estate","name":"company","text":"293 Test Decedent","value":"1362"},"startdate":{"label":"Date Opened","name":"startdate","text":null,"value":"2/27/2025"},"message":{"label":"Comment (include Client Name)","name":"message","text":null,"value":"Need docs ASAP  update"},"lastmodifieddate":{"label":"Last Update","name":"lastmodifieddate","text":null,"value":"3/4/2025 2:21 pm"},"companyCustomer_custentity1":{"label":"companyCustomer_Case #","name":"companyCustomer_custentity1","text":null,"value":"123456789"},"companyCustomer_custentity3":{"label":"companyCustomer_State","name":"companyCustomer_custentity3","text":"Florida","value":"3"},"companyCustomer_custentity2":{"label":"companyCustomer_County","name":"companyCustomer_custentity2","text":"North Carolina_Davie","value":"1921"},"owner":{"label":"Created By","name":"owner","text":"Jeffrey Mezzancello","value":"2698763"},"status":{"label":"Status","name":"status","text":"Completed","value":"COMPLETE"},"title":{"label":"Subject","name":"title","text":null,"value":"Doc Request"},"assigned":{"label":"Organizer","name":"assigned","text":"Doc U Ment","value":"3535291"}},{"internalid":{"label":"Internal Id","name":"internalid","text":"66731","value":"66731"},"company":{"label":"Estate","name":"company","text":"105709 [TEMP] Jeremy Milim TEST","value":"1864538"},"startdate":{"label":"Date Opened","name":"startdate","text":null,"value":"2/28/2025"},"message":{"label":"Comment (include Client Name)","name":"message","text":null,"value":"Timmy T Tester"},"lastmodifieddate":{"label":"Last Update","name":"lastmodifieddate","text":null,"value":"3/4/2025 2:21 pm"},"companyCustomer_custentity1":{"label":"companyCustomer_Case #","name":"companyCustomer_custentity1","text":null,"value":""},"companyCustomer_custentity3":{"label":"companyCustomer_State","name":"companyCustomer_custentity3","text":"","value":""},"companyCustomer_custentity2":{"label":"companyCustomer_County","name":"companyCustomer_custentity2","text":"","value":""},"owner":{"label":"Created By","name":"owner","text":"Jeffrey Mezzancello","value":"2698763"},"status":{"label":"Status","name":"status","text":"Scheduled","value":"SCHEDULED"},"title":{"label":"Subject","name":"title","text":null,"value":"Doc Request"},"assigned":{"label":"Organizer","name":"assigned","text":"Doc U Ment","value":"3535291"}},{"internalid":{"label":"Internal Id","name":"internalid","text":"66733","value":"66733"},"company":{"label":"Estate","name":"company","text":"105710 [TEMP] TestMM TEST","value":"1864440"},"startdate":{"label":"Date Opened","name":"startdate","text":null,"value":"2/28/2025"},"message":{"label":"Comment (include Client Name)","name":"message","text":null,"value":"John doe  Doc Request"},"lastmodifieddate":{"label":"Last Update","name":"lastmodifieddate","text":null,"value":"3/4/2025 2:23 pm"},"companyCustomer_custentity1":{"label":"companyCustomer_Case #","name":"companyCustomer_custentity1","text":null,"value":""},"companyCustomer_custentity3":{"label":"companyCustomer_State","name":"companyCustomer_custentity3","text":"","value":""},"companyCustomer_custentity2":{"label":"companyCustomer_County","name":"companyCustomer_custentity2","text":"","value":""},"owner":{"label":"Created By","name":"owner","text":"Michael Yip","value":"2402619"},"status":{"label":"Status","name":"status","text":"Scheduled","value":"SCHEDULED"},"title":{"label":"Subject","name":"title","text":null,"value":"Doc Request"},"assigned":{"label":"Organizer","name":"assigned","text":"Doc U Ment","value":"3535291"}},{"internalid":{"label":"Internal Id","name":"internalid","text":"66798","value":"66798"},"company":{"label":"Estate","name":"company","text":"184041 Richard Silveira","value":"3326278"},"startdate":{"label":"Date Opened","name":"startdate","text":null,"value":"3/3/2025"},"message":{"label":"Comment (include Client Name)","name":"message","text":null,"value":"Daniel Hall Tracie Hall \nDocs Request"},"lastmodifieddate":{"label":"Last Update","name":"lastmodifieddate","text":null,"value":"3/4/2025 2:23 pm"},"companyCustomer_custentity1":{"label":"companyCustomer_Case #","name":"companyCustomer_custentity1","text":null,"value":"24PR00382"},"companyCustomer_custentity3":{"label":"companyCustomer_State","name":"companyCustomer_custentity3","text":"California","value":"1"},"companyCustomer_custentity2":{"label":"companyCustomer_County","name":"companyCustomer_custentity2","text":"California_Santa Cruz","value":"230"},"owner":{"label":"Created By","name":"owner","text":"Jeffrey Mezzancello","value":"2698763"},"status":{"label":"Status","name":"status","text":"Scheduled","value":"SCHEDULED"},"title":{"label":"Subject","name":"title","text":null,"value":"Doc request"},"assigned":{"label":"Organizer","name":"assigned","text":"Doc U Ment","value":"3535291"}},{"internalid":{"label":"Internal Id","name":"internalid","text":"66799","value":"66799"},"company":{"label":"Estate","name":"company","text":"189481 Angela Conley","value":"3530237"},"startdate":{"label":"Date Opened","name":"startdate","text":null,"value":"2/25/2025"},"message":{"label":"Comment (include Client Name)","name":"message","text":null,"value":"Thomas Conley docs requested"},"lastmodifieddate":{"label":"Last Update","name":"lastmodifieddate","text":null,"value":"3/4/2025 2:24 pm"},"companyCustomer_custentity1":{"label":"companyCustomer_Case #","name":"companyCustomer_custentity1","text":null,"value":"2324-0951"},"companyCustomer_custentity3":{"label":"companyCustomer_State","name":"companyCustomer_custentity3","text":"Pennsylvania","value":"38"},"companyCustomer_custentity2":{"label":"companyCustomer_County","name":"companyCustomer_custentity2","text":"Pennsylvania_Delaware","value":"2268"},"owner":{"label":"Created By","name":"owner","text":"Jeffrey Mezzancello","value":"2698763"},"status":{"label":"Status","name":"status","text":"Scheduled","value":"SCHEDULED"},"title":{"label":"Subject","name":"title","text":null,"value":"Doc Request"},"assigned":{"label":"Organizer","name":"assigned","text":"Doc U Ment","value":"3535291"}},{"internalid":{"label":"Internal Id","name":"internalid","text":"66800","value":"66800"},"company":{"label":"Estate","name":"company","text":"188299 Jack Christian Shepherd","value":"3484531"},"startdate":{"label":"Date Opened","name":"startdate","text":null,"value":"2/11/2025"},"message":{"label":"Comment (include Client Name)","name":"message","text":null,"value":"2.20:  payment sent to courts, expecting docs shortly.\nJustus Begley Docs requested"},"lastmodifieddate":{"label":"Last Update","name":"lastmodifieddate","text":null,"value":"3/4/2025 2:25 pm"},"companyCustomer_custentity1":{"label":"companyCustomer_Case #","name":"companyCustomer_custentity1","text":null,"value":"24-P-00111"},"companyCustomer_custentity3":{"label":"companyCustomer_State","name":"companyCustomer_custentity3","text":"Kentucky","value":"18"},"companyCustomer_custentity2":{"label":"companyCustomer_County","name":"companyCustomer_custentity2","text":"Kentucky_Fayette","value":"1027"},"owner":{"label":"Created By","name":"owner","text":"Jeffrey Mezzancello","value":"2698763"},"status":{"label":"Status","name":"status","text":"Scheduled","value":"SCHEDULED"},"title":{"label":"Subject","name":"title","text":null,"value":"Doc Request"},"assigned":{"label":"Organizer","name":"assigned","text":"Doc U Ment","value":"3535291"}},{"internalid":{"label":"Internal Id","name":"internalid","text":"66801","value":"66801"},"company":{"label":"Estate","name":"company","text":"188372 Evelyn M. Heiss","value":"3486924"},"startdate":{"label":"Date Opened","name":"startdate","text":null,"value":"2/11/2025"},"message":{"label":"Comment (include Client Name)","name":"message","text":null,"value":"2.19 AK followingup with clerk\n2/11 - Frederick Vondrasek requested docs"},"lastmodifieddate":{"label":"Last Update","name":"lastmodifieddate","text":null,"value":"3/4/2025 2:25 pm"},"companyCustomer_custentity1":{"label":"companyCustomer_Case #","name":"companyCustomer_custentity1","text":null,"value":"22PE0592"},"companyCustomer_custentity3":{"label":"companyCustomer_State","name":"companyCustomer_custentity3","text":"Ohio","value":"35"},"companyCustomer_custentity2":{"label":"companyCustomer_County","name":"companyCustomer_custentity2","text":"Ohio_Geauga","value":"2072"},"owner":{"label":"Created By","name":"owner","text":"Jeffrey Mezzancello","value":"2698763"},"status":{"label":"Status","name":"status","text":"Scheduled","value":"SCHEDULED"},"title":{"label":"Subject","name":"title","text":null,"value":"Doc Request"},"assigned":{"label":"Organizer","name":"assigned","text":"Doc U Ment","value":"3535291"}}],[{"internalid":{"label":"Internal Id","name":"internalid","text":"1346","value":"1346"},"entityid":{"label":"ID","name":"entityid","text":null,"value":"289"},"altname":{"label":"Name","name":"altname","text":null,"value":"Test Decedent : Travis A Tester"},"custentity_sales_rep":{"label":"Sales Rep","name":"custentity_sales_rep","text":"","value":""},"parentCustomer_internalid":{"label":"parentCustomer_Internal ID","name":"parentCustomer_internalid","text":"1362","value":"1362"}},{"internalid":{"label":"Internal Id","name":"internalid","text":"143905","value":"143905"},"entityid":{"label":"ID","name":"entityid","text":null,"value":"10156:1"},"altname":{"label":"Name","name":"altname","text":null,"value":"final name : final testerson"},"custentity_sales_rep":{"label":"Sales Rep","name":"custentity_sales_rep","text":"Jeffrey Mezzancello","value":"2698763"},"parentCustomer_internalid":{"label":"parentCustomer_Internal ID","name":"parentCustomer_internalid","text":"143904","value":"143904"}},{"internalid":{"label":"Internal Id","name":"internalid","text":"1864441","value":"1864441"},"entityid":{"label":"ID","name":"entityid","text":null,"value":"105710:1"},"altname":{"label":"Name","name":"altname","text":null,"value":"[TEMP] TestMM TEST : TestMM TEST"},"custentity_sales_rep":{"label":"Sales Rep","name":"custentity_sales_rep","text":"","value":""},"parentCustomer_internalid":{"label":"parentCustomer_Internal ID","name":"parentCustomer_internalid","text":"1864440","value":"1864440"}},{"internalid":{"label":"Internal Id","name":"internalid","text":"1864539","value":"1864539"},"entityid":{"label":"ID","name":"entityid","text":null,"value":"105709:1"},"altname":{"label":"Name","name":"altname","text":null,"value":"[TEMP] Jeremy Milim TEST : Timmy T Tester"},"custentity_sales_rep":{"label":"Sales Rep","name":"custentity_sales_rep","text":"","value":""},"parentCustomer_internalid":{"label":"parentCustomer_Internal ID","name":"parentCustomer_internalid","text":"1864538","value":"1864538"}},{"internalid":{"label":"Internal Id","name":"internalid","text":"3326279","value":"3326279"},"entityid":{"label":"ID","name":"entityid","text":null,"value":"184041:1"},"altname":{"label":"Name","name":"altname","text":null,"value":"Richard Silveira : Tracie Burch"},"custentity_sales_rep":{"label":"Sales Rep","name":"custentity_sales_rep","text":"Brendan Schaefer","value":"1711731"},"parentCustomer_internalid":{"label":"parentCustomer_Internal ID","name":"parentCustomer_internalid","text":"3326278","value":"3326278"}},{"internalid":{"label":"Internal Id","name":"internalid","text":"3484532","value":"3484532"},"entityid":{"label":"ID","name":"entityid","text":null,"value":"188299:1"},"altname":{"label":"Name","name":"altname","text":null,"value":"Jack Christian Shepherd : Justus begley"},"custentity_sales_rep":{"label":"Sales Rep","name":"custentity_sales_rep","text":"Brendan Schaefer","value":"1711731"},"parentCustomer_internalid":{"label":"parentCustomer_Internal ID","name":"parentCustomer_internalid","text":"3484531","value":"3484531"}},{"internalid":{"label":"Internal Id","name":"internalid","text":"3486925","value":"3486925"},"entityid":{"label":"ID","name":"entityid","text":null,"value":"188372:1"},"altname":{"label":"Name","name":"altname","text":null,"value":"Evelyn M. Heiss : Fredrick Vondrasek"},"custentity_sales_rep":{"label":"Sales Rep","name":"custentity_sales_rep","text":"Jon Campos","value":"961490"},"parentCustomer_internalid":{"label":"parentCustomer_Internal ID","name":"parentCustomer_internalid","text":"3486924","value":"3486924"}},{"internalid":{"label":"Internal Id","name":"internalid","text":"3530238","value":"3530238"},"entityid":{"label":"ID","name":"entityid","text":null,"value":"189481:1"},"altname":{"label":"Name","name":"altname","text":null,"value":"Angela Conley : Thomas Conley"},"custentity_sales_rep":{"label":"Sales Rep","name":"custentity_sales_rep","text":"Jay Delahanty","value":"1196199"},"parentCustomer_internalid":{"label":"parentCustomer_Internal ID","name":"parentCustomer_internalid","text":"3530237","value":"3530237"}},{"internalid":{"label":"Internal Id","name":"internalid","text":"3546064","value":"3546064"},"entityid":{"label":"ID","name":"entityid","text":null,"value":"184041:2"},"altname":{"label":"Name","name":"altname","text":null,"value":"Richard Silveira : Daniel Hall"},"custentity_sales_rep":{"label":"Sales Rep","name":"custentity_sales_rep","text":"Brendan Schaefer","value":"1711731"},"parentCustomer_internalid":{"label":"parentCustomer_Internal ID","name":"parentCustomer_internalid","text":"3326278","value":"3326278"}},{"internalid":{"label":"Internal Id","name":"internalid","text":"3548619","value":"3548619"},"entityid":{"label":"ID","name":"entityid","text":null,"value":"184041:3"},"altname":{"label":"Name","name":"altname","text":null,"value":"Richard Silveira : Kimberly Hall"},"custentity_sales_rep":{"label":"Sales Rep","name":"custentity_sales_rep","text":"Brendan Schaefer","value":"1711731"},"parentCustomer_internalid":{"label":"parentCustomer_Internal ID","name":"parentCustomer_internalid","text":"3326278","value":"3326278"}}]]};
}