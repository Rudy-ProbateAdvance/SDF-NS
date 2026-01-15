/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/search', 'N/query', 'N/runtime', 'N/ui/serverWidget', 'SuiteScripts/Libraries/RM-functions.js'], function (record, search, query, runtime, sw, rmfunc) {

  function addField(params, fields) {
    if (!params.form || !params.id || !params.label || !params.type) {
      throw new Error('addField: form, id, label, and type are required');
    }

    var form = params.form;
    var fieldId = params.id;
    var label = params.label;
    var type = params.type.toLowerCase();
    var sublistId = params.sublistId;
    var field;

    // Map common aliases → official serverWidget constants
    var typeMap = {
      'text'        : sw.FieldType.TEXT,
      'textarea'    : sw.FieldType.TEXTAREA,
      'checkbox'    : sw.FieldType.CHECKBOX,
      'date'        : sw.FieldType.DATE,
      'datetime'    : sw.FieldType.DATETIMETZ,
      'currency'    : sw.FieldType.CURRENCY,
      'decimal'     : sw.FieldType.FLOAT,
      'integer'     : sw.FieldType.INTEGER,
      'select'      : sw.FieldType.SELECT,
      'multiselect' : sw.FieldType.MULTISELECT,
      'url'         : sw.FieldType.URL,
      'email'       : sw.FieldType.EMAIL,
      'phone'       : sw.FieldType.PHONE,
      'inline'      : sw.FieldType.INLINEHTML,
      'help'        : sw.FieldType.HELP,
      'label'       : sw.FieldType.LABEL,
      'radio'       : sw.FieldType.RADIO,
      'file'        : sw.FieldType.FILE
    };

    var fieldType = typeMap[type] || type; // fallback if already a constant

    if (sublistId) {
      var sublist = form.getSublist({id: sublistId});
      if (!sublist) {
        throw new Error('Invalid sublistId: ' + sublistId);
      }
      field = sublist.addField({
        id: fieldId,
        label: label,
        type: fieldType
      });
      if (params.tab) {
        field.updateTab({tab: params.tab});
      }
    } else {
      field = form.addField({
        id: fieldId,
        label: label,
        type: fieldType,
        source: params.source || null,
        container: params.container || params.tab || null
      });
    }

    if (params.defaultValue !== undefined && params.defaultValue !== null) {
      field.defaultValue = params.defaultValue;
    }
    if (params.mandatory) {
      field.isMandatory = true;
    }
    if (params.displayType) {
      var dt = params.displayType.toLowerCase();
      if (dt === 'readonly') dt = 'disabled';
      field.updateDisplayType({displayType: sw.FieldDisplayType[dt.toUpperCase()] || sw.FieldDisplayType.NORMAL});
    }
    if (params.layoutType) {
      field.updateLayoutType({layoutType: params.layoutType});
    }
    if (params.breakType) {
      field.updateBreakType({breakType: params.breakType});
    }
    if (params.helpText) {
      field.setHelpText({help: params.helpText});
    }
    if (params.maxLength && (type === 'text' || type === 'textarea')) {
      field.maxLength = params.maxLength;
    }

    if (type === 'url') {
      field.linkText = label;
      if (params.openNewWindow !== false) {
        field.openInNewWindow = true;
      }
    }

    if (type === 'select' || type === 'multiselect') {
      if (params.source) {
        field.addSelectOption({value: '', text: ' '}); // optional blank
      }
    }

    if (type === 'checkbox' && params.defaultChecked === true) {
      field.defaultValue = true;
    }

    if (typeof (fields) == 'object') {
      var container = params.sublistId || 'body';
      var temp = {id: params.id, label: params.label};
      if (!fields.hasOwnProperty(container)) {
        fields[container] = [];
      }
      fields[container].push(temp);
    }

    return field;
  }


  function getData(context) {
    var retval = {};
    if (!context) {
      return null;
    }
    var params = context.request.parameters;
    var invintid;
    var invid;
    if (params.invintid)
      invintid = params.invintid.toUpperCase();
    if (params.custpage_invintid)
      invintid = params.custpage_invintid.toUpperCase();
    if (params.invid)
      invid = params.invid.toUpperCase();
    if (params.custpage_invid)
      invid = params.custpage_invid.toUpperCase();

    if (invid) {
      var q = `
          select id
          from transaction
          where recordtype = 'invoice'
            and tranid = '${invid}'
      `;
      var rs = query.runSuiteQL({query: q});
      if(rs.results.length>0) {
        invintid = rs.asMappedResults()[0].id;
      } else {
        return {invintid:invintid, invid:invid, error:'No invoice found'};
      }
    } else if (invintid) {
      var q = `
          select tranid
          from transaction
          where recordtype = 'invoice'
            and id = '${invintid}'
      `;
      var rs = query.runSuiteQL({query: q});
      invid = rs.asMappedResults()[0].tranid;
    } else {
      return {invintid:invintid, invid:invid, error:'No invoice found'};
    }
    retval.invintid=invintid;
    retval.invid=invid;
    retval.invamount=null;

    retval.results = [];


    var q = `
        with invs as (select id
                      from transaction
                      where tranid = '${invid}')

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

              union

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

              union

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

              union

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
`;
    var pageddata = query.runSuiteQLPaged({query: q, pageSize: 1000});
    for (var i in pageddata.pageRanges) {
      var page = pageddata.fetch(i);
      var rs = page.data.asMappedResults();
      retval.results = retval.results.concat(rs);
    }
    retval.invintid=retval.results[0].invintid;
    retval.invid=retval.results[0].invid;
    retval.invamount=retval.results[0].invamount;

    return retval;
  }


  function drawForm(context) {
    var data = getData(context);


//    context.response.writeLine(JSON.stringify(data));
//    return true;


    var fld = null;
    var fields = {body: [], sublist: []};
    var form = sw.createForm({title: 'Invoice Related Transactions'});
    form.addSubmitButton({label: 'Submit'});

    fld = addField(
        {
          form: form,
          id: 'custpage_invid',
          label: 'Invoice Number',
          type: 'text',
          defaultValue: data?.invid,
          layoutType: 'outside',
          breakType: 'startrow',
        },
        fields
    );
    fld = addField(
        {
          form: form,
          id: 'custpage_idornumber',
          label: 'ID OR NUMBER',
          type: 'inline',
          defaultValue: '<br />OR',
          layoutType: 'outside',
          breakType: 'startrow',
          displayType: 'hidden'
        }
        , fields
    );
    fld = addField(
        {
          form: form,
          id: 'custpage_invintid',
          label: 'Invoice Internal ID',
          type: 'text',
          layoutType: 'outside',
          breakType: 'startrow',
          displayType: 'hidden'
        },
        fields
    );
    fld = addField(
        {
          form: form,
          id: 'custpage_errormessage',
          label: 'error',
          type: 'inline',
          defaultValue: data?.error,
          layoutType: 'outside',
          breakType: 'startrow',
        }
        , fields
    );
    if (!data || data.error || !data.invintid || !data.invid) {
      return form;
    }

    var invurl=`<a target="_blank" href="https://5295340.app.netsuite.com/app/accounting/transactions/transaction.nl?id=${data.invintid}">${data.invid}</a>`;
    fld = addField(
        {
          form: form,
          id: 'custpage_invoicelink',
          label: 'Invoice',
          type: 'inline',
          defaultValue: `<p><h2>${invurl} total amount : ${rmfunc.formatnumber(data.invamount)}</h2></p>`
        }
        , fields
    );

    var transactions = form.addSublist({type: 'list', id: 'custpage_transactions', label: 'Related Transactions'});
    fld = addField(
        {
          form: form,
          sublistId: 'custpage_transactions',
          id: 'custpage_tranlink',
          label: 'Related Transaction',
          type: 'text',
        }
        , fields
    );
    fld = addField(
        {
          form: form,
          sublistId: 'custpage_transactions',
          id: 'custpage_lineseq',
          label: 'Line #',
          type: 'text',
        }
        , fields
    );
/*    fld = addField(
        {
          form: form,
          sublistId: 'custpage_transactions',
          id: 'custpage_trantype',
          label: 'Transaction Type',
          type: 'text',
        }
        , fields
    );*/
    fld = addField(
        {
          form: form,
          sublistId: 'custpage_transactions',
          id: 'custpage_account',
          label: 'Account',
          type: 'text',
        }
        , fields
    );
    fld = addField(
        {
          form: form,
          sublistId: 'custpage_transactions',
          id: 'custpage_tranamt',
          label: 'Amount',
          type: 'text',
        }
        , fields
    );

    for(var i=0; i<data.results.length; i++) {
      var result=data.results[i];
      var tranurl=`<a target="_blank" href="https://5295340.app.netsuite.com/app/accounting/transactions/transaction.nl?id=${result.id}">${result.recordtype} ${result.tranid}</a>`;
      transactions.setSublistValue({id:'custpage_tranlink', value:tranurl, line:i});
      transactions.setSublistValue({id:'custpage_lineseq', value:result.linesequencenumber, line:i});
      transactions.setSublistValue({id:'custpage_trantype', value:result.recordtype, line:i});
      transactions.setSublistValue({id:'custpage_account', value:result.accountname, line:i});
      transactions.setSublistValue({id:'custpage_tranamt', value:result.amount, line:i});
    }

//    log.debug('fields', JSON.stringify(fields));
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
//    if (context.request.method === "GET") {
    doGet(context);
//    } else {
//      doPost(context);
//    }
  }

  return {
    onRequest: onRequest
  }
});
