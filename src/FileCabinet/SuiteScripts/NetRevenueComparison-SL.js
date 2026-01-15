/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/search', 'N/query', 'N/runtime', 'N/ui/serverWidget', 'SuiteScripts/Libraries/RM-functions.js'], function (record, search, query, runtime, sw, rmfunc) {


  function buildinvlink(id, tranid) {
    var baseurl = `https://5295340.app.netsuite.com/app/accounting/transactions/transaction.nl?id=${id}`;
    return `<a target="_blank" href="${baseurl}">${tranid}</a>`;
  }

  function getData(ids) {
    var idfilter;
    if (ids) {
      idfilter = `and t.id in (${ids})`
    } else {
      ids='';
      idfilter = '';
    }
    var q = `
        select --top 5000
            t.id
             , t.tranid
             , t.trandate as date
             , t.foreigntotal as invoiceTotal
             , t.foreignamountunpaid as invoiceDue
             , sum(abs(tl.foreignamount)) as cashAdvanced
             , round(t.custbody_net_revenue, 2) as netrevenue0
             , round(t.custbody_net_revenue2, 2) as netrevenue1
        from
            transaction t
            left outer join
            transactionline tl
        on tl.transaction=t.id
        where
            t.type='CustInvc'
          and item=7 ${idfilter}
          and status='B'
        group by
            t.id, t.tranid, t.trandate, t.foreigntotal, t.foreignamountunpaid, t.custbody_net_revenue, t.custbody_net_revenue2
        order by
            t.id asc
    `;
    var data = {};
    var invoices = [];
    var rs = query.runSuiteQLPaged({query: q, pageSize: 1000});
    for (var i in rs.pageRanges) {
      var page = rs.fetch(i);
      page.data.asMappedResults().forEach(result => {
        data[result.id] = result;
        data[result.id].rebatetotal = 0;
        data[result.id].discounttotal = 0;
//        data[result.id].paymenttotal=0;
        data[result.id].baddebttotal = 0;
        data[result.id].recoveredattyfeestotal = 0;
        data[result.id].additionaldepositstotal = 0;
        data[result.id].recoveryonwriteofftotal = 0;
        data[result.id].checkstotal = 0;
        data[result.id].completedassignmentstotal = 0;
        data[result.id].courtfeestotal = 0;
        invoices.push(result.id)
      });
    }

    var invoicelist = `'${invoices.join("', '")}'`;

    var q = `
        select id as invintid, custbody_netrevenuecalc2 as netrevenuecalc2
        from transaction
        where type = 'CustInvc'
    `
    var rs = query.runSuiteQLPaged({query: q, pageSize: 1000});
    for (var i in rs.pageRanges) {
      var page = rs.fetch(i);
      page.data.asMappedResults().forEach(result => {
        if (invoices.includes(result.id)) {
          data[result.invintid].netrevenuecalc2 = result.netrevenuecalc2;
        }
      });
    }


    var q = `
        select nt.previousdoc        as invintid
             , sum(nt.foreignamount) as amtapplied
        from transaction t
                 join
             nexttransactionlinelink nt on nt.nextdoc = t.id
                 inner join
             transactionline tl on tl.transaction = nt.previousdoc
        where nt.previousdoc in (${invoicelist})
          and nt.linktype = 'Payment'
          and t.type = 'CustPymt'
          and nt.nextline = tl.linesequencenumber
          and nt.discount = 'T'
        group by nt.previousdoc
    `
    var rs = query.runSuiteQLPaged({query: q, pageSize: 1000});
    for (var i in rs.pageRanges) {
      var page = rs.fetch(i);
      page.data.asMappedResults().forEach(result => {
        data[result.invintid].discounttotal = result.amtapplied;
      });
    }

    var q = `
        select tl.custcol_invoice    as invintid
             , sum(tl.foreignamount) as rebatetotal
        from transactionline tl
                 join
             transaction t on t.id = tl.transaction
        where t.type = 'Journal'
          and custcol_invoice in (${invoicelist})
          and expenseaccount = 231
        group by tl.custcol_invoice
        order by tl.custcol_invoice
    `
    var rs = query.runSuiteQLPaged({query: q, pageSize: 1000});
    for (var i in rs.pageRanges) {
      var page = rs.fetch(i);
      page.data.asMappedResults().forEach(result => {
        data[result.invintid].rebatetotal = result.rebatetotal;
      });
    }

    var q = `
        select tl.custcol_invoice    as invintid
             , sum(tl.foreignamount) as recoveredattyfees
        from transactionline tl
                 join
             transaction t on t.id = tl.transaction
        where t.type = 'Journal'
          and custcol_invoice in (${invoicelist})
          and expenseaccount = 460
        group by tl.custcol_invoice
        order by tl.custcol_invoice
    `
    var rs = query.runSuiteQLPaged({query: q, pageSize: 1000});
    for (var i in rs.pageRanges) {
      var page = rs.fetch(i);
      page.data.asMappedResults().forEach(result => {
        data[result.invintid].recoveredattyfeestotal = result.recoveredattyfees;
      });
    }

    var q = `
        select nt.previousdoc        as invintid
             , sum(nt.foreignamount) as baddebtamount
        from nexttransactionlinelink nt
                 join
             transactionline tl on tl.transaction = nt.nextdoc
        where previousdoc in (${invoicelist})
          and nexttype = 'CustPymt'
          and tl.expenseaccount = 260
        group by nt.previousdoc
        order by nt.previousdoc
    `
    var rs = query.runSuiteQLPaged({query: q, pageSize: 1000});
    for (var i in rs.pageRanges) {
      var page = rs.fetch(i);
      page.data.asMappedResults().forEach(result => {
        data[result.invintid].baddebttotal = result.baddebtamount;
      });
    }

    var q = `
        select t.custbody_invoice    as invintid
             , sum(tl.foreignamount) as additionaldepositsamount
        from transaction t
                 join
             transactionline tl on (tl.transaction = t.id and tl.mainline = 'F')
        where t.type = 'Deposit'
          and t.custbody_invoice in (${invoicelist})
          and tl.expenseaccount in (260, 509, 510) --212, 230, 231, 238, 240, 273, 439
        group by t.custbody_invoice
        order by custbody_invoice
    `
    var rs = query.runSuiteQLPaged({query: q, pageSize: 1000});
    for (var i in rs.pageRanges) {
      var page = rs.fetch(i);
      page.data.asMappedResults().forEach(result => {
        data[result.invintid].additionaldepositstotal = result.additionaldepositsamount;
      });
    }

    /*    var q=`
            select
                tl.custcol_invoice_link as invintid
                 , sum(tl.foreignamount) as checksamount
            from
                transaction t
                    join
                transactionline tl on (tl.transaction=t.id and tl.mainline='F')
            where
                t.type='Check'
                and tl.custcol_invoice_link in (${invoicelist})
                and tl.expenseaccount in (238, 509)
            group by
                tl.custcol_invoice_link
            order by
                tl.custcol_invoice_link
        `;*/
    var q = `
        select nvl(tl.custcol_invoice_link, t.custbody_invoice) as invintid
             , sum(tl.foreignamount)                            as checksamount
        from transaction t
                 join
             transactionline tl on (tl.transaction = t.id and tl.mainline = 'F')
        where t.type = 'Check'
          and (t.custbody_invoice in (${invoicelist}) or tl.custcol_invoice_link in (${invoicelist}))
--          and not (t.custbody_invoice is null and tl.custcol_invoice_link is null)
          and tl.expenseaccount in (238, 509)
        group by tl.custcol_invoice_link
               , t.custbody_invoice
        order by tl.custcol_invoice_link    `;
    var rs = query.runSuiteQLPaged({query: q, pageSize: 1000});
    for (var i in rs.pageRanges) {
      var page = rs.fetch(i);
      page.data.asMappedResults().forEach(result => {
        if(invoices.includes(result.invintid)) {
          data[result.invintid].checkstotal = result.checksamount;
        }
      });
    }


    var q = `
        select tl.custcol_invoice    as invintid
             , sum(tl.foreignamount) as courtfeesamount
        from transactionline tl
                 join
             transaction t on t.id = tl.transaction
        where t.type = 'Journal'
          and custcol_invoice in (${invoicelist})
          and expenseaccount = 240
        group by tl.custcol_invoice
        order by tl.custcol_invoice
    `
    var rs = query.runSuiteQLPaged({query: q, pageSize: 1000});
    for (var i in rs.pageRanges) {
      var page = rs.fetch(i);
      page.data.asMappedResults().forEach(result => {
        data[result.invintid].courtfeestotal = result.courtfeesamount;
      });
    }

    var q = `
        select t.custbody_invoice    as invintid
             , sum(tl.foreignamount) as completedassignmentsamount
             , tl.expenseaccount     as account
        from transaction t
                 join
             transactionline tl on (tl.transaction = t.id and tl.mainline = 'F')
        where t.type = 'Deposit'
          and t.custbody_invoice in (${invoicelist})
          and tl.expenseaccount = 238
        group by t.custbody_invoice
               , tl.expenseaccount
        order by custbody_invoice
    `
    var rs = query.runSuiteQLPaged({query: q, pageSize: 1000});
    for (var i in rs.pageRanges) {
      var page = rs.fetch(i);
      page.data.asMappedResults().forEach(result => {
        data[result.invintid].completedassignmentstotal = result.completedassignmentsamount;
      });
    }

    var q = `
        select t.custbody_invoice    as invintid
             , sum(tl.foreignamount) as recoveryonwriteoffamount
             , tl.expenseaccount     as account
        from transaction t
                 join
             transactionline tl on (tl.transaction = t.id and tl.mainline = 'F')
        where t.type = 'Deposit'
          and t.custbody_invoice in (${invoicelist})
          and tl.expenseaccount = 510
        group by t.custbody_invoice
               , tl.expenseaccount
        order by custbody_invoice
    `
    var rs = query.runSuiteQLPaged({query: q, pageSize: 1000});
    for (var i in rs.pageRanges) {
      var page = rs.fetch(i);
      page.data.asMappedResults().forEach(result => {
        data[result.invintid].recoveryonwriteofftotal = result.recoveryonwriteoffamount;
      });
    }


    var retval = {};
    for (var i in data) {
      var result = data[i];
      data[i].netrevenue2=rmfunc.netrevenuecalc(data[i],0);
      data[i].calcstring=rmfunc.netrevenuecalc(data[i],1);
      var netrevenue2 = result.netrevenue2;
      var netrevenue1 = result.netrevenue1;
      var netrevenue0 = result.netrevenue0;
      var variance = Math.abs(netrevenue0 - netrevenue2);
//      data[i].netrevenue2 = Math.round(100 * netrevenue2) / 100;
      if ((result.status = 'B' && variance >= 1 && result.invoicedue == 0) || ids.match(i)) {
        retval[i] = data[i];
      }
    }

    return retval;
  }


  function drawForm(context) {
    var ids = context.request.parameters.ids; //id should be an invoice number, not internal id
    if(ids) {
      var inv=ids.split(',')[0].toUpperCase();
      var q = `select id from transaction where tranid='${inv}'`;
      var rs =query.runSuiteQL({query:q}).results;
      if(rs.length>0) {
        ids=rs[0].asMap().id.toString();
      } else {
        ids=null;
      }
    }


    var data = getData(ids);

    var datastring0 = '';
    if (ids) {
      if (data.hasOwnProperty(ids)) {
        var s = search.lookupFields({type: 'invoice', id: ids, columns: 'custbody_netrevenuecalc'}).custbody_netrevenuecalc + '<br>\n';
        datastring0 += s
      }
    }

    var datastring1 = '';
    if (ids) {
      var invoices = ids.split(',');
      invoices.forEach(invid => {
        if (data.hasOwnProperty(invid)) {
          var invoice = data[invid];
          var s = rmfunc.netrevenuecalc(invoice, 1);
          datastring1 += s
        }
      });
    } else {
      datastring0 = 'netrevenue from db = invoiceTotal - invoiceDue - cashAdvanced + discountTotal + rebateTotal - badDebtTotal + additionalDeposits - journalEntryTotal'
      datastring1 = rmfunc.netrevenuecalc(null,2); //'netrevenue newcalc = invoicetotal - invoicedue - cashadvanced - discounttotal + rebatetotal - baddebttotal - completedassignmentstotal - recoveryonwriteofftotal + recoveredattyfeestotal + courtfeestotal';
    }

    var form = sw.createForm({title: 'Net Revenue Formula Reconciliation'});
    form.clientScriptModulePath = './NetRevenueComparison-CL';
    var fld = form.addField({label:'View Single Invoice', id:'custpage_viewsingle', type:'text'});
    fld.updateBreakType({ breakType: sw.FieldBreakType.STARTROW});
    fld.defaultValue=inv;
    var fld = form.addField({label: 'Original', id: 'custpage_formulas', type: 'inlinehtml'});
    fld.updateLayoutType({ layoutType: sw.FieldLayoutType.OUTSIDEBELOW});
    fld.defaultValue =
        `<p>netrevenue from db: ${datastring0}<p>
<p>netrevenue newcalc: ${datastring1}</p>`;
    var invoices = form.addSublist({label: 'Invoices', id: 'custpage_invoices_sl', type: 'list'});
    form.addButton({id: 'custpage_exportcsv', label: "Export Data", functionName: "exporttocsv;"});
    fld = invoices.addField({label: 'Row #', id: 'custpage_rownum', type: 'integer'});
    fld = invoices.addField({label: 'View Line', id: 'custpage_viewbutton', type: 'text'});
//    fld=invoices.addField({label:' ', id:'custpage_fixbutton', type:'textarea'});
    fld = invoices.addField({label: 'Date', id: 'custpage_date', type: 'date'});
    fld = invoices.addField({label: 'Invoice #', id: 'custpage_tranid', type: 'text'});
    fld = invoices.addField({label: 'Net Revenue (from db)', id: 'custpage_netrevenue0', type: 'currency'});
    fld=invoices.addField({label:'Net Revenue (newcalc stored)', id:'custpage_netrevenue1', type:'currency'});
    fld = invoices.addField({label: 'Net Revenue (newcalc dynamic)', id: 'custpage_netrevenue2', type: 'currency'});
//    fld=invoices.addField({label:'Variance (old-db)', id:'custpage_variance1', type:'currency'});
    fld = invoices.addField({label: 'Variance (new-db)', id: 'custpage_variance2', type: 'currency'});
    fld = invoices.addField({label: 'Invoice Total', id: 'custpage_invoicetotal', type: 'currency'});
    fld = invoices.addField({label: 'Invoice Due', id: 'custpage_invoicedue', type: 'currency'});
    fld = invoices.addField({label: 'Cash Advanced', id: 'custpage_cashadvanced', type: 'currency'});
    fld = invoices.addField({label: 'Discounts', id: 'custpage_discounttotal', type: 'currency'});
    fld = invoices.addField({label: 'Checks', id: 'custpage_checkstotal', type: 'currency'});
    fld = invoices.addField({label: 'Rebates', id: 'custpage_rebatetotal', type: 'currency'});
    fld = invoices.addField({label: 'Bad Debts', id: 'custpage_baddebttotal', type: 'currency'});
    fld = invoices.addField({label: 'Completed Assignments', id: 'custpage_completedassignmentstotal', type: 'currency'});
    fld = invoices.addField({label: 'Recovery On Writeoffs', id: 'custpage_recoveryonwriteofftotal', type: 'currency'});
    fld = invoices.addField({label: 'Recovered Legal Fees', id: 'custpage_recoveredattyfeestotal', type: 'currency'});
    fld = invoices.addField({label: 'Court Fees', id: 'custpage_courtfeestotal', type: 'currency'});
    fld = invoices.addField({label: 'Additional Deposits', id: 'custpage_additionaldepositstotal', type: 'currency'});
//    fld=invoices.addField({label:'Payments', id:'custpage_paymenttotal', type:'currency'});

    var k = Object.keys(data);
    for (var i = 0; i < k.length; i++) {
      var result = data[k[i]];
      var viewbuttoncode = `<input type="button" value="View Line" onclick="window.ischanged=false;document.location.href='https://5295340.app.netsuite.com/app/site/hosting/scriptlet.nl?script=2826&deploy=1&ids=${result.tranid}'">`;
      var t = datastring1.split(/\) /).join(')\n').replace(/<br>/g, '\n');
      var s = result.netrevenue2;
//      var fixbuttoncode = `<input type="button" value="test" onclick="alert('test');">`;
//      var fixbuttoncode = `<input type="button" value="Fix DB" onclick="window.ischanged=false;nlapiSubmitField('invoice', ${result.id}, ['custbody_net_revenue', 'custbody_netrevenuecalc'], [${s}, '${t}' ]);window.location.href='https://5295340.app.netsuite.com/app/site/hosting/scriptlet.nl?script=2826&deploy=1'">`;
      invoices.setSublistValue({id: 'custpage_rownum', line: i, value: parseInt(i + 1).toString()});
      invoices.setSublistValue({id: 'custpage_viewbutton', line: i, value: viewbuttoncode});
//      invoices.setSublistValue({id:'custpage_fixbutton', line:i, value:fixbuttoncode});
      invoices.setSublistValue({id: 'custpage_date', line: i, value: result.date});
      invoices.setSublistValue({id: 'custpage_tranid', line: i, value: buildinvlink(result.id, result.tranid)});
      invoices.setSublistValue({id: 'custpage_netrevenue0', line: i, value: result.netrevenue0});
//      invoices.setSublistValue({id:'custpage_variance1', line:i, value:(result.netrevenue1-result.netrevenue0)});
      invoices.setSublistValue({id:'custpage_netrevenue1', line:i, value:result.netrevenue1});
      invoices.setSublistValue({id: 'custpage_variance2', line: i, value: (result.netrevenue2 - result.netrevenue0)});
      invoices.setSublistValue({id: 'custpage_netrevenue2', line: i, value: result.netrevenue2});
      invoices.setSublistValue({id: 'custpage_invoicetotal', line: i, value: result.invoicetotal});
      invoices.setSublistValue({id: 'custpage_invoicedue', line: i, value: result.invoicedue});
      invoices.setSublistValue({id: 'custpage_cashadvanced', line: i, value: result.cashadvanced});
      invoices.setSublistValue({id: 'custpage_discounttotal', line: i, value: result.discounttotal});
      invoices.setSublistValue({id: 'custpage_checkstotal', line: i, value: result.checkstotal});
      invoices.setSublistValue({id: 'custpage_rebatetotal', line: i, value: result.rebatetotal});
      invoices.setSublistValue({id: 'custpage_baddebttotal', line: i, value: result.baddebttotal});
      invoices.setSublistValue({id: 'custpage_completedassignmentstotal', line: i, value: result.completedassignmentstotal});
      invoices.setSublistValue({id: 'custpage_recoveryonwriteofftotal', line: i, value: result.recoveryonwriteofftotal});
      invoices.setSublistValue({id: 'custpage_recoveredattyfeestotal', line: i, value: result.recoveredattyfeestotal});
      invoices.setSublistValue({id: 'custpage_courtfeestotal', line: i, value: result.courtfeestotal});
      invoices.setSublistValue({id: 'custpage_additionaldepositstotal', line: i, value: result.additionaldepositstotal});
//      invoices.setSublistValue({id:'custpage_paymenttotal', line:i, value:result.paymenttotal});
    }
    ;
    return form;
  }

  function doGet(context) {
    var form = drawForm(context);
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
  }
});