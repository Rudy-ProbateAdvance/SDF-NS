/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/currentRecord', 'N/record', 'N/search', 'N/redirect', 'N/runtime', 'SuiteScripts/Libraries/Holdback-functions.js'], function (currentRecord, record, search, redirect, runtime, hbfunc) {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} context
         * @param {Record} context.newRecord - New record
         * @param {string} context.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} context.form - Current form
         * @param {ServletRequest} context.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        function beforeLoad (context) {
          if(context.type!='create' && context.type!='edit' && context.type!='xedit' && context.type!='copy' /* && context.type!='view' */)
            return true;
          try {
            var user= runtime.getCurrentUser();
            var username = user.name;
            var userid= user.id;
            log.debug({title:'beforeload; being run by '+username+'; '+userid});
            var rec=context.newRecord;
            var recintid=rec.id;
            var rectype=rec.type;
            log.debug('transaction internalid: '+recintid+', transaction type:'+rec.type)
            if(rec.type=='check') {
                var invintid=rec.getValue('custbody_invoice');
                if(!invintid) {
                    log.debug({title:'check # '+rec.id+' not created from invoice'});
                    return true;
                }
                var filters=[];
                var columns=[];
                filters.push(search.createFilter({name:'internalid', operator:'anyof', values:invintid}));
                filters.push(search.createFilter({name:'anylineitem', operator:'anyof', values:7}));
                filters.push(search.createFilter({name:'mainline', operator:'is', values:'T'}));
                var s=search.create({type:'invoice', filters:filters, columns:columns});
                if(s.runPaged().count == 0) {
                    log.debug({title:'check # '+rec.id+' created from invoice without Cash Advanced To Client'});
                    return true;
                }
            }
            var custintid=rec.getValue({fieldId:'entity'});
            var cust=record.load({type:'customer', id:custintid});
//            log.debug({title:'customer internalid:'+custintid});
            var trandata=hbfunc.doSearch({custintid:custintid});
            log.debug({title:'result count:'+trandata.length});
            var hbtotal=0;
            trandata.forEach(function(line) {
              var tranintid=line.tranintid;
//              log.debug({title:'line', details:JSON.stringify(line)});
              hbtotal += parseFloat(line.amount);
              return true;
            });

            var hb=cust.getValue({fieldId:'custentity_invoiceholdback'});
            hbtotal=Math.round(100*hbtotal)/100;
            log.debug('hb:'+hb+'; hbtotal:'+hbtotal);
            if(hb!==hbtotal) {
              cust.setValue({fieldId: 'custentity_invoiceholdback', value: hbtotal});
              var result=cust.save();
              log.debug('record saved: '+result);
              redirect.toRecord({id:recintid, type:rectype, isEditMode:false});
            }
          } catch(e) {
            log.debug({title:e.name+' '+e.message, details:JSON.stringify(e)});
          }
          return true;
        }


        return {
          beforeLoad:beforeLoad,
          afterSubmit:beforeLoad,
        }

    });
