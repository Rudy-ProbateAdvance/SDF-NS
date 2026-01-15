/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/query', 'N/ui/serverWidget', 'SuiteScripts/Libraries/RM-functions.js'],function(query, sw, rmfunc) {

  function getData(params) {
    var q=`
        with invs as (

            select id
            from transaction
            where recordtype='invoice' and trandate >= to_date('01/01/2024', 'MM/DD/YYYY')
            order by id desc

        )
           , Accounts as (
            select *
            from (select inv.id                        as invintid,
                         inv.tranid                    as invid,
                         inv.foreigntotal              as invamount,
                         t.id,
                         t.tranid,
                         tl.linesequencenumber,
                         t.recordtype,
                         tl.expenseaccount             as accountid,
                         BUILTIN.DF(tl.expenseaccount) as accountname,
                         ll.foreignamount              as amount
                  from nexttransactionlinelink ll
                           join transaction inv on ll.previousdoc = inv.id
                      --                     join transactionline il on il.transaction = inv.id
                           join transaction t on t.id = ll.nextdoc
                           join transactionline tl on tl.transaction = t.id
                           join invs i on i.id = ll.previousdoc

                  union all

                  select nvl(tl.custcol_invoice, t.custbody_invoice)            as invintid,
                         inv.tranid                    as invid,
                         inv.foreigntotal              as invamount,
                         t.id,
                         t.tranid,
                         tl.linesequencenumber,
                         t.recordtype,
                         tl.expenseaccount             as accountid,
                         BUILTIN.DF(tl.expenseaccount) as accountname,
                         tl.foreignamount              as amount
                  from transaction t
                           join transactionline tl on tl.transaction = t.id
                           join invs i on i.id = nvl(tl.custcol_invoice, t.custbody_invoice)
                           join transaction inv on inv.id = i.id

                  union all

                  select tl.custcol_invoice_link       as invintid,
                         inv.tranid                    as invid,
                         inv.foreigntotal              as invamount,
                         t.id,
                         t.tranid,
                         tl.linesequencenumber,
                         t.recordtype,
                         tl.expenseaccount             as accountid,
                         BUILTIN.DF(tl.expenseaccount) as accountname,
                         tl.foreignamount              as amount
                  from transaction t
                           join transactionline tl on tl.transaction = t.id
                           join invs i on i.id = tl.custcol_invoice_link
                           join transaction inv on inv.id = i.id

                  union all

                  select t.custbody_invoice            as invintid,
                         inv.tranid                    as invid,
                         inv.foreigntotal              as invamount,
                         t.id,
                         t.tranid,
                         tl.linesequencenumber,
                         t.recordtype,
                         tl.expenseaccount             as accountid,
                         BUILTIN.DF(tl.expenseaccount) as accountname,
                         tl.foreignamount              as amount
                  from transaction t
                           join transactionline tl on tl.transaction = t.id
                           join invs i on i.id = t.custbody_invoice
                           join transaction inv on inv.id = i.id)
            order by id,
                     linesequencenumber
        )


        select
--            invid as "Invoice ID",
            accountid as "Acct ID"
             , accountname as "Account Name"
             , sum( amount) "Sum Amount"
        from Accounts
        group by
--            invid, accountid, accountname
            accountid, accountname

        order by
            3 desc
--            1 desc, 3 asc
    `;
    var results=[];
    var pageddata=query.runSuiteQLPaged({query: q, pageSize: 1000});
    for(i in pageddata.pageRanges) {
      var page=pageddata.fetch(i);
      results=results.concat(page.data.asMappedResults());
    }
    return results;
  }

  function drawForm(data) {
    log.debug({title:'data[0]', details:JSON.stringify(data)});
    var c=Object.keys(data[0]);

    var form=sw.createForm({title: 'Related Transactions by account'});
    var fields=[];
    var columns=[];
    var fld=null;
    var table=form.addSublist({type: 'list', id: 'custpage_table', label: 'Transactions By Account'});
    for(var i=0; i<c.length; i++) {
      id='custpage_'+c[i].replace(/\s/g,"").toLowerCase();
      columns.push({id:c[i], fieldname:id});
      label=c[i];
      fld = rmfunc.addField2(
          {
            form: form,
            sublistId: 'custpage_table',
            id: id,
            label: label,
            type: 'text',
          },
          fields
      );
    }
    for(var i=0; i<data.length; i++) {
      for(var j=0; j<columns.length; j++) {
        table.setSublistValue({id:columns[j].fieldname, line:i, value:data[i][columns[j].id]});
      }
    }
    log.debug(fields);
    return form;
  }

  function onRequest(context) {
    var data=getData(context.request.parameters);
    var form=drawForm(data);
    context.response.writePage(form);
    return true;
  }

  return {onRequest}

});
      // fld = rmfunc.addField2(
      //     {
      //       form: form,
      //       sublistId: 'custpage_table',
      //       id: 'custpage_invid',
      //       label: 'Invoice Number',
      //       type: 'text',
      //       defaultValue: data?.invid,
      //       layoutType: 'outside',
      //       breakType: 'startrow',
      //     },
      //     fields
      // );
