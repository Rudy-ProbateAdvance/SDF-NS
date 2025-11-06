/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
    // object to map column id to info about the sublist fields
var columnmaps = {
        invoices: {
            "estintid": {name: "Estate Internal ID", type: "text", source: null, displayType: 'hidden'},
            "custintid": {name: "Customer Internal ID", type: "text", source: null, displayType: "hidden"},
            "invintid": {name: "Invoice Internal ID", type: "text", source: null, displayType: "hidden"},
            "priority": {name: 'PCL Priority Rank', type: "text", source: null, displayType: "hidden"},
            "estid": {name: "Estate ID", type: "text", source: null, displayType: "inline"},
            "estname": {name: "Estate Name", type: "text", source: null, displayType: "inline"},
            "custid": {name: "Customer ID", type: "text", source: null, displayType: "inline"},
            "custname": {name: "Customer Name", type: "text", source: null, displayType: "inline"},
            "invid": {name: "Invoice #", type: "text", source: null, displayType: "inline"},
            "leadsource": {name: "Channel", type: "text", source: null, displayType: "inline"},
            "estatecounty": {name: "Estate County", type: "text", source: null, displayType: "inline"},
            "advamt": {name: "Advance Amount", type: "text", source: null, displayType: "inline"},
            "option1": {name: "Option 1", type: "text", source: null, displayType: "inline"},
            "option2": {name: "Option 2", type: "text", source: null, displayType: "inline"},
            "option3": {name: "Option 3", type: "text", source: null, displayType: "inline"},
            "assignamt": {name: "Assignment Amount", type: "text", source: null, displayType: "inline"},
            "exppaybackorig": {name: "Expected Payback Original", type: "text", source: null, displayType: "entry"},
            "exppaybacknow": {name: "Expected Payback Now", type: "text", source: null, displayType: "entry"},
            "defaultonadv": {name: "Default On Advance", type: "text", source: null, displayType: "inline"},
            "defaultonexpected": {name: "Default On Expected", type: "text", source: null, displayType: "inline"},
            "type": {
                name: "Problem Case Type",
                type: 'select',
                source: "customlist_problemcasetypes",
                displayType: "entry"
            },
            "comment": {name: "Comment", type: "textarea", source: null, displayType: "entry"}
        },
        estates: {
            "estintid": {name: 'Internal ID', type: 'text', displayType: 'hidden'},
            "pclpriority": {name: 'PCL Priority', type: 'integer', displayType: 'entry'},
            "estid": {name: 'Estate ID', type: 'text', displayType: 'inline'},
            "problemcase": {name: 'Problem Case', type: 'checkbox', displayType: 'entry'},
            "estname": {name: 'Name', type: 'text', displayType: 'inline'},
            "receivables": {name: 'Receivables', type: 'integer', displayType: 'inline'},
            "defaultonexpected": {name: 'Default On Expected', type: 'integer', displayType: 'inline'},
            "defaultonadvance": {name: 'Default On Advance', type: 'integer', displayType: 'inline'},
            "flagnotemsg": {name: 'Flagged Note Message', type: 'textarea', displayType: 'inline'},
            "flagnotedate": {name: 'Flagged Note Date', type: 'date', displayType: 'inline'},
            "lastnotemsg": {name: 'Latest Note Message', type: 'textarea', displayType: 'inline'},
            "lastnotedate": {name: 'Latest Note Date', type: 'date', displayType: 'inline'},
        }
    };

define(['N/record', 'N/query', 'N/url', 'N/currentRecord', 'SuiteScripts/Libraries/RM-functions.js'], function (record, query, url, cr, rmfunc) {

    function pageInit(context) {
        return true;
    }

    function fieldChanged(context) {
//        debugger;
        if(window.ignoreFieldChange) {
            return true;
        }
        var rec = context.currentRecord;
        var val = rec.getSublistValue({sublistId: context.sublistId, fieldId: context.fieldId, line: context.line});
        var field = context.fieldId;
        var line = context.line;
        var sublist = context.sublistId;
        if (context.sublistId == 'estates') {
            var estintid = rec.getSublistValue({sublistId: sublist, fieldId: 'estintid', line: line});
            var custintid = rec.getSublistValue({sublistId: sublist, fieldId: 'custintid', line: line});
            if (field == 'problemcase') {
                record.submitFields({type: 'customer', id: estintid, values: {custentity_problem_case: 'F'}});
                reloadpage();
                return true;
            }
            if (field == 'pclpriority') {
                window.ignoreFieldChange=true;
                if (val.toString().match(/[^0-9]/) || parseInt(val) < 1) {
                    alert('Value must be an integer greater than 0');
                    return false;
                }
                var lc = rec.getLineCount('estates');
                var priority = [];
                for (var i = 0; i < lc; i++) {
                    var rank = rec.getSublistValue({sublistId: sublist, fieldId: 'pclpriority', line: i});
                    if (rank == '' || rank == 'undefined' || rank == null)
                        continue;
                    var estintid = rec.getSublistValue({sublistId: sublist, fieldId: 'estintid', line: i});
                    priority.push({rank: parseInt(rank), estintid: estintid});
                }

                var newrank = rec.getSublistValue('estates', 'pclpriority', line);
                var newestintid = rec.getSublistValue('estates', 'estintid', line);
                var temppriority = priority.filter(function (a) {
                    return a.estintid != newestintid
                });

                temppriority.sort(function (a, b) {
                    return a.rank - b.rank
                });
                for (var i = 0; i < temppriority.length; i++)
                    temppriority[i].rank = i + 1;
                if (newrank > temppriority.length)
                    newrank = temppriority.length + 1;
                if (newrank != '' && newrank != 'undefind' && newrank != null) {
                    for (var i = newrank - 1; i < temppriority.length; i++)
                        temppriority[i].rank++;
                    temppriority.push({rank: parseInt(newrank), estintid: newestintid});
                    temppriority.sort(function (a, b) {
                        return a.rank - b.rank;
                    });
                }
                priority = {};
                for (var i = 0; i < temppriority.length; i++)
                    priority[temppriority[i].estintid] = {
                        estintid: temppriority[i].estintid,
                        rank: temppriority[i].rank
                    };
                //FROM HERE
                for (var i = 0; i < lc; i++) {
                    var estintid = rec.getSublistValue({sublistId: sublist, fieldId: 'estintid', line: i});
                    if (!!priority[estintid]) {
                        rec.selectLine({sublistId:sublist, line:i});
                        rec.setCurrentSublistValue({sublistId:sublist, fieldId:'pclpriority', line:i, value:priority[estintid].rank});
                        rec.commitLine({sublistId:sublist});
                    }
                }
                //TO HERE
                window.ignoreFieldChange=false;

                record.submitFields({
                    type: 'customrecord_pcl_priority',
                    id: 1,
                    values: {custrecord_pcl_priority: JSON.stringify(priority)}
                });
                window.ischanged=false;
//                reloadpage(newestintid);
            }

            if (field == 'flagnotemsg') {
                var flagnoteintid = rec.getSublistValue({sublistId: 'estates', fieldId: 'flagnoteintid', line: line});
                if (!flagnoteintid) {
                    alert('ERROR: Flag a note in the customer app. This page cannot be used to flag or create new notes.');
                    return false;
                }
                var message = rec.getSublistValue({sublistId: 'estates', fieldId: 'flagnotemsg', line: line});
                record.submitFields({
                    type: 'phonecall',
                    id: flagnoteintid,
                    values: {message: message},
                    options: {ignoreMandatoryFields: true}
                });
                return true;
            }

            if (field == 'lastnotemsg') {
                var lastnoteintid = rec.getSublistValue({sublistId: 'estates', fieldId: 'lastnoteintid', line: line});
                if (!lastnoteintid) {
                    alert('ERROR: Create a note in the customer app. This page cannot be used to create new notes.');
                    return false;
                }
                var message = rec.getSublistValue({sublistId: 'estates', fieldId: 'lastnotemsg', line: line});
                record.submitFields({
                    type: 'phonecall',
                    id: lastnoteintid,
                    values: {message: message},
                    options: {ignoreMandatoryFields: true}
                });
                return true;
            }
        }
        if (context.sublistId == 'invoices') {
            var invintid = rec.getSublistValue({sublistId: sublist, fieldId: 'invintid', line: line});
            var estintid = rec.getSublistValue({sublistId: sublist, fieldId: 'estintid', line: line});
            var custintid = rec.getSublistValue({sublistId: sublist, fieldId: 'custintid', line: line});
            var advamt=rec.getSublistValue({sublistId: sublist, fieldId: 'advamt', line: line});
            var exppaybackorig=rec.getSublistValue({sublistId: sublist, fieldId: 'exppaybackorig', line: line});
            var exppaybacknow=rec.getSublistValue({sublistId: sublist, fieldId: 'exppaybacknow', line: line});
            var defaultonadv=parseInt(exppaybacknow)-parseInt(advamt);
            var defaultonexpected=parseInt(exppaybacknow)-parseInt(exppaybackorig);
            if (field == 'exppaybackorig') {
                var status = record.submitFields({
                    type: 'invoice',
                    id: invintid,
                    values: {'custbody_pcl_expectedpayback_orig': val}
                });
                window.ignoreFieldChange=true;
                rec.selectLine({sublistId:sublist, line:line});
                rec.setCurrentSublistValue({sublistId:sublist, fieldId:'defaultonexpected', value:defaultonexpected});
                rec.commitLine({sublistId:sublist});
                window.ignoreFieldChange=false;
//                reloadpage(estintid);
            }
            if (field == 'exppaybacknow') {
                var status = record.submitFields({
                    type: 'invoice',
                    id: invintid,
                    values: {'custbody_pcl_expectedpayback_now': val}
                });
                window.ignoreFieldChange=true;
                rec.selectLine({sublistId:sublist, line:line});
                rec.setCurrentSublistValue({sublistId:sublist, fieldId:'defaultonadv', value:defaultonadv});
                rec.setCurrentSublistValue({sublistId:sublist, fieldId:'defaultonexpected', value:defaultonexpected});
                rec.commitLine({sublistId:sublist});
                window.ignoreFieldChange=false;
//                reloadpage(estintid);
            }
            if (field == 'type') {
                var status = record.submitFields({
                    type: 'customer',
                    id: estintid,
                    values: {'custentity_pcl_type': val}
                });
                return true;
            }
            if (field == 'comment') {
                var status = record.submitFields({
                    type: 'customer',
                    id: custintid,
                    values: {'custentity_pcl_comment': val}
                });
                return true;
            }
        }
        return true;
    }

    function stringifysublist(sublistid) {
//      debugger;
        var rec = cr.get()
        var columnmap = columnmaps[sublistid];
        var headers = [];
        var columns = Object.keys(columnmap);
        var headers = [];
        for (i in columnmap) {
            var col = columnmap[i];
            headers.push(col.name);
        }
        var lc = rec.getLineCount({sublistId: sublistid});
        var cc = columns.length;
        var xmlstring = '"' + headers.join('","') + '"\n';
//      debugger;
        for (var i = 0; i < lc; i++) {
            var row = [];
            for (var j = 0; j < cc; j++) {
              var cdata1=rec.getSublistText({
                  sublistId: sublistid,
                  fieldId: columns[j],
                  line: i
              });
              var cdata2=cdata1.toString().trim().replace(/,/, ' ').replace(/"/g, "'");
              row.push(cdata2);
            }
            row = row.map(function (field) {
                if (field.match(/href/))
                    field = field.replace(/<[^>]*>/g, '');
                if (field.match('9999999999999') || field.match('9.999999999999E12'))
                    field = ' ';
                return field;
            });
            xmlstring += '"' + row.join('","') + '"\r\n';
        }
        var d = new Date();
        var datestring = rmfunc.getDateTime();
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(xmlstring));
        element.setAttribute('download', "problem case " + sublistid + " - " + datestring + ".csv");
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        return true;
    }


    function reloadpage(estintid) {
        window.ischanged = false;

        var params='';
        var baseurl='/app/site/hosting/scriptlet.nl?script=1700&deploy=1';
        var selectedtab=window.sCurrentlySelectedTab;
        params=`&selectedtab=${window.sCurrentlySelectedTab}`;
        if(estintid) {
            params+=`#estate${estintid}`;
        }
        var finalurl=baseurl+params;
        document.location.assign(finalurl);
    }




    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        stringifysublist: stringifysublist,
        reloadpage:reloadpage,
    };

});
