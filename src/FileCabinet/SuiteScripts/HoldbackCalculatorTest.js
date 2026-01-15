/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/search', 'N/ui/serverWidget', 'SuiteScripts/Libraries/Holdback-functions.js'], function(record, search, serverWidget, hbfunc) {
  function drawForm(params) {
    log.debug('BEGIN');
    var custid=params.custid;
    var custintid=params.custintid;
    log.debug('custintid='+custintid+'; custid='+custid);
    if(custid && !custintid) {
      var custintid=search.create({type:'customer', filters:[["entityid","is",custid]], columns:[search.createColumn({name:'internalid'})]}).run().getRange(0,100)[0].getValue('internalid');
    }
    if(custintid) {
      var custlookup=search.lookupFields({type:'customer', id:custintid, columns:['entityid','altname']});
      var custname=custlookup.entityid+':'+custlookup.altname;
      custid=custlookup.entityid;
    }
    var form=serverWidget.createForm({title:'Customer Holdback Info'});
    form.clientScriptModulePath='SuiteScripts/HoldbackCalculatorTestClient.js';
    var custinfogroup=form.addFieldGroup({id:'custinfogroup', label:'Customer Info'});
    var totalsgroup=form.addFieldGroup({id:'totalsgroup', label:'Totals'});
    form.addSubmitButton({label:'Submit'});
    var custidfield=form.addField({label:'Customer Id', type:'text', id:'custid', container:'custinfogroup'});
    var custintidfield=form.addField({label:'Customer Internal Id', type:'text', id:'custintid', container:'custinfogroup'});
//    if(custintid) {
//      custintidfield.defaultValue=custintid;
//    }
//    if(custid) {
//      custidfield.defaultValue=custid;
//    }
    var custnamefield = form.addField({label:'Customer Name', type:'inlinehtml', id:'custname', container:'custinfogroup'});
    var transactions=form.addSublist({type:'list', id:'transactions', label:'transactions'});
    transactions.addField({id:'tranintid', label:'Internal Id', type:'text'});
    transactions.addField({id:'tranid', label:'Transaction Number', type:'text'});
    transactions.addField({id:'trantype', label:'Transaction Type', type:'text'});
    transactions.addField({id:'invnum', label:'Invoice Number', type:'text'});
    transactions.addField({id:'tranamt', label:'Amount', type:'currency'});
//    var invsubt= form.addField({type:'inlinehtml', id:'invsubt', label:'Total Invoices', container:'totalsgroup'});
//    var checksubt = form.addField({type:'inlinehtml', id:'checksubt', label:'Total Checks', container:'totalsgroup'});
    var totalt = form.addField({type:'inlinehtml', id:'totalt', label:'Net Total', container:'totalsgroup'});

    if(custid || custintid) {
      custnamefield.defaultValue='<h3>Customer Name: '+custname+'<br />Customer Internal ID: '+custintid+'</h3>';
      var trandata=hbfunc.doSearch({custintid:custintid});
      log.debug({title:'trandata length:'+trandata.length});
      var total=0;
      if(trandata.length>0) {
        var linecounter=0;
        trandata.forEach(function(line) {
//          log.debug({title:'line '+linecounter, details:JSON.stringify(line)});
          var tranintid=line.tranintid;
          var tranid=line.tranid;
          var transactionlink=`<a target="_blank" href="/app/accounting/transactions/transaction.nl?id=${tranintid}">${tranid}<a>`;
          transactions.setSublistValue({id:'tranintid', value:tranintid, line:linecounter});
          transactions.setSublistValue({id:'tranid', value:transactionlink, line:linecounter});
          transactions.setSublistValue({id:'trantype', value:line.type, line:linecounter});
          transactions.setSublistValue({id:'invnum', value:line.invoice||null, line:linecounter});
          transactions.setSublistValue({id:'tranamt', value:line.amount, line:linecounter++});
          total += parseFloat(line.amount);
          return true;
        });
      }
      totalt.defaultValue='Total: '+total;
    }
    return form;
  }
  
  function doGet(context){
    var form=drawForm(context.request.parameters);
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
      doGet(context);
    }
  }

  return {
    onRequest: onRequest
  };
});