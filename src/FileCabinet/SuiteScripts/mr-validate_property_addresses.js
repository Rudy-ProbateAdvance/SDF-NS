/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/search', 'N/query', 'SuiteScripts/Libraries/GeocodeAddressParse.js', 'SuiteScripts/Libraries/RM-functions.js'],
    /**
     * @param{record} record
     * @param{search} search
     */
    function(record, search, query, addrp, rmfunc) {

        function getInputData(context) {
            log.debug('begin');
//            var columns=[];
//            columns.push(search.createColumn({name:'internalid', label:'Internal ID'}));
//            var filters=[];
//            filters.push(search.createFilter({name:'custrecord_property_geocode_error', operator:'isnot', values:'Successful - no error'}));
//            filters.push(search.createFilter({name:'created', operator:'after', values:'1/1/2023'}));
////            filters.push(search.createFilter({name:'formulanumeric', operator:'equalto', values:'1', formula:"case when {internalid} in ('13884', '1624', '11721', '10545', '10691', '9357', '8335', '9801', '7946', '6696', '5491', '15945', '4640', '4807', '11119', '13664', '14996', '11014', '63', '1371', '1375', '11655', '1947', '9188', '8880', '5689', '3418', '4763') then 1 else 0 end"}));
//            var s=search.create({filters:filters, columns:columns, type:'customrecord_property'});
//            var data=rmfunc.getSearchResults(s, 'o');
//            log.debug(Object.keys(data).length);
            var q=`
                select p.id, p.name
                from transaction t 
                join customer c on t.entity = c.id
                join customrecord_property p on c.parent = p.custrecord_property_estate
                where t.type='CustInvc'
                and BUILTIN.DF(t.status)='Invoice : Open'
                group by p.id, p.name
                order by p.id`;
            var data=rmfunc.getQueryResults(q);
            log.debug('found '+data.length+' results');
            return data;
        }

        function map(context) {
//            log.debug('map', context.value);
//            log.debug('map', JSON.stringify(context));
            var val = JSON.parse(context.value);
            var propintid = val.id;
            log.debug('internalid: ' + propintid);
            var recordObj = record.load({type: 'customrecord_property', id: propintid});
            recordObj.setValue({fieldId: 'custrecord_property_reviewaddress', value: false});
            var propname = recordObj.getValue({fieldId: 'name'});
            log.debug('original name: ' + propname);
            var propertyname = propname.replace(/["']/g, '').replace(/\(.*\)/g, ' ').replace(/\[.*\]/g, ' ').trim();
            var gcdata = addrp.parse(propertyname);
            if (!gcdata.error) {
                var gcaddr = gcdata.parsedaddress;
//              log.debug('google validation response', JSON.stringify(gcdata));
                recordObj.setValue({fieldId: 'name', value: gcaddr});
                log.debug('set name to '+gcaddr);
                recordObj.setValue({
                    fieldId: 'custrecord_property_address',
                    value: gcdata.components.streetaddress
                });
//                log.debug('set address to: ' + gcdata.components.streetaddress);
                recordObj.setValue({fieldId: 'custrecord_property_city', value: gcdata.components.city});
//                log.debug('set city to: ' + gcdata.components.city);
                recordObj.setValue({fieldId: 'custrecord_property_state', value: gcdata.components.state});
//                log.debug('set state to: ' + gcdata.components.state);
                recordObj.setValue({fieldId: 'custrecord_property_zipcode', value: gcdata.components.zip});
//                log.debug('set zip to: ' + gcdata.components.zip);
                recordObj.setValue({fieldId: 'custrecord_property_geocode_error', value: 'Successful - no error'});
                recordObj.setValue({fieldId: 'custrecord_property_lat', value: gcdata.latlon.latitude});
//                log.debug('set latitude to: ' + gcdata.latlon.latitude);
                recordObj.setValue({fieldId: 'custrecord_property_lon', value: gcdata.latlon.longitude});
//                log.debug('set longitude to: ' + gcdata.latlon.longitude);
                recordObj.setValue({fieldId: 'custrecord_property_zillowlink', value: gcdata.zillow});
//                log.debug('set zillow link to '+gcdata.zillow);
                recordObj.setValue({fieldId: 'custrecord_property_googlemapslink', value: gcdata.googlemaps});
//                log.debug('set google link to '+gcdata.googlemaps);
            } else {
                log.debug('error, id:'+propintid);
                recordObj.setValue({
                    fieldId: 'custrecord_property_geocode_error',
                    value: JSON.stringify(gcdata.error)
                });
            }
            if (!!gcdata.response.result.verdict.hasUnconfirmedComponents || !!gcdata.error) {
                recordObj.setValue({fieldId: 'custrecord_property_reviewaddress', value: true});
            log.debug('checked "review Address"');
            }
            recordObj.setValue({fieldId: 'custrecord_property_geocode_response', value: JSON.stringify(gcdata)});
            recordObj.setValue({fieldId: 'custrecord_property_address_to_update', value: false});
            var id = recordObj.save();
            log.debug('updated record ' + id);
            return true;
        }

        function reduce(context) {
            return true;
        }


        function summarize(context) {
            log.debug('end');
            return true;
        }

        return {getInputData, map, reduce, summarize};

    });
