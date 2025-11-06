/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/search', 'N/query', 'N/runtime', 'N/ui/serverWidget', 'SuiteScripts/Libraries/RM-functions.js'], function(record, search, query, runtime, sw, rmfunc) {
  function getData() {
    var q=`
      select
        a.attendee as estintid,
        e.entitytitle as estname,
        BUILTIN.DF(est.custentity_est_status) as eststatus,
        max(c.startdate) as eventdate
      from calendarevent c
      join attendee a on a.calendarevent = c.id
      join entity e on e.id = a.attendee
      join customer est on est.id=e.id
      where
        a.attendee not in (select id FROM employee)
        and a.attendee in (select c.parent as custid from transaction t join customer c on c.id=t.entity where t.type='CustInvc' and builtin.DF(status)='Invoice : Open'  group by c.parent)
      group by
        a.attendee,
        BUILTIN.DF(est.custentity_est_status),
        e.entitytitle
      having
        max(c.startdate) <= sysdate -1
      order by a.attendee`;
    var rs=rmfunc.getQueryResults(q);
    var baseurl='/app/site/hosting/scriptlet.nl?script=180&deploy=1';
    var retval={};
    var estates=[];
    rs.forEach(function(result){
      var estintid=result.estintid;
      estates.push(estintid);
      var estname=result.estname;
      var eststatus=result.eststatus;
      var eventdate=result.eventdate;
      retval[estintid]={estintid:estintid, estname:estname, eststatus:eststatus, eventdate:eventdate, url:baseurl+'&estate='+estintid};
    });
    var estintids="'"+estates.join("', '")+"'";
    q=`
      select c.parent as estintid, c.id as custintid, c.entitytitle as custname
      from customer c
      join transaction t on t.entity=c.id
      where c.parent in (${estintids})
      and BUILTIN.DF(t.status)='Invoice : Open'
      group by c.parent, c.id, c.entitytitle`;
    rs=rmfunc.getQueryResults(q);
    rs.forEach(function(result) {
      var estintid=result.estintid;
      var custintid=result.custintid;
      var custname=result.custname;
    if(!!!retval[estintid].customers)
      retval[estintid].customers={};
    retval[estintid].customers[custintid]={custintid:custintid, estintid:estintid, custname:custname, url:baseurl+'&customer='+custintid};    });
    return retval;
  }
  
  function drawForm(data) {
    var fld=null;
    var form=sw.createForm({title:'Open Cases With No Future Events'});
    var custdata=form.addSublist({type:'list', id:'custpage_customerdata', label:'Estate Data'});
    fld=custdata.addField({id:'custpage_estate', label:'Estate', type:'text'});
    fld=custdata.addField({id:'custpage_estatestatus', label:'Estate Status', type:'text'});
    fld=custdata.addField({id:'custpage_customer', label:'Customer', type:'textarea'});
    var line=0;
    for(var estintid in data) {
      var estate=data[estintid];
      var estname=estate.estname;
      var eststatus=estate.eststatus;
      custdata.setSublistValue({line:line, id:'custpage_estatestatus', value:eststatus});
      var eventdate=estate.eventdate;
      var url=`<a target="_blank" href="${estate.url}">${estname}</a>`;
      custdata.setSublistValue({line:line, id:'custpage_estate', value:url});
      var custdatatable='<table border=0>';
      for(var custintid in estate.customers) {
        var customer=estate.customers[custintid];
        var custname=customer.custname;
        var url=`<a target="_blank" href="${customer.url}">${custname}</a>`;
        custdatatable+=`<tr><td>${url}</td></tr>`;
      }
      custdatatable+='</table>'
      custdata.setSublistValue({line:line, id:'custpage_customer', value:custdatatable});
      line++;
    }
    return form;
  }

  function doGet(context){
    var form=drawForm(getData());
//    context.response.writeLine(JSON.stringify(form));
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
