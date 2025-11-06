/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/email', 'N/file', 'N/record', 'N/search', 'N/ui/serverWidget', 'N/runtime', 'N/query', 'SuiteScripts/Libraries/RM-functions.js'], 
       function(email, file, record, search, sw, runtime, query, rmfunc) {
  function timestamp() {
    var datetimenow = new Date();
    var MM = ('' + datetimenow.getMonth() + 1).padStart(2, '0');
    var dd = ('' + datetimenow.getDate()).padStart(2, '0');
    var yyyy = ('' + datetimenow.getFullYear()).padStart(2, '0');
    var hh = ('' + datetimenow.getHours()).padStart(2, '0');
    var mm = ('' + datetimenow.getMinutes()).padStart(2, '0');
    var ss = ('' + datetimenow.getSeconds()).padStart(2, '0');
    var today = yyyy + MM + dd + hh + mm + ss;
    return today;
  }

  function getInputData() {
    log.debug({title:'begin'});
    var myscript=runtime.getCurrentScript();
    var fileid=myscript.getParameter({name:'custscriptfileid'});
    log.debug('fileid:'+fileid);
    var f = file.load({id:fileid});
    if (f.fileType != 'CSV' || !f.isText) {
      log.error('invalid file format');
      return;
    }
    var filecontents = f.getContents().replace(/"/g, '');
    var data = {};
    var invoicedata={};
    var errors = {};
    var tranids = [];
    var idstring='';
    var invintids = [];
    var resultcount = 0;
    var lines = filecontents.trim().replace(/\r/g, '').split(/\n/);
    var headers = lines[0];
    var temp = lines[0].split(',');
    lines.splice(0, 1);
    lines.forEach(function (line) {
      var fields = line.split(/,/);
      var assetid = fields[3];
      var linedata = {
        groupname: fields[0],
        purchasedate: fields[1],
        multiple: fields[2],
        assetid: assetid,
        found:false
      };
      linedata.invsec=[];
      if (!data.hasOwnProperty(assetid)) {
        data[assetid] = linedata;
        tranids.push(assetid);
        if(idstring.length>2)
        idstring+=",";
        idstring+="'"+assetid+"'";
      } else {
        if(!data[assetid].hasOwnProperty('errors'))
          data[assetid].errors=[];
        data[assetid].errors.push({name:'duplicate_csv_entries', message:'This invoice is listed more than once in the csv file'});
      }
    });
      
      
      
// find all associated invoices
      
    q=`select t.tranid as tranid, t.id as internalid, t.status as status, tl.foreignamountunpaid as amountremaining from transaction t join transactionline tl on tl.transaction=t.id where t.tranid in (${idstring}) and tl.foreignamountunpaid is not null`;
    log.debug('query', q);
    var results=rmfunc.getQueryResults(q);
      
    results.forEach(function (result) {
      var invid = result.tranid;
      data[invid].internalid = result.internalid;
      invintids.push(data[invid].internalid);
      data[invid].found=true;
      data[invid].status = result.status;
      data[invid].amountdue = parseInt(result.amountremaining);
//// don't process closed invoices
//      if (result.status == 'B') { // A: Open, B: Paid In Full
////        log.error('invoice is closed', JSON.stringify(data[invid]);
//        if(!data[invid].hasOwnProperty('errors'))
//          data[invid].errors=[];
//        data[invid].errors.push({name:'inv_closed', message:'invoice is closed'});
//        return true;
//      }
      
      // check groupname and start/end dates for duplicate
      // if not a duplicate:
      //      if update:
      //          find latest record, write (new startdate-1) in (old enddate)
      //      create new record, insert groupname, insert today's date, insert 12/31/9999 end date
      //      log status success
      // if a duplicate:
      //      log error details
      return true;
    });

    var q=`select id as invsecintid, custrecord_invsec_invoice as invintid, substr(BUILTIN.DF(custrecord_invsec_invoice),10) as invid, custrecord_invsec_group as groupname, custrecord_invsec_startdate as startdate, custrecord_invsec_enddate as enddate, custrecord_invsec_multiplier as multiplier from customrecord_invsecuritization where custrecord_invsec_enddate = to_date('12/31/9999', 'MM/DD/YYYY') and custrecord_invsec_invoice in (${invintids})`;
    var results=rmfunc.getQueryResults(q);
    results.forEach(function(result) {
      var invsecdata={
        invsecintid:result.invsecintid,
        invintid:result.invintid,
        invid:result.invid,
        group:result.groupname,
        startdate:result.startdate,
        enddate:result.enddate,
        multiplier:result.multiplier
      };
      if(data[result.invid].invsec.length>0) {
        if(!data[result.invid].hasOwnProperty('errors'))
          data[result.invid].errors=[];
        data[result.invid].errors.push({name:'duplicate_inv_sec', message:'More than one open securitization record'});
      }
      data[result.invid].invsec.push(invsecdata);
      return true;
    });
    log.debug({title:'inputdata', details:JSON.stringify(data)});
    return data;
  }


    
  function map(context) {
//    return;
    log.debug({title:"context", details:JSON.stringify(context)});
    var invoice=JSON.parse(context['value']);
    if(!invoice)
      return;
    if(!invoice.found) {
      log.error('Error: Invoice not found');
      return;
    }
    var invoicerec = record.load({
      type: 'invoice',
      id: invoice.internalid
    });
    if(invoice.multiple=='x') {
      invoicerec.setValue({fieldId:'custbody_securitizationgroupname', value:''});
      invoicerec.save();
      invoice.invsec.forEach(function(invsec) {
        record.delete({type:'customrecord_invsecuritization', id:invsec.invsecintid});
      });
      return;
    }
    if(invoice.hasOwnProperty('errors')) {
// don't process invoices with errors
      log.error('invoice '+invoice.assetid+' has errors', JSON.stringify(invoice));
      return;
    }
    if(invoice.invsec.length==1) {
// process existing open securitization record
// load old record
      var oldrecid = invoice.invsec[0].invsecintid;
      var oldrec = record.load({
        type: 'customrecord_invsecuritization',
        id: oldrecid
      });
// set enddate to new startdate-1 to close open period
      var newenddate = new Date(new Date(invoice.purchasedate) - 1);
      var oldstartdate = new Date(invsecdata[invoice.internalid].startdate);
      if (newenddate < oldstartdate) {
        log.debug('purchase date is before previous purchase date', JSON.stringify(invoice));
        return;
      }
// alter date on previous record to close it
      oldrec.setValue({
        fieldId: 'custrecord_invsec_enddate',
        value: newenddate
      });
// clear invoice groupname
      invoicerec.setValue({
        fieldId: 'custbody_securitizationgroupname',
        value: ''
      });
// save old record
      try {
        var oldrecordstatus = oldrec.save();
      } catch (e) {
        log.error('error updating record: ' + e.message, JSON.stringify(invoice));
        return;
      }
    }
// create new securitization record
    if (invoice.groupname != '' && invoice.groupname != null && invoice.groupname.toUpperCase() != 'CLOSED') {
      var rec = record.create({
        type: 'customrecord_invsecuritization'
      });
      rec.setValue({
        fieldId: 'custrecord_invsec_invoice',
        value: invoice.internalid
      });
      rec.setValue({
        fieldId: 'custrecord_invsec_group',
        value: invoice.groupname
      });
      rec.setValue({
        fieldId: 'custrecord_invsec_startdate',
        value: new Date(invoice.purchasedate)
      });
      rec.setValue({
        fieldId: 'custrecord_invsec_enddate',
        value: new Date('12/31/9999')
      });
      rec.setValue({
        fieldId: 'custrecord_invsec_multiplier',
        value: invoice.multiple
      });
// update groupname on invoice record
      invoicerec.setValue({
        fieldId: 'custbody_securitizationgroupname',
        value: invoice.groupname
      });
      // save new record
      try {
        var newrec = rec.save();
        invoice.newinvsecintid=newrec;
        log.debug('invoice', JSON.stringify(invoice));
        try {
          invoicerec.save();
        } catch (e) {
          log.debug('error saving invoice ' + invoice.assetid, JSON.stringify(invoice));
        }
      } catch (e) {
        log.error('error creating new record:' + e.message, JSON.stringify(invoice));
      }
      

    
    }
    return;
  } // map function

  function summarize(context) {
    log.debug({title:'end'});
  }

  return {getInputData:getInputData, map:map, summarize:summarize};
});
