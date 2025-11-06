/**
*@NApiVersion 2.0
*@NScriptType UserEventScript
*/
define(['N/record', 'N/search'], function (record, search) {
    function beforeLoad(context) {
        //all your Before Load actions will go in here.
    }

    function beforeSubmit(context) {
        //all your Before Submit actions will go in here.
    }

    function afterSubmit(context) {
        //all your After Submit actions will go in here.
        try {
            var crrRcd = context.newRecord;
            var cust_id = crrRcd.getValue("custrecord_property_estate");
          	log.debug("cust_id",cust_id);

            if (cust_id) {

                var customrecord_propertySearchObj = search.create({
                    type: "customrecord_property",
                    filters:
                        [
                            ["custrecord_property_estate", "anyof", cust_id]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "name",
                                sort: search.Sort.ASC,
                                label: "Name"
                            }),
                            search.createColumn({ name: "internalid", label: "Internal ID" }),
                            search.createColumn({ name: "custrecord_dot", label: "DOT" }),
                            search.createColumn({ name: "custrecord_escrow", label: "Escrow" })
                        ]
                });
                var searchResultCount = customrecord_propertySearchObj.runPaged().count;
                log.debug("customrecord_propertySearchObj result count", searchResultCount);
                var dot_arr = []; var escrow_arr = [];
                var count = 0;
                customrecord_propertySearchObj.run().each(function (result) {
                    // .run().each has a limit of 4,000 results
                    var dot_obj = result.getValue('custrecord_dot');
                    log.debug("dot_obj", dot_obj);
                    var escrow_obj = result.getValue('custrecord_escrow');
                    log.debug("escrow_obj", escrow_obj);
                    if (dot_obj == true) {
                        dot_arr.push(count);
                    }
                    if (escrow_obj == true) {
                        escrow_arr.push(count);
                    }

                    return true;
                });

                if (escrow_arr.length > 0 || dot_arr.length > 0) {
                    var custRecord = record.load({
                        type: record.Type.CUSTOMER,
                        id: cust_id,
                        isDynamic: true,
                    });
                    if (escrow_arr.length > 0) {
                        custRecord.setValue({
                            fieldId: 'custentity_escrow',
                            value: true,
                            // ignoreFieldChange: true
                        });
                    } else if (dot_arr.length > 0) {
                        custRecord.setValue({
                            fieldId: 'custentity_dot',
                            value: true,
                            // ignoreFieldChange: true
                        });
                    }
                    var cust_obj = custRecord.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });
                  log.debug("cust_obj", cust_obj);
                }
            }

        } catch (error) {
            log.debug("error", error);
        }
    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});