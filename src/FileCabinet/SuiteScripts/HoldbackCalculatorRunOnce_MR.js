/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/search', 'SuiteScripts/Libraries/Holdback-functions.js'], function(record, search, hbfunc) {
    function getInputData(context) {
        log.debug('begin');
        try {
            var resultlimit=250;
            filters=[];
            columns=[];
            filters.push(search.createFilter({name:'type', operator:'anyof', values:['CustInvc']}));
            filters.push(search.createFilter({name:'anylineitem', operator:'anyof', values:7}));
            filters.push(search.createFilter({name:'mainline', operator:'is', values:'T'}));
//            filters.push(search.createFilter({name:'formulanumeric', operator:'equalto', values:1, formula:'case when rownum <= '+resultlimit+' then 1 else 0 end'}));
            columns.push(search.createColumn({name:'trandate'}));
            columns.push(search.createColumn({name:'type'}));
            columns.push(search.createColumn({name:'internalid'}));
            columns.push(search.createColumn({name:'tranid'}));
            columns.push(search.createColumn({name:'entity'}));
            columns.push(search.createColumn({name:'amount'}));
            s=search.create({type:'transaction', columns:columns, filters:filters});
            rc=s.runPaged().count;
            results={};
            pagedData=s.runPaged({pageSize:1000});
            for(i=0;i<pagedData.pageRanges.length; i++){
                page=pagedData.fetch(i);
                page.data.forEach(function(result){
                    custintid=result.getValue('entity');
                    tranid=result.getValue('tranid');
                    tranintid=result.getValue('internalid');
                    if(!results.hasOwnProperty(custintid)){
                        results[custintid]={invoices:[]};
                    }
                    results[custintid].invoices.push({intid:tranintid, tranid:tranid});
                    return true;
                });
            }
            log.debug({title:'number of customers:'+Object.keys(results).length})
            return results;
        } catch(e) {
            log.debug({title:e.name, details:e.message});
        }
    }

    function map(context) {
        try {
            log.debug('map');
            var custintid=context.key;
            var cust=record.load({type:'customer', id:custintid});
            var trandata=hbfunc.doSearch({custintid:custintid});
            var hbtotal=0;
            trandata.forEach(function(line) {
              var tranintid=line.tranintid;
              hbtotal += parseFloat(line.amount);
              return true;
            });

            var hb=parseFloat(cust.getValue({fieldId:'custentity_invoiceholdback'}));
            hb=Math.round(hb*100)/100;
            hbtotal=Math.round(hbtotal*100)/100;
            if(hb!==hbtotal) {
              cust.setValue({fieldId: 'custentity_invoiceholdback', value: hbtotal});
              var result=cust.save();
              log.debug('result: '+result+'; hb:'+hb+'; hbtotal: '+hbtotal);
            } else {
              log.debug('no changes to save');
            }

        } catch(e) {
            log.debug({title:e.name+' '+e.message, details:JSON.stringify(e)});
        }
        return true;
    }

    function summarize(context) {
        log.debug('end');
    }

    return {getInputData:getInputData, map:map, summarize:summarize};
});