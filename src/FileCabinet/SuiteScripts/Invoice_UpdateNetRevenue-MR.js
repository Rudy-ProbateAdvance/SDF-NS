/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/query', 'N/record', 'N/search', 'SuiteScripts/Libraries/RM-functions.js'],
    /**
     * @param{query} query
     * @param{record} record
     * @param{search} search
     * @param rmfunc
     */
    (query, record, search, rmfunc) => {

      function getInputData(context) {
        log.debug({title: 'BEGIN'});
        try {
          log.debug({title:'Get base invoices'});
          var q = `
              select --top 100
                   t.id
                   , t.tranid
                   , t.trandate as date
                   , t.foreigntotal as invoiceTotal
                   , t.foreignamountunpaid as invoiceDue
                   , sum(abs(tl.foreignamount)) as cashAdvanced
                   , round(t.custbody_net_revenue, 2) as netrevenue0
                   , NVL(t.custbody_net_revenue2,0) as netrevenue1
                   , t.status
              from
                  transaction t
                  left outer join
                  transactionline tl
              on tl.transaction=t.id
              where
                  t.type='CustInvc'
--                and status='B'
                and item=7
              group by
                  t.id, t.tranid, t.trandate, t.foreigntotal, t.foreignamountunpaid, t.custbody_net_revenue, t.custbody_net_revenue2, t.status
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
              data[result.id].completedassignmentstotal = 0;
              data[result.id].courtfeestotal = 0;
              data[result.id].checkstotal = 0;
              invoices.push(result.id)
            });
          }

          log.debug({title:'build invoicelist'});
          var invoicelist = `'${invoices.join("', '")}'`;


          log.debug({title:'Get all netrevenue calculations'});
          var q = `
              select id as invintid, custbody_netrevenuecalc2 as netrevenuecalc2
              from transaction
              where type = 'CustInvc'
          `
          var rs = query.runSuiteQLPaged({query: q, pageSize: 1000});
          for (var i in rs.pageRanges) {
            var page = rs.fetch(i);
            page.data.asMappedResults().forEach(result => {
              if(invoices.includes(result.id)) {
                data[result.invintid].netrevenuecalc2 = result.netrevenuecalc2;
              }
            });
          }

          log.debug({title:'Get discounts'});
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

          log.debug({title:'Get rebates'});
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

          log.debug({title:'Get recovered legal fees'});
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

          log.debug({title:'Get bad debts'});
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
              order by invintid
          `
          var rs = query.runSuiteQLPaged({query: q, pageSize: 1000});
          for (var i in rs.pageRanges) {
            var page = rs.fetch(i);
            page.data.asMappedResults().forEach(result => {
              data[result.invintid].baddebttotal = result.baddebtamount;
            });
          }

          log.debug({title:'Get additional deposits'});
          var q = `
              select t.custbody_invoice    as invintid
                   , sum(tl.foreignamount) as additionaldepositsamount
              from transaction t
                       join
                   transactionline tl on (tl.transaction = t.id and tl.mainline = 'F')
              where t.type = 'Deposit'
                and t.custbody_invoice in (${invoicelist})
                and tl.expenseaccount in (260, 509, 510) --238, 212, 230, 231, 240, 273, 439
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

          var q = `
            select nvl(tl.custcol_invoice_link, t.custbody_invoice) as invintid
                 , sum(tl.foreignamount) as checksamount
            from transaction t
            join transactionline tl on (tl.transaction = t.id and tl.mainline = 'F')
            where t.type = 'Check'
                and (t.custbody_invoice in (${invoicelist}) or tl.custcol_invoice_link in (${invoicelist}))
                and tl.expenseaccount in (238, 509)
            group by tl.custcol_invoice_link
                , t.custbody_invoice
            order by tl.custcol_invoice_link
          `;
          var rs = query.runSuiteQLPaged({query: q, pageSize: 1000});
          for (var i in rs.pageRanges) {
            var page = rs.fetch(i);
            page.data.asMappedResults().forEach(result => {
              if(invoices.includes(result.invintid)) {
                data[result.invintid].checkstotal = result.checksamount;
              }
            });
          }


          log.debug({title:'Get court fees'});
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

          log.debug({title:'Get completed assignments'});
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

          log.debug({title:'Get writeoff recovery'});
          var q = `
              select t.custbody_invoice  as invintid
                   , sum(t.foreigntotal) as recoveryonwriteoffamount
                   , tl.expenseaccount   as account
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

          log.debug({title:'Do calculations'});
          var retval = {};
          for (var i in data) {
            var result = data[i];
            data[i].netrevenue2=rmfunc.netrevenuecalc(result,0);
            data[i].calcstring=rmfunc.netrevenuecalc(result,1);
          }
        } catch(e) {
          log.error(e.message, JSON.stringify(e));
          data={};
        }
        return data;
      }


      function map(context) {
        try {
          var val = JSON.parse(context['value']);
          var status=val.status;
          var invoicedue=val.invoicedue;
          if(val.status!='B' || invoicedue!=0) {
            try {
              record.submitFields({
                type: 'invoice',
                id: context.key,
                values: {custbody_net_revenue2: '', custbody_netrevenuecalc2: ''}
              });
              log.audit(`** inv ${val.tranid}/${val.id}: wrote null netrevenue`);
            } catch (e) {
              log.error(`error writing to invoice ${val.tranid}/${val.id}.`);
            }
            return;
          }
//          if (Math.abs(val.netrevenue2 - val.netrevenue1) > 0.1 || val.netrevenuecalc2==null || val.netrevenuecalc2=='') {
            try {
              record.submitFields({
                type: 'invoice',
                id: context.key,
                values: {custbody_net_revenue2: val.netrevenue2, custbody_netrevenuecalc2: val.calcstring}
              });
              log.audit(`** inv ${val.tranid}/${val.id}: wrote netrevenue ${val.netrevenue2} and calc ${val.calcstring}`);
            } catch (e) {
              log.error(`inv ${val.tranid}/${val.id}: error updating`, e.message);
            }
//          } else {
//            log.debug(`Nothing to do for invoice ${val.tranid}/${val.id} (${val.netrevenue2}:${val.netrevenue1}).`);
//          }
        } catch(e) {
          log.error({title:'encountered an error: '+e.message, details:context.value});
        }
        return;
      }

      function summarize(context) {
        log.debug('END');
      }

      return {getInputData, map, summarize}

    });
