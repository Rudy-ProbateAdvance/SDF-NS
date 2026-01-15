/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */



define(['N/record', 'N/search', 'N/query', 'N/ui/serverWidget', 'SuiteScripts/Libraries/RM-functions.js'], function(record, search, query, sw, rmfunc) {
  function drawForm(){
    var invcolumnmap={
      "estintid":{name:"estintid", type:"text", source:null, displayType:'hidden'},
      "custintid":{name:"custintid", type:"text", source:null, displayType:"hidden"},
      "invintid":{name:"invintid", type:"text", source:null, displayType:"hidden"},
      "priority":{name:'priority', type:"text", source:null, displayType:"hidden"},
      "estid":{name:"Estate ID", type:"integer", source:null, displayType:"inline"},
      "estname":{name:"Estate Name", type:"text", source:null, displayType:"inline"},
      "estlink":{name:"Estate Link", type:"text", source:null, displayType:"inline"},
      "custid":{name:"Customer ID", type:"text", source:null, displayType:"inline"},
      "custname":{name:"Customer Name", type:"text", source:null, displayType:"inline"},
      "invid":{name:"Invoice #", type:"text", source:null, displayType:"inline"},
      "leadsource":{name:"Channel", type:"text", source:null, displayType:"inline"},
      "estatecounty":{name:"Estate County", type:"text", source:null, displayType:"inline"},
      "advamt":{name:"Advance Amount", type:"integer", source:null, displayType:"inline"},
      "option1":{name:"Option 1", type:"integer", source:null, displayType:"inline"},
      "option2":{name:"Option 2", type:"integer", source:null, displayType:"inline"},
      "option3":{name:"Option 3", type:"integer", source:null, displayType:"inline"},
      "assignamt":{name:"Assignment Amount", type:"integer", source:null, displayType:"inline"},
      "exppaybackorig":{name:"Expected Payback Original", type:"integer", source:null, displayType:"entry"},
      "exppaybacknow":{name:"Expected Payback Now", type:"integer", source:null, displayType:"entry"},
      "defaultonadv":{name:"Default On Advance", type:"integer", source:null, displayType:"inline"},
      "defaultonexpected":{name:"Default On Expected", type:"integer", source:null, displayType:"inline"},
      "type":{name:"Problem Case Type", type:'select', source:"customlist_problemcasetypes", displayType:"entry"},
      "comment":{name:"Comment", type:"textarea", source:null, displayType:"entry"}
    };
    var estcolumnmap={
      "estintid":{name:'Internal ID', type:'text', displayType:'hidden'},
      "pclpriority":{name:'PCL Priority', type:'text', displayType:'entry'},
      "estid":{name:'Estate ID', type:'text', displayType:'inline'},
      "problemcase":{name:'Problem Case', type:'checkbox', displayType:'entry'},
      "estname":{name:'Name', type:'text', displayType:'inline'},
      "pmassignee":{name:'Portfolio Mgmt Assignee', type:'text', displayType:'inline'},
      "receivables":{name:'Receivables', type:'text', displayType:'inline'},
      "totaldefault":{name:'Total Expected Default', type:'text', displayType:'inline'},
      "flagnotemsg":{name:'Flagged Note Message', type:'textarea', displayType:'entry'},
      "flagnotedate":{name:'Flagged Note Date', type:'date', displayType:'inline'},
      "lastnotemsg":{name:'Latest Note Message', type:'textarea', displayType:'entry'},
      "lastnotedate":{name:'Latest Note Date', type:'date', displayType:'inline'},
    };

    var form=sw.createForm('Problem Case List');
    form.clientScriptModulePath='SuiteScripts/problem_case_list-cs.js';
    form.addTab({id:'estatetab', label:'Estate Data'});
    form.addTab({id:'invoicetab', label:'Invoice Data'});

    var pclranks={};
    var pclrankdata=search.lookupFields({type:'customrecord_pcl_priority', id:1, columns:'custrecord_pcl_priority'}).custrecord_pcl_priority;
    if(Object.keys(pclrankdata).length>0)
      pclranks=JSON.parse(pclrankdata);

    // estates query
    var q= `
        select e.id as estintid
        , null as priority
        , e.entityid as estid
        , e.altname as estname
        , BUILTIN.DF(e.custentity_pm_assignee) as pmassignee
        , '<a target="_blank" href="/app/common/entity/custjob.nl?id='||e.id||'"><p id="'||e.id||'">view</p></a>' as estlink
        , sum(tl.rate) as invoices
        , null as defaultonexpected
        , null as defaultonadvance
        , f.id as flagnoteintid
        , f.startdate as flagnotedate
        , f.message as flagnotemsg
        , sq.id as lastnoteintid
        , sq.startdate as lastnotedate
        , sq.message as lastnotemsg
        from transaction t 
        join transactionline tl on tl.transaction=t.id
        join customer c on c.id=t.entity
        join customer e on e.id=c.parent
        left outer join phonecall f on f.id=e.custentity_pcl_flag_note
        left outer join (
          select *
          from (
            select t.id
            , t.company
            , t.startdate
            , t.message
            , row_number() over(partition by company order by startdate desc) rn from phonecall t
            ) t
          where rn = 1
        ) sq on sq.company=e.id
        where e.custentity_problem_case='T'
          and BUILTIN.DF(t.status)='Invoice : Open' 
          and t.type='CustInvc'
        group by e.id
        , e.entityid
        , e.altname
        , BUILTIN.DF(e.custentity_pm_assignee)
        , e.custentity_pcl_priority
        , f.id
        , f.startdate
        , f.message
        , sq.id
        , sq.startdate
        , sq.message
        order by e.id
        `;
    var estrs=rmfunc.getQueryResults(q,'o');

    // invoices query
    var q=
        `
        select e.id as estintid 
        , c.id as custintid 
        , t.id as invintid 
        , null as priority
        , e.entityid as estid 
        , e.altname as estname 
        , '<a target="_blank" href="/app/common/entity/custjob.nl?id='||e.id||'"><p id="'||t.tranid||'">view</p></a>' as estlink
        , c.entityid as custid 
        , c.altname as custname 
        , '<a target="_blank" href="/app/common/entity/custjob.nl?id='||c.id||'">'||c.entityid||'</a>' as custlink
        , t.tranid as invid 
        , '<a target="_blank" href="/app/accounting/transactions/transaction.nl?id='||t.id||'">'||t.tranid||'</a>' as invlink
        , BUILTIN.DF(c.leadsource) as leadsource 
        , BUILTIN.DF(e.custentity2) as estatecounty 
        , tl.rate as advamt 
        , t.custbody_option_1_pricing as option1 
        , t.custbody_option_2_pricing as option2 
        , t.custbody_option_3_pricing as option3 
        , sq.assignamt as assignamt 
        , nvl(t.custbody_pcl_expectedpayback_orig,sq.assignamt) as exppaybackorig 
        , nvl(t.custbody_pcl_expectedpayback_now,0) as exppaybacknow 
        , nvl(t.custbody_pcl_expectedpayback_now,0)-tl.rate as defaultonadv 
        , nvl(t.custbody_pcl_expectedpayback_now,0)-nvl(t.custbody_pcl_expectedpayback_orig,sq.assignamt) as defaultonexpected 
        , e.custentity_pcl_type as type 
        , nvl(c.custentity_pcl_comment,' ') as comment
        from transaction t 
        join customer c on c.id=t.entity
        join customer e on e.id=c.parent
        join transactionline tl on tl.transaction=t.id
        join (
          select transaction as id, sum(rate) as assignamt
          from transactionline
          group by transaction
        ) sq on sq.id = t.id
        where e.custentity_problem_case='T' 
          and t.type='CustInvc'
          and BUILTIN.DF(status)='Invoice : Open'
          and tl.item=7
        order by e.id, c.id, t.id
        `;
    var invrs=rmfunc.getQueryResults(q);

    for(var i in pclranks) {
      if(!!!estrs[pclranks[i].estintid])
        delete pclranks[i];
    }
    var newranks=[];
    for(var i in pclranks) {
      newranks.push(pclranks[i]);
      delete pclranks[i];
    }
    newranks.sort(function(a,b){return a.rank-b.rank})
    for(var i=0; i<newranks.length; i++) {
      newranks[i].rank=i+1;
      pclranks[newranks[i].estintid]=newranks[i];
    }

    record.submitFields({type:'customrecord_pcl_priority', id:1, values:{'custrecord_pcl_priority':JSON.stringify(pclranks)}});

    // Invoices tab
    form.addButton({id : 'exportestates',
      label   : "Export Estate Data",
      functionName: "stringifysublist('estates');"});

    form.addButton({id : 'exportinvoices',
      label   : "Export Invoice Data",
      functionName: "stringifysublist('invoices');"});

    form.addButton({id : 'reloadpage',
      label   : "Reload Page",
      functionName: "reloadpage;"});

    var invsl=form.addSublist({label:'Invoice Data', id:'invoices', type:'list', tab:'invoicetab'});
    for(var i=0;i<invrs.length;i++) {
      var id=invrs[i].estintid;
      if(!!pclranks[id])
        invrs[i].priority=pclranks[id].rank;
      else
        invrs[i].priority=9999999999;
    }
    invrs.sort(function(a,b){
      if(a.priority==b.priority) {
        if(a.assignamt==b.assignamt) {
          return a.invintid - b.invintid;
        }
        return a.assignamt - b.assignamt;
      }
      return a.priority - b.priority;
    });

    // get all column id's
    cols=Object.keys(invrs[0]);


    var fld=invsl.addField({id:'estintid', type:'integer', label:'Estate Internal ID'});
    fld.updateDisplayType({displayType:'hidden'});
    fld=invsl.addField({id:'custintid', type:'integer', label:'Customer Internal ID'});
    fld.updateDisplayType({displayType:'hidden'});
    fld=invsl.addField({id:'invintid', type:'integer', label:'Invoice Internal ID'});
    fld.updateDisplayType({displayType:'hidden'});
    fld=invsl.addField({id:'priority', type:'integer', label:'Priority'});
    fld.updateDisplayType({displayType:'hidden'});
    fld=invsl.addField({id:'viewestate', type:'text', label:'View Estate'});
    fld.updateDisplayType({displayType:'inline'});
    fld=invsl.addField({id:'estid', type:'text', label:'Estate ID'});
    fld.updateDisplayType({displayType:'inline'});
    fld=invsl.addField({id:'estname', type:'text', label:'Estate Name'});
    fld.updateDisplayType({displayType:'inline'});
    fld=invsl.addField({id:'custid', type:'text', label:'Customer ID'});
    fld.updateDisplayType({displayType:'inline'});
    fld=invsl.addField({id:'custname', type:'text', label:'Customer Name'});
    fld.updateDisplayType({displayType:'inline'});
    fld=invsl.addField({id:'invid', type:'text', label:'Invoice #'});
    fld.updateDisplayType({displayType:'inline'});
    fld=invsl.addField({id:'leadsource', type:'text', label:'Channel'});
    fld.updateDisplayType({displayType:'inline'});
    fld=invsl.addField({id:'estatecounty', type:'text', label:'Estate County'});
    fld.updateDisplayType({displayType:'inline'});
    fld=invsl.addField({id:'advamt', type:'integer', label:'Advance Amount'});
    fld.updateDisplayType({displayType:'inline'});
    fld=invsl.addField({id:'option1', type:'integer', label:'Option 1'});
    fld.updateDisplayType({displayType:'inline'});
    fld=invsl.addField({id:'option2', type:'integer', label:'Option 2'});
    fld.updateDisplayType({displayType:'inline'});
    fld=invsl.addField({id:'option3', type:'integer', label:'Option 3'});
    fld.updateDisplayType({displayType:'inline'});
    fld=invsl.addField({id:'assignamt', type:'integer', label:'Assignment Amount'});
    fld.updateDisplayType({displayType:'inline'});
    fld=invsl.addField({id:'exppaybackorig', type:'integer', label:'Expected Payback Original'});
    fld.updateDisplayType({displayType:'entry'});
    fld=invsl.addField({id:'exppaybacknow', type:'integer', label:'Expected Payback Now'});
    fld.updateDisplayType({displayType:'entry'});
    fld=invsl.addField({id:'defaultonadv', type:'integer', label:'Default On Advance'});
    fld.updateDisplayType({displayType:'inline'});
    fld=invsl.addField({id:'defaultonexpected', type:'integer', label:'Default On Expected'});
    fld.updateDisplayType({displayType:'inline'});
    fld=invsl.addField({id:'type', type:'select', source:'customlist_problemcasetypes', label:'Problem Case Type'});
    fld.updateDisplayType({displayType:'entry'});
    fld=invsl.addField({id:'comment', type:'text', label:'Comment'});
    fld.updateDisplayType({displayType:'entry'});

/*
    // create all sublist fields from info in map
    cols.forEach(function(col){
    log.debug(col);
    var map=invcolumnmap[col];
    log.debug(JSON.stringify(map));
    var name=map.name;
    var fn=col;
    var fld=invsl.addField({id:fn, type:map.type, source:map.source, label:name});
    fld.updateDisplayType({displayType:invcolumnmap[col].displayType});
    if(fn=='exppaybackorig' || fn=='exppaybacknow')
      fld.updateDisplaySize({height:1, width:7});
    });
*/

    // populate sublist from query results
    for(var i=0;i<invrs.length;i++){
      var result=invrs[i];
      invsl.setSublistValue({id:'estintid', value:result.estintid, line:i});
      invsl.setSublistValue({id:'custintid', value:result.custintid, line:i});
      invsl.setSublistValue({id:'invintid', value:result.invintid, line:i});
      invsl.setSublistValue({id:'priority', value:result.priority, line:i});
      var estid=result.estid.padStart(7,'0');
//      var estlink=result.estlink.replace(/view estate/, estid);
      invsl.setSublistValue({id:'viewestate', value:result.estlink, line:i});
      invsl.setSublistValue({id:'estid', value:estid, line:i});
      invsl.setSublistValue({id:'estname', value:result.estname, line:i});
      invsl.setSublistValue({id:'custid', value:result.custlink, line:i});
      invsl.setSublistValue({id:'custname', value:result.custname, line:i});
      invsl.setSublistValue({id:'invid', value:result.invlink, line:i});
      invsl.setSublistValue({id:'leadsource', value:result.leadsource, line:i});
      invsl.setSublistValue({id:'estatecounty', value:result.estatecounty, line:i});
      invsl.setSublistValue({id:'advamt', value:result.advamt, line:i});
      invsl.setSublistValue({id:'option1', value:result.option1, line:i});
      invsl.setSublistValue({id:'option2', value:result.option2, line:i});
      invsl.setSublistValue({id:'option3', value:result.option3, line:i});
      invsl.setSublistValue({id:'assignamt', value:result.assignamt, line:i});
      invsl.setSublistValue({id:'exppaybackorig', value:result.exppaybackorig, line:i});
      invsl.setSublistValue({id:'exppaybacknow', value:result.exppaybacknow, line:i});
      invsl.setSublistValue({id:'defaultonadv', value:result.defaultonadv, line:i});
      invsl.setSublistValue({id:'defaultonexpected', value:result.defaultonexpected, line:i});
      invsl.setSublistValue({id:'type', value:result.type, line:i});
      invsl.setSublistValue({id:'comment', value:result.comment, line:i});

/*
//      var estlink=`<a target="_blank" href="/app/common/entity/custjob.nl?id=${result.estintid}"><h5 id="estate${result.estintid}">${result.estid}</h5></a>`;
      var custlink=`<a target="_blank" href="/app/common/entity/custjob.nl?id=${result.custintid}">${result.custid}</a>`;
      var invlink=`<a target="_blank" href="/app/accounting/transactions/transaction.nl?id=${result.invintid}">${result.invid}</a>`;
      Object.keys(result).forEach(function(field){
        if(field===null)
          return true;
        var fn=field;
        invsl.setSublistValue({id:fn, line:i, value:result[field]});
      });
      invsl.setSublistValue({id:'custid', line:i, value:custlink});
      invsl.setSublistValue({id:'invid', line:i, value:invlink});
//      invsl.setSublistValue({id:'estid', line:i, value:estlink});

*/
    }




    // Estates tab
    var estsl=form.addSublist({label:'Estate Data', id:'estates', type:'list', tab:'estatetab'});
    var fld=estsl.addField({id:'estintid', label:'Internal ID', type:'text'});
    fld.updateDisplayType({displayType:'hidden'});
    var fld=estsl.addField({id:'pclpriority', label:'PCL Priority', type:'integer'});
    fld.updateDisplayType({displayType:'entry'});
    fld.updateDisplaySize({height:1, width:2});
    var fld=estsl.addField({id:'viewestate', label:'View Estate', type:'text'});
    fld.updateDisplayType({displayType:'inline'});
    var fld=estsl.addField({id:'estid', label:'Estate ID', type:'text'});
    fld.updateDisplayType({displayType:'inline'});
    var fld=estsl.addField({id:'problemcase', label:'Problem Case', type:'checkbox'});
    fld.updateDisplayType({displayType:'entry'});
    fld.defaultValue='T';
    var fld=estsl.addField({id:'estname', label:'Name', type:'text'});
    fld.updateDisplayType({displayType:'inline'});
    var fld=estsl.addField({id:'estpmassignee', label:'Portfolio Mgmt Assignee', type:'text'});
    fld.updateDisplayType({displayType:'inline'});
    var fld=estsl.addField({id:'receivables', label:'Receivables', type:'integer'});
    fld.updateDisplayType({displayType:'inline'});
    var fld=estsl.addField({id:'defaultonexpected', label:'Default On Expected', type:'integer'});
    fld.updateDisplayType({displayType:'inline'});
    var fld=estsl.addField({id:'defaultonadvance', label:'Default On Advance', type:'integer'});
    fld.updateDisplayType({displayType:'inline'});
    var fld=estsl.addField({id:'flagnoteintid', label:'Flagged Note InternalID', type:'text'});
    fld.updateDisplayType({displayType:'hidden'});
    var fld=estsl.addField({id:'flagnotemsg', label:'Flagged Note Message', type:'textarea'});
    fld.updateDisplayType({displayType:'entry'});
    var fld=estsl.addField({id:'flagnotedate', label:'Flagged Note Date', type:'date'});
    fld.updateDisplayType({displayType:'inline'});
    var fld=estsl.addField({id:'lastnoteintid', label:'Last Note InternalID', type:'text'});
    fld.updateDisplayType({displayType:'hidden'});
    var fld=estsl.addField({id:'lastnotemsg', label:'Latest Note Message', type:'textarea'});
    fld.updateDisplayType({displayType:'entry'});
    var fld=estsl.addField({id:'lastnotedate', label:'Latest Note Date', type:'date'});
    fld.updateDisplayType({displayType:'inline'});


    for(i in pclranks){
      estintid=pclranks[i].estintid;
      estrs[estintid].priority=pclranks[i].rank;
    }
    var ranked=[];
    var unranked=[];
    for(i in estrs) {
      var rank=estrs[i].priority;
      if(rank)
        ranked.push(estrs[i]);
      else
        unranked.push(estrs[i]);
    }
    newranked=ranked.sort(function(a,b){return a.priority-b.priority});
    newunranked=unranked.sort(function(a,b){return b.invoices-a.invoices});
    estrs=newranked.concat(unranked);



    for(var i=0;i<estrs.length;i++){
      var estate=estrs[i];
      var arr=invrs.filter(function(element){return element.estintid==estate.estintid});
//      console.log(estate.estintid, arr.length);
//      estrs[i].receivables=arr.length;

      var total=0;
      for(var j=0;j<arr.length;j++){
        var deflt=arr[j].defaultonadv||0;
        total+=parseInt(deflt);
      }
      estrs[i].defaultonadv=total;
      
      total=0;
      for(var j=0;j<arr.length;j++){
        var deflt=arr[j].defaultonexpected||0;
        total+=parseInt(deflt);
      }
      estrs[i].defaultonexpected=total;


      estsl.setSublistValue({id:'estintid', line:i, value:estate.estintid});
      estsl.setSublistValue({id:'pclpriority', line:i, value:estate.priority});
      var estid=estate.estid.padStart(7,'0');
//      var estlink=estate.estlink.replace(/view estate/, estid);
      estsl.setSublistValue({id:'viewestate', line:i, value:estate.estlink});
      estsl.setSublistValue({id:'estid', line:i, value:estid});
      estsl.setSublistValue({id:'estname', line:i, value:estate.estname});
      estsl.setSublistValue({id:'estpmassignee', line:i, value:estate.pmassignee});
      estsl.setSublistValue({id:'receivables', line:i, value:estate.invoices});
      estsl.setSublistValue({id:'defaultonexpected', line:i, value:estate.defaultonexpected});
      estsl.setSublistValue({id:'defaultonadvance', line:i, value:estate.defaultonadv});
      estsl.setSublistValue({id:'flagnoteintid', line:i, value:estate.flagnoteintid});
      estsl.setSublistValue({id:'flagnotedate', line:i, value:estate.flagnotedate});
      estsl.setSublistValue({id:'flagnotemsg', line:i, value:estate.flagnotemsg});
      estsl.setSublistValue({id:'lastnoteintid', line:i, value:estate.lastnoteintid});
      estsl.setSublistValue({id:'lastnotedate', line:i, value:estate.lastnotedate});
      estsl.setSublistValue({id:'lastnotemsg', line:i, value:estate.lastnotemsg});
    }
//    var fld=form.addField({id:'invoicesdata', type:'longtext', label:'Invoices Data'});
//    fld.updateDisplayType({displayType:'hidden'});
//    fld.defaultValue=JSON.stringify(estrs);


    return form;
  }


  function doGet(context){
    var form=drawForm();
    context.response.writePage(form);
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