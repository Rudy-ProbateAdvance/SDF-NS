/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */
define(['N/record', 'N/search', 'N/runtime'],

    function (record, search, runtime) {

        function afterSubmit(scriptContext) {
            try {
                let newrec = scriptContext.newRecord;
                log.debug('rectype', newrec.type);
                let recordId = newrec.id;
                let exitingsource = newrec.getValue({
                    fieldId: 'custentity_source'
                });
                /*let parent = newrec.getValue({
                    fieldId: 'parent'
                });
                if (exitingsource == 'web services' && scriptContext.type == 'create' && parent) {
                    let customrecord_case_statusSearchObj = search.create({
                        type: "customrecord_case_status",
                        filters: [
                            ["custrecord_case_status_customer", "anyof", recordId]
                        ],
                        columns: [
                            search.createColumn({
                                name: "scriptid",
                                sort: search.Sort.ASC,
                                label: "Script ID"
                            }),
                            search.createColumn({
                                name: "custrecord_case_status_status",
                                label: "Status"
                            }),
                        ]
                    });
                    let searchResultCount = customrecord_case_statusSearchObj.runPaged().count;
                    log.error("customrecord_case_statusSearchObj result count", searchResultCount);
                    if (searchResultCount == 0) {
                        var caseStatusRec = record.create({
                            type: "customrecord_case_status"
                        });
                        caseStatusRec.setValue("custrecord_case_status_status", "1"); //Prospective
                        caseStatusRec.setValue("custrecord_case_status_customer", recordId);
                        var caseStatusRecId = caseStatusRec.save();
                         log.error('caseStatusRecId',caseStatusRecId);
                    }

                }*/
                if (!exitingsource) {
                    log.debug('recordId', recordId);
                    var customerSearchObj = search.create({
                        type: "customer",
                        filters: [
                            ["systemnotes.type", "is", "T"],
                            "AND",
                            ['internalid', 'anyof', recordId]
                        ],
                        columns: [
                            search.createColumn({
                                name: "internalid",
                                label: "Internal ID"
                            }),
                            search.createColumn({
                                name: "entityid",
                                sort: search.Sort.ASC,
                                label: "ID"
                            }),
                            search.createColumn({
                                name: "context",
                                join: "systemNotes",
                                label: "Context"
                            })
                        ]
                    });
                    var searchResultCount = customerSearchObj.runPaged().count;
                    log.debug("customerSearchObj result count", searchResultCount);
                    let fields = {};
                    customerSearchObj.run().each(function (result) {
                        let source = result.getValue({
                            name: "context",
                            join: "systemNotes",
                            label: "Context"
                        });
                        log.debug('source', source);

                        record.submitFields({
                            type: newrec.type,
                            id: newrec.id,
                            values: {
                                'custentity_source': source
                            }
                        });
                    });
                }
            } catch (e) {
                log.error('ERROR', e)
            }
        }

        return {
            afterSubmit: afterSubmit
        };
    });