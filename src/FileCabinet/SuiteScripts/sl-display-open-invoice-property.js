/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define(['N/record', 'N/file', 'N/email', 'N/runtime', 'N/search', 'N/format', 'N/ui/serverWidget'],
    function(record, file, email, runtime, search, format, ui) {
        var scriptObj = runtime.getCurrentScript();

        const execute = (scriptContext) => {
            try {
                let column = [];
                let column1 = [];
                let invoiceTotal1 = {};
                let invoiceTotal = {};
                let filter;
                let filter1;
                let attachmentsList = [];
                column.push(search.createColumn({
                    name: "parent",
                    join: "customer",
                    summary: "GROUP",
                    sort: search.Sort.ASC,
                }));
                column.push(search.createColumn({
                    name: "tranid",
                    summary: "GROUP",
                }));
                column.push(search.createColumn({
                    name: "trandate",
                    summary: "GROUP",
                }));
                column.push(search.createColumn({
                    name: "entity",
                    summary: "GROUP",
                }));
                column.push(search.createColumn({
                    name: "amount",
                    summary: "SUM",
                }));

                let to_date = new Date();
                let lastweekInv = {};
                let todatDate = format.format({
                    value: to_date,
                    type: format.Type.DATE
                })
                let lastweek = format.format({
                    value: getLastWeek(),
                    type: format.Type.DATE
                });
                log.debug('todatDate', todatDate);
                log.debug('lastweek', lastweek);
                filter = [
                    ["type", "anyof", "CustInvc"], "AND", ["mainline", "is", "T"], "AND", ["status", "anyof", "CustInvc:A"]
                ];

                let searchObject = search.create({
                    type: search.Type.INVOICE,
                    columns: column,
                    filters: filter
                });
                let allOpeninvoice = [];
                let openinvoies = {};
                let openinvoies_pastmonth = {};

                let searchPage = getSearchResult(searchObject)
                searchPage.forEach(function (result) {
                    let amount = result.getValue(result.columns[4]);
                    let estate = result.getValue(result.columns[0]);
                    allOpeninvoice.push(estate);
                    openinvoies[estate] = {
                        'customer': result.getText(result.columns[3]),
                        'tranid': result.getValue(result.columns[1]),
                        'date': result.getValue(result.columns[2]),
                        'Amount': result.getValue(result.columns[4])
                    }
                    openinvoies_pastmonth[estate] = {
                        'Amount': result.getValue(result.columns[4])
                    }
                    // invoiceTotal1.push({estate:result.getValue( result.columns[ 4 ] )});
                    if (invoiceTotal1.hasOwnProperty(estate)) {
                        invoiceTotal1[estate] += Number(amount);
                    } else {
                        invoiceTotal1[estate] = Number(amount);
                    }
                });


                log.debug('invoiceTotal1', invoiceTotal1)
                /*if (allOpeninvoice.length > 0) {

                    let csvString = geratecsv(allOpeninvoice, 'lastestate', openinvoies, invoiceTotal1);
                    let filename = 'All Properties .csv';
                    let fileObj = file.create({
                        name: filename,
                        fileType: file.Type.CSV,
                        folder: -15,
                        contents: csvString.replace('"', '')
                    });
                    attachmentsList.push(fileObj);
                    log.debug('fileObj', fileObj.save());
                }*/
                column1.push(search.createColumn({
                    name: "parent",
                    join: "customer",
                    sort: search.Sort.ASC,
                }));
                column1.push(search.createColumn({
                    name: "tranid",
                }));
                column1.push(search.createColumn({
                    name: "trandate"
                }));
                column1.push(search.createColumn({
                    name: "entity"
                }));
                column1.push(search.createColumn({
                    name: "amount"
                }));
                filter1 = [
                    ["type", "anyof", "CustInvc"], "AND", ["mainline", "is", "T"], "AND", ["status", "anyof", "CustInvc:A"], 'AND', ["trandate", "within", lastweek, todatDate]
                ];
                let lastweeksearchObject = search.create({
                    type: "invoice",
                    columns: column1,
                    filters: filter1
                });
                let lastweekinvoice = [];
                var searchResultCount = lastweeksearchObject.runPaged().count;
                let lastweeksearchPage = getSearchResult(lastweeksearchObject);

                lastweeksearchPage.forEach(function (result) {
                    let amount = result.getValue(result.columns[4]);
                    let estate = result.getValue(result.columns[0]);
                    lastweekinvoice.push(estate);
                    lastweekInv[estate] = {
                        'customer': result.getText(result.columns[3]),
                        'tranid': result.getValue(result.columns[1]),
                        'date': result.getValue(result.columns[2]),
                        'Amount': result.getValue(result.columns[4])
                    }
                    if (invoiceTotal.hasOwnProperty(estate)) {
                        invoiceTotal[estate] += Number(amount);
                    } else {
                        invoiceTotal[estate] = Number(amount);
                    }


                });
                log.debug('invoiceTotal', invoiceTotal);

                let effectivedateResult = effectivedateSearchObj(allOpeninvoice)
                var searchResultCount = effectivedateResult.runPaged().count;
                log.debug('effectivedateResult', searchResultCount)
                var dataObj={};
                if (searchResultCount > 0) {
                    let maxCommunicationDates = maxCommunicationDate(allOpeninvoice);
                    log.debug('maxCommunicationDates',maxCommunicationDates);
                    //let csvString = geratecsv( effectivedateResult, 'event', openinvoies ,invoiceTotal);   // Commented on 21/03
                    let csvString = geratecsv(effectivedateResult, 'event', openinvoies_pastmonth, invoiceTotal1,maxCommunicationDates);
                    let filename = 'Status Change within past month';
                    dataObj[filename] = csvString;
                }
                let statusSearchObjResult = statusSearchObj(allOpeninvoice);
                var searchResultCount1 = statusSearchObjResult.runPaged().count;
                log.debug('statusSearchObjResult', searchResultCount1)
                if (searchResultCount1 > 0) {
                    let maxCommunicationDates = maxCommunicationDate(allOpeninvoice);
                    log.debug('maxCommunicationDates',maxCommunicationDates);
                    let csvString = geratecsv(statusSearchObjResult, 'status', openinvoies, invoiceTotal1,maxCommunicationDates);
                    let filename = 'Preforeclosure Status';
                    dataObj[filename]=csvString;
                }
                let dotSearchObjResult = dotSearchObj(allOpeninvoice);
                var searchResultCount2 = dotSearchObjResult.runPaged().count;
                log.debug('statusSearchObjResult', searchResultCount2)
                if (searchResultCount2 > 0) {
                    let maxCommunicationDates = maxCommunicationDate(allOpeninvoice);
                    let csvString = geratecsv(dotSearchObjResult, 'dot', openinvoies, invoiceTotal1,maxCommunicationDates);
                    let filename = 'DOT REPORT';
                    dataObj[filename] = csvString;
                }

                return dataObj;

            } catch (e) {
                log.error('ERROR', e);
            }
        }
        /**
         * Get the search result
         */
        var getSearchResult = (pagedDataObj) => {
            try {
                var pagedData = pagedDataObj.runPaged({
                    pageSize: 1000
                });
                var resultDetails = new Array();
                pagedData.pageRanges.forEach(function (pageRange) {
                    var myPage = pagedData.fetch({
                        index: pageRange.index
                    });
                    myPage.data.forEach(function (result) {
                        resultDetails.push(result);
                    });
                });

                return resultDetails;
            } catch (e) {
                log.error('error', e)
            }
        };

        const geratecsv = (estates, action, lastweekInv, invoiceTotal,maxCommunicationDates) => {
            try {
                log.debug('action', action)
                let searchObj;
                if (action == 'lastestate') {
                    searchObj = getSearchObj(estates);
                } else if (action == 'estate') {
                    searchObj = getSearchObj(estates);
                } else if (action == 'event') {
                    searchObj = estates;
                } else if (action == 'status') {
                    searchObj = estates;

                } else if (action == 'dot') {
                    searchObj = estates;

                }

                let searchResults = null;
                let searchcolumns = null;
                let csvString = "";
                try {
                    searchcolumns = searchObj.columns;
                    //   var columnsFinal = getCSVheader( searchcolumns, action )

                    if (action == 'event') {
                        csvString += getCSVheader1(searchcolumns, action);
                    } else if (action == 'status') {
                        csvString += getCSVheader2(searchcolumns, action);
                    } else if(action=='dot'){
                        csvString += getCSVheader3(searchcolumns, action);
                    }else {
                        csvString += getCSVheader(searchcolumns, action);
                    }

                    csvString += "\r\n";
                    searchResults = getSearchResult(searchObj);
                    csvString += getLineString(searchcolumns, searchResults, action, lastweekInv, invoiceTotal,maxCommunicationDates);

                } catch (e) {
                    log.error("getSavedSearchCSV", e);
                }
                return csvString;
            } catch (e) {
                log.error('ERROR CSV', e)
            }
        }
        /**
         * Generates CSV lines string from Saved Search Results
         */
        function getLineString(columns, searchResults, action, lastweekInv, invoiceTotal, maxCommunicationDates) {
            var cells = [];
            var csvdata = '';
            var lines = [];
            var csvLine = "";
            try {
                log.debug('action status',action);
                log.debug('searchResults status',searchResults.length);
                for (var x in searchResults) {
                    csvLine = "";
                    var result = searchResults[x];
                    var count = columns.length;
                    var line = 0;

                    for (var y = 0; y < columns.length; y++) {
                        var searchValue = "";
                        // Prefer to get the column text for Record/List fields we need text
                        // For text and numeric fields we will get the value as text is empty
                        if (columns[y].label != 'Internal ID') {

                            if (columns[y].label == 'ESTATE' || columns[y].label == 'Estate') {
                                searchValue = result.getText(columns[y]);
                                // log.debug('searchValue',searchValue);
                                if (action != 'status') {
                                    cells[line] = searchValue.toString().replace(/,/g, " ").replace(/\n/g," ");//`"${searchValue}"`;
                                    line++;
                                }
                                var estate = result.getValue(columns[y]);
                                var dataObj = lastweekInv[estate];
                                var invamount = invoiceTotal[estate];
                                if (action == 'status') {
                                    var commdate =maxCommunicationDates[estate];
                                    if (dataObj) {
                                        cells[line] = searchValue.toString().replace(/,/g, " ").replace(/\n/g," ");
                                        line++;
                                        cells[line] = invamount;
                                        line++;
                                        cells[line] = commdate;
                                        line++;
                                    } else {
                                        for (var i = 0; i < 3; i++) {
                                            cells[line] = '';
                                            line++;
                                        }
                                    }
                                }else if(action == 'event'){
                                    if (dataObj) {
                                        for (var prop in dataObj) {
                                            if (prop == 'Amount') {
                                                cells[line] = invamount;
                                                line++;
                                            }

                                        }
                                        var commdate =maxCommunicationDates[estate];
                                        cells[line] = commdate;
                                        line++;
                                    } else {
                                        for (var i = 0; i < 2; i++) {
                                            cells[line] = '';
                                            line++;
                                        }
                                    }
                                }else if(action == 'dot'){
                                    if (dataObj) {
                                        for (var prop in dataObj) {
                                            if (prop == 'Amount') {
                                                cells[line] = invamount;
                                                line++;
                                                var commdate =maxCommunicationDates[estate];
                                                cells[line] = commdate;
                                                line++;

                                            }
                                        }
                                    } else {
                                        for (var i = 0; i < 2; i++) {
                                            cells[line] = '';
                                            line++;
                                        }
                                    }
                                }
                                else {
                                    if (dataObj) {
                                        for (var prop in dataObj) {
                                            if (prop == 'Amount') {
                                                cells[line] = invamount;
                                            } else {
                                                cells[line] = dataObj[prop].toString().replace(/,/g, " ").replace(/\n/g, " ");
                                            }
                                            line++;
                                        }
                                    } else {
                                        for (var i = 0; i < 4; i++) {
                                            cells[line] = '';
                                            line++;
                                        }
                                    }
                                }
                            } else {
                                searchValue = result.getText(columns[y]);
                                if (!searchValue) {
                                    searchValue = result.getValue(columns[y]);
                                }
                                searchValue = searchValue.toString().replace(/,/g, " ").replace(/\n/g, " ");

                                searchValue = (searchValue).toString().replace(/"/g, " ").replace(/\n/g, " ");
                                if (searchValue.indexOf('+') == 0 || searchValue.indexOf('-') == 0) {
                                    searchValue = " " + searchValue;
                                }

                                cells[line] = searchValue.toString().replace(/,/g, " ");
                                line++;
                            }
                        }
                    }
                    //  log.debug('cells',cells);
                    csvLine = cells.join('"\,"');
                    lines.push(csvLine);
                    csvdata = lines.join('"\r\n"');
                }
//                csvdata = lines.join('"\r\n"');
                return csvdata;
            } catch (e) {
                log.error('getLineString', e);

            }
        }

        function getCSVheader(columns, action) {
            var name = "";
            var columnNames = [];
            for (var x in columns) {
                name = columns[x].label;
                if (name != 'Internal ID') {
                    if (name == "ESTATE" || name == "Estate") {
                        columnNames.push(name);
                        columnNames.push('Customer');
                        columnNames.push('Invoice Number');
                        columnNames.push('Invoice Date');
                        columnNames.push('Total Invoice Amount'); //
                    } else {
                        columnNames.push(name);
                    }
                }
            }
            return columnNames;
        }

        function getCSVheader1(columns, action) {
            var name = "";
            var columnNames = [];
            for (var x in columns) {
                name = columns[x].label;
                if (name != 'Internal ID') {
                    if (name == "ESTATE" || name == "Estate") {
                        columnNames.push(name);
                        columnNames.push('Total Invoice Amount');
                        columnNames.push('Last Communication Date'); //
                    } else {
                        columnNames.push(name);
                    }
                }
            }
            return columnNames;
        }
        function getCSVheader2(columns, action) {
            var name = "";
            var columnNames = [];
            for (var x in columns) {
                name = columns[x].label;
                if (name != 'Internal ID') {
                    if (name == "ESTATE" || name == "Estate") {
                        // columnNames.push(name);
                        columnNames.push('Estate/Customer Info');
                        columnNames.push('Total Invoice Amount');
                        columnNames.push('Last Communication Date'); //
                    } else {
                        columnNames.push(name);
                    }
                }
            }
            log.debug('getCSVheader2 columnNames', columnNames);
            return columnNames;
        }

        const getCSVheader3=(columns, action)=> {
            var name = "";
            var columnNames = [];
            for (var x in columns) {
                name = columns[x].label;
                if (name != 'Internal ID') {
                    if (name == "ESTATE" || name == "Estate") {
                        columnNames.push(name);
                        columnNames.push('Total Invoice Amount');
                        columnNames.push('Last Communication Date');
                    } else {
                        columnNames.push(name);
                    }
                }
            }
            return columnNames;
        }

        const getSearchObj = (estates) => {
            var propertySearchObj = search.create({
                type: "customrecord_property",
                filters: [
                    ["custrecord_property_estate", "anyof", estates],
                    "AND",
                    ["custrecord_sold", "is", "F"], 'AND',
                    ["custrecord_property_percent_owned", "greaterthan", "0"]
                ],
                columns: [
                    search.createColumn({
                        name: "name",
                        sort: search.Sort.ASC,
                        label: "Property Name"
                    }),
                    search.createColumn({
                        name: "internalid",
                        label: " Property Id"
                    }),
                    search.createColumn({
                        name: "custrecord_property_estate",
                        sort: search.Sort.ASC,
                        label: "ESTATE"
                    }),
                    search.createColumn({
                        name: "custrecord_property_percent_owned",
                        label: "% OWNED"
                    }),

                    search.createColumn({
                        name: "custrecord_saleamount",
                        label: "Sale Amount "
                    }),
                    search.createColumn({
                        name: "custrecord_property_type",
                        label: "Property Type"
                    }),
                    search.createColumn({
                        name: "custrecord_estimatedvalue",
                        label: "Estimated RP Value"
                    }),
                    search.createColumn({
                        name: "custrecord_default_amount",
                        label: "Default Amount"
                    }),
                    search.createColumn({
                        name: "custrecord_event_effective_date",
                        label: "Event Effective Date"
                    }),

                    search.createColumn({
                        name: "custrecord_event_type",
                        label: "Listing Status"
                    }),
                    search.createColumn({
                        name: "custrecord_last_sale_valueamount",
                        label: "Last Event Type Amount"
                    }),
                    search.createColumn({
                        name: "custrecord_est_mortage_amt_attom",
                        label: "Estimated Mortagage Amount"
                    }),
                    search.createColumn({
                        name: "custrecord_est_mortage_amt_last_update",
                        label: "Estimated mortage amount last updated"
                    }),
                    search.createColumn({
                        name: "custrecord4",
                        label: "Preforeclosure Status"
                    }),
                    search.createColumn({
                        name: "custrecord_auction_date",
                        label: "Auction Date"
                    }),
                    search.createColumn({
                        name: "custrecord_foreclosure_event_date",
                        label: "Foreclosure Event Date"
                    })
                ]
            });
            return propertySearchObj;
        }
        const effectivedateSearchObj = (allOpeninvoice) => {
            var customrecord_propertySearchObj = search.create({
                type: "customrecord_property",
                filters: [
                    [
                        ["custrecord_last_sales_date_new","within","thismonth"],
                        "OR",["custrecord_event_effective_date_new","within","thismonth"],
                        "OR",["custrecord_event_effective_date_new", "within", "lastmonth"], "OR", ["custrecord_last_sales_date_new", "within", "lastmonth"]
                    ], 'AND',
                    ["custrecord_property_estate", "anyof", allOpeninvoice],
                    "AND",
                    ["custrecord_sold", "is", "F"], 'AND',
                    ["custrecord_property_percent_owned", "greaterthan", "0"]
                ],
                columns: [
                    search.createColumn({
                        name: "name",
                        //sort: search.Sort.ASC,
                        label: "Property Name"
                    }),
                    search.createColumn({
                        name: "internalid",
                        label: " Property Id"
                    }),
                    search.createColumn({
                        name: "custrecord_property_estate",
                        label: "Estate"
                    }),
                    search.createColumn({
                        name: "custrecord_property_percent_owned",
                        label: "% OWNED"
                    }),
                    search.createColumn({
                        name: "custrecord_escrow",
                        label: "Escrow",
                        sort: search.Sort.DESC,
                    }),
                    search.createColumn({
                        name: "custrecord_dot",
                        label: "DOT(Deed of Trust)",
                        sort: search.Sort.ASC,
                    }),
                    search.createColumn({
                        name: "custrecord_event_type",
                        label: "Listing Status",
                        sort: search.Sort.ASC,
                    }),
                    search.createColumn({
                        name: "custrecord_last_sale_valueamount",
                        label: "Last Event Type Amount"
                    }),
                    search.createColumn({
                        name: "custrecord_property_value",
                        label: "Value"
                    }),
                    search.createColumn({
                        name: "custrecord_event_effective_date",
                        label: "Event Effective Date",
                        sort: search.Sort.ASC,
                    }),
                    search.createColumn({
                        name: "custrecord_last_sale_date_attom",
                        label: "Last Sale Date"
                    }),
                    search.createColumn({
                        name: "custrecord_saleamount",
                        label: "Sale Amount"
                    }),
                    search.createColumn({
                        name: "custrecord_estimatedvalue",
                        label: "Estimated RP Value"
                    }),
                    search.createColumn({
                        name: "custrecord_default_amount",
                        label: "Default Amount"
                    }),
                    search.createColumn({
                        name: "custrecord_est_mortage_amt_attom",
                        label: "Estimated Mortagage Amount"
                    }),
                    search.createColumn({
                        name: "custrecord_est_mortage_amt_last_update",
                        label: "Estimated mortage amount last updated"
                    }),
                    search.createColumn({
                        name: "custrecord4",
                        label: "Preforeclosure Status"
                    }),
                    search.createColumn({
                        name: "custrecord_auction_date",
                        label: "Auction Date"
                    }),
                    search.createColumn({
                        name: "custrecord_foreclosure_event_date",
                        label: "Foreclosure Event Date"
                    }),
                    search.createColumn({
                        name: "custrecord_owner_name",
                        label: "Owner Name"
                    }),
                    search.createColumn({
                        name: "custrecord_property_type",
                        label: "Property Type"
                    }),
                    search.createColumn({
                        name: "custrecord_apn",
                        label: "APN"
                    })
                ]
            });
            return customrecord_propertySearchObj;
        }
        const maxCommunicationDate = (allOpeninvoice) => {
            var phonecallSearchObj = search.create({
                type: "phonecall",
                filters: [
                    ["company", "anyof", allOpeninvoice]
                ],
                columns: [
                    search.createColumn({
                        name: "startdate",
                        summary: "MAX",
                        label: "Phone Call Date"
                    }),
                    search.createColumn({
                        name: "company",
                        summary: "GROUP",
                        label: "Company"
                    })
                ]
            });
            let maxCommunicationDates = {};
            let phonecallsearchPage = getSearchResult(phonecallSearchObj);
            phonecallsearchPage.forEach(function (result) {
                maxCommunicationDates[result.getValue(result.columns[1])] = result.getValue(result.columns[0]);
            });
            return maxCommunicationDates;
        }
        const statusSearchObj = (allOpeninvoice) => {
            var propertySearchObj = search.create({
                type: "customrecord_property",
                filters: [
                    ["custrecord4", "is", "YES"], 'AND',
                    ["custrecord_property_estate", "anyof", allOpeninvoice],
                    "AND",
                    ["custrecord_sold", "is", "F"], 'AND',
                    ["custrecord_property_percent_owned", "greaterthan", "0"]
                ],
                columns: [
                    search.createColumn({
                        name: "name",
                        label: "Property Name"
                    }),

                    search.createColumn({
                        name: "custrecord_property_estate",
                        label: "ESTATE"
                    }),
                    search.createColumn({
                        name: "custrecord_property_percent_owned",
                        label: "% OWNED"
                    }),
                    search.createColumn({
                        name: "custrecord_escrow",
                        label: "Escrow",
                        sort: search.Sort.DESC,
                    }),
                    search.createColumn({
                        name: "custrecord_dot",
                        label: "DOT(Deed of Trust)",
                        sort: search.Sort.ASC,
                    }),
                    search.createColumn({
                        name: "custrecord4",
                        sort: search.Sort.ASC,
                        label: "Preforeclosure Status"
                    }),
                    search.createColumn({
                        name: "custrecord_preforeclosure_status",
                        label: "Preforeclosure Override"
                    }),
                    search.createColumn({
                        name: "custrecord_estimatedvalue",
                        label: "Estimated RP Value"
                    }),
                    search.createColumn({
                        name: "custrecord_event_type",
                        label: "Listing Status"
                    }),
                    search.createColumn({
                        name: "custrecord_event_type_new",
                        label: "Listing Override"
                    }),
                    search.createColumn({
                        name: "custrecord_last_sale_date_attom",
                        // sort: search.Sort.DESC,
                        label: "Last Sale Date"
                    }),
                    search.createColumn({
                        name: "custrecord_auction_date",
                        label: "Auction Date"
                    }),
                    search.createColumn({
                        name: "custrecord_foreclosure_event_date",
                        label: "Foreclosure Event Date"
                    }),
                    search.createColumn({
                        name: "custrecord_default_amount",
                        label: "Default Amount"
                    }),
                    search.createColumn({
                        name: "custrecord_last_sale_valueamount",
                        label: "Last Event Type Amount"
                    }),
                    search.createColumn({
                        name: "custrecord_event_effective_date",
                        label: "Event Effective Date"
                    }),
                    search.createColumn({
                        name: "custrecord_saleamount",
                        label: "Sale Amount"
                    }),
                    search.createColumn({
                        name: "custrecord_est_mortage_amt_attom",
                        label: "Estimated Mortagage Amount"
                    }),
                    search.createColumn({
                        name: "custrecord_est_mortage_amt_last_update",
                        label: "Estimated mortage amount last updated"
                    }),
                    search.createColumn({
                        name: "custrecord_owner_name",
                        label: "Owner Name"
                    }),
                    search.createColumn({
                        name: "custrecord_attom_address",
                        label: "Attom address"
                    }),
                    search.createColumn({
                        name: "custrecord_property_type",
                        label: "Property Type"
                    }),
                    search.createColumn({
                        name: "custrecord_apn",
                        label: "APN"
                    }),
                ]
            });
            return propertySearchObj;
        }
        const  dotSearchObj=(allOpeninvoice)=>{
            var propertySearchObj = search.create({
                type: "customrecord_property",
                filters: [
                    ["custrecord_property_estate", "anyof", allOpeninvoice],
                    "AND",
                    ["custrecord_dot", "anyof", 1]
                ],
                columns: [
                    search.createColumn({
                        name: "name",
                        label: "Property Name",
                        sort: search.Sort.ASC,
                    }),


                    search.createColumn({
                        name: "custrecord_property_estate",
                        label: "ESTATE"
                    }),
                    search.createColumn({
                        name: "custrecord_dot",
                        label: "DOT(Deed of Trust)",
                        sort: search.Sort.ASC,
                    })
                ]
            });
            return propertySearchObj;
        }
        const sendEmail = (emailtxt, newfile) => {
            let userObj = runtime.getCurrentUser();
            let senderId = parseInt(userObj.id);
            let subject = 'Property List As of';
            let body = "Please open the attached file to view your Property List.";
            if (emailtxt) {
                email.send({
                    author: 1090342,
                    recipients: emailtxt,
                    subject: subject,
                    body: body,
                    attachments: newfile,
                    relatedRecords: {
                        entityId: senderId,
                    }
                });
            }
        }

        function getLastWeek() {
            var today = new Date();
            var lastWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 14);
            return lastWeek;
        }

        function drawForm() {
            var form=ui.createForm({title:'Open Invoice Property'});
            form.addButton({id : 'csv1download',
							label   : "CSV Status Change Past Month",
							functionName: 'csv1download();'});
            form.addButton({id : 'csv2download',
							label   : "CSV Preforeclosure Status",
							functionName: 'csv2download();'});
            form.addButton({id : 'csv3download',
							label   : "CSV DOT Report",
							functionName: 'csv3download();'});
            form.clientScriptModulePath='SuiteScripts/cs-display-open-invoice-property.js';
            form.addTab({id:'tab1', label:'Status Change Within Past Month'});
            form.addTab({id:'tab2', label:'Preforeclosure Status'});
            form.addTab({id:'tab3', label:'DOT REPORT'});
            var sublist1=form.addSublist({id:'sublist1', label:'Status Change Within Past Month', tab:'tab1', type:'list'});
            var sublist2=form.addSublist({id:'sublist2', label:'Preforeclosure Status', tab:'tab2', type:'list'});
            var sublist3=form.addSublist({id:'sublist3', label:'DOT REPORT', tab:'tab3', type:'list'});
            var data=execute();
            sublist1.addField({label:'Property Name', id:'a', type:'text'});
            sublist1.addField({label:'Property Id', id:'b', type:'text'});
            sublist1.addField({label:'Estate', id:'c', type:'text'});
            sublist1.addField({label:'Total Invoice Amount', id:'d', type:'text'});
            sublist1.addField({label:'Last Communication Date', id:'e', type:'text'});
            sublist1.addField({label:'% Owned', id:'f', type:'text'});
            sublist1.addField({label:'Escrow', id:'g', type:'text'});
            sublist1.addField({label:'DOT (Deed Of Trust)', id:'h', type:'text'});
            sublist1.addField({label:'Listing Status', id:'i', type:'text'});
            sublist1.addField({label:'Last Event Type Amount', id:'j', type:'text'});
            sublist1.addField({label:'Value', id:'k', type:'text'});
            sublist1.addField({label:'Event Effective Date', id:'l', type:'text'});
            sublist1.addField({label:'Last Sale Date', id:'m', type:'text'});
            sublist1.addField({label:'Sale Amount', id:'n', type:'text'});
            sublist1.addField({label:'Estimated RP Value', id:'o', type:'text'});
            sublist1.addField({label:'Default Amount', id:'p', type:'text'});
            sublist1.addField({label:'Estimated Mortgage Amount', id:'q', type:'text'});
            sublist1.addField({label:'Estimated Mortgage Amount Last Updated', id:'r', type:'text'});
            sublist1.addField({label:'Preforeclosure Status', id:'s', type:'text'});
            sublist1.addField({label:'Auction Date', id:'t', type:'text'});
            sublist1.addField({label:'Foreclosure Event Date', id:'u', type:'text'});
            sublist1.addField({label:'Owner Name', id:'v', type:'text'});
            sublist1.addField({label:'Property Type', id:'w', type:'text'});
            sublist1.addField({label:'APN', id:'x', type:'text'});

            var csv1=data['Status Change within past month'].replace(/\n",/g,'",');
//          return csv1;
          log.debug({title:'csvdata', details:csv1});
            var rows=csv1.replace(/\r/g,'').split('\n');
            for(var line=1; line<rows.length; line++) {
                var row=rows[line];
//              log.debug({title:'row '+line, details:row});
                fields=row.replace(/"/g,'').split(',');
                for(i=0;i<fields.length; i++) {
//              log.debug({title:'fields['+i+']', details:JSON.stringify(fields[i])});
                    var id=String.fromCharCode(97+i);
//                    log.debug({title:'line:'+line+'; id:'+id+'; value:--'+fields[i]+'--'});
                    sublist1.setSublistValue({id:id, line:line-1, value:fields[i]||' '});
                }
            }
//            form.addButton({id:'downloadcsv1', label:"CSV", functionName:'csvdownload();', tab:'tab1'});

            sublist2.addField({label:'Property Name', id:'a', type:'text'});
            sublist2.addField({label:'Property Id', id:'b', type:'text'});
            sublist2.addField({label:'Estate', id:'c', type:'text'});
            sublist2.addField({label:'Customer', id:'d', type:'text'});
            sublist2.addField({label:'Invoice Number', id:'e', type:'text'});
            sublist2.addField({label:'Invoice Date', id:'f', type:'text'});
            sublist2.addField({label:'Total Invoice Amount', id:'g', type:'text'});
            sublist2.addField({label:'% Owned', id:'h', type:'text'});
            sublist2.addField({label:'Preforeclosure Status', id:'i', type:'text'});
            sublist2.addField({label:'Estimated Amount', id:'j', type:'text'});
            sublist2.addField({label:'Listing Status', id:'k', type:'text'});
            sublist2.addField({label:'Last Event Type Amount', id:'l', type:'text'});
            sublist2.addField({label:'Event Effective Date', id:'m', type:'text'});
            sublist2.addField({label:'Sale Amount', id:'n', type:'text'});
            sublist2.addField({label:'Last Sale Date', id:'o', type:'text'});
            sublist2.addField({label:'Estimated Mortgage Amount', id:'p', type:'text'});
            sublist2.addField({label:'Estimated Mortgage Amount Last Updated', id:'q', type:'text'});
            sublist2.addField({label:'Auction Date', id:'r', type:'text'});
            sublist2.addField({label:'Attom Address', id:'s', type:'text'});
            sublist2.addField({label:'Owner Name', id:'t', type:'text'});
            sublist2.addField({label:'Property Type', id:'u', type:'text'});
            sublist2.addField({label:'APN', id:'v', type:'text'});
            sublist2.addField({label:'Foreclosure Event Date', id:'w', type:'text'});

            var csv2=data['Preforeclosure Status'];
            var rows=csv2.replace(/\r/g,'').split('\n');
            for(var line=1; line<rows.length; line++) {
                var row=rows[line];
                fields=row.replace(/"/g,'').split(',');
                for(i=0;i<fields.length; i++) {
                    var id=String.fromCharCode(97+i);
//                    log.debug({title:'line:'+line+'; id:'+id+'; value:'+fields[i]||' '});
                    sublist2.setSublistValue({id:id, line:line-1, value:fields[i]||' '});
                }
            }


            sublist3.addField({label:'Property Name', id:'a', type:'text'});
            sublist3.addField({label:'Estate', id:'b', type:'text'});
            sublist3.addField({label:'Total Invoice Amount', id:'c', type:'text'});
            sublist3.addField({label:'Last Communication Date', id:'d', type:'text'});
            sublist3.addField({label:'DOT (Deed Of Trust)', id:'e', type:'text'});

            var csv3=data['DOT REPORT'];
            var rows=csv3.replace(/\r/g,'').split('\n');
            for(var line=1; line<rows.length; line++) {
                var row=rows[line];
                fields=row.replace(/"/g,'').split(',');
                for(i=0;i<fields.length; i++) {
                    var id=String.fromCharCode(97+i);
//                    log.debug({title:'line:'+line+'; id:'+id+'; value:'+fields[i]||' '});
                    sublist3.setSublistValue({id:id, line:line-1, value:fields[i]||' '});
                }
            }

          
          

//            return data;
            return form;
        }
        function onRequest(context) {
            var form=drawForm();
            context.response.writePage(form);
//          context.response.writeLine(form);
            return true;
        }
        return {
            onRequest:onRequest
        }
    });
