/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */

define(['N/record', 'N/file', 'N/email', 'N/runtime', 'N/search', 'N/format'],
   /**
    * @param{email} email
    * @param{file} file
    * @param{https} https
    * @param{runtime} runtime
    * @param{search} search
    */
   (record, file, email, runtime, search, format) => {
      /**
       * Defines the Scheduled script trigger point.
       * @param {Object} scriptContext
       * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
       * @since 2015.2
       */
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
               column.push( search.createColumn({
                  name: "custentity_sales_rep",
                  join: "customer",
                  label: "Sales Rep",
                  summary: "GROUP",
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
                        'Amount': result.getValue(result.columns[4]),
                        'salesrep':result.getText(result.columns[5])
               }
               openinvoies_pastmonth[estate] = {
                        'Amount': result.getValue(result.columns[4]),
						'salesrep':result.getText(result.columns[5])
               }
               // invoiceTotal1.push({estate:result.getValue( result.columns[ 4 ] )});
               if (invoiceTotal1.hasOwnProperty(estate)) {
                  invoiceTotal1[estate] += Number(amount);
               } else {
                  invoiceTotal1[estate] = Number(amount);
               }
            });


                log.debug('openinvoies', openinvoies)
                /**/if (allOpeninvoice.length > 0) {

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
                }/**/
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
                column1.push( search.createColumn({
                  name: "custentity_sales_rep",
                  join: "customer",
                  label: "Sales Rep",
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
                        'Amount': result.getValue(result.columns[4]),
                        'salesrep': result.getText(result.columns[5])
                    }
                    if (invoiceTotal.hasOwnProperty(estate)) {
                        invoiceTotal[estate] += Number(amount);
                    } else {
                        invoiceTotal[estate] = Number(amount);
                    }
                });
                log.debug('lastweekInv', lastweekInv);
              /*if (lastweekinvoice.length > 0) {
                    let csvString = geratecsv(lastweekinvoice, 'lastestate', lastweekInv, invoiceTotal1);
                    let filename = 'New Estates.csv';
                    let fileObj = file.create({
                        name: filename,
                        fileType: file.Type.CSV,
                        folder: -15,
                        contents: csvString.replace('"', '')
                    });
                    attachmentsList.push(fileObj);
                    log.debug('fileObj', fileObj.save());
                }*/
               
                let effectivedateResult = effectivedateSearchObj(allOpeninvoice)
                var searchResultCount = effectivedateResult.runPaged().count;
                log.debug('effectivedateResult', searchResultCount)
                if (searchResultCount > 0) {
                   let maxCommunicationDates = maxCommunicationDate(allOpeninvoice);
                 log.debug('maxCommunicationDates',maxCommunicationDates);
               //let csvString = geratecsv( effectivedateResult, 'event', openinvoies ,invoiceTotal);   // Commented on 21/03
                    let csvString = geratecsv(effectivedateResult, 'event', openinvoies_pastmonth, invoiceTotal1,maxCommunicationDates);
               let filename = 'Status Change within past month.csv';
               let fileObj = file.create({
                  name: filename,
                  fileType: file.Type.CSV,
                  folder: -15,
                  contents: csvString.replace('"', '')
               });
               attachmentsList.push(fileObj);
               log.debug('fileObj', fileObj.save());
            }
                let statusSearchObjResult = statusSearchObj(allOpeninvoice);
            var searchResultCount1 = statusSearchObjResult.runPaged().count;
            log.debug('statusSearchObjResult', searchResultCount1)
            if (searchResultCount1 > 0) {
                   let maxCommunicationDates = maxCommunicationDate(allOpeninvoice);
                 log.debug('maxCommunicationDates',maxCommunicationDates);
                    let csvString = geratecsv(statusSearchObjResult, 'status', openinvoies, invoiceTotal1,maxCommunicationDates);
                    let filename = 'Preforeclosure Status.csv';
                    let fileObj = file.create({
                        name: filename,
                        fileType: file.Type.CSV,
                        folder: -15,
                        contents: csvString .replace('"', '')
                    });
                    attachmentsList.push(fileObj);
                    log.debug('fileObj', fileObj.save());
                }
               let dotSearchObjResult = dotSearchObj(allOpeninvoice);
                var searchResultCount2 = dotSearchObjResult.runPaged().count;
                log.debug('statusSearchObjResult', searchResultCount2)
                if (searchResultCount2 > 0) {
                  let maxCommunicationDates = maxCommunicationDate(allOpeninvoice);
                    let csvString = geratecsv(dotSearchObjResult, 'dot', openinvoies, invoiceTotal1,maxCommunicationDates);
                    let filename = 'DOT REPORT.csv';
                    let fileObj = file.create({
                        name: filename,
                        fileType: file.Type.CSV,
                        folder: -15,
                        contents: csvString .replace('"', '')
                    });
                    attachmentsList.push(fileObj);
                    log.debug('fileObj', fileObj.save());
                }
                //let emailtxt = 'rmontoya@probateadvance.com'
                let emailtxt =['rmontoya@probateadvance.com','akononenko@probateadvance.com','stephanie@probateadvance.com','jstawski@probateadvance.com','jeremy@probateadvance.com','dwinkiel@oasisfinancial.com','adam@probateadvance.com']
                if (attachmentsList.length > 0) {
                    sendEmail(emailtxt, attachmentsList)
                }


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
                                    cells[line] = searchValue.toString().replace(/,/g, "");//`"${searchValue}"`; 
                                    line++;
                                }
                                var estate = result.getValue(columns[y]);
                                var dataObj = lastweekInv[estate];
                                var invamount = invoiceTotal[estate];
                                if (action == 'status') {
                                   var commdate =maxCommunicationDates[estate];
                                    if (dataObj) {
                                       cells[line] = searchValue.toString().replace(/,/g, "");
                                        line++;
                                        cells[line] = invamount;
                                        line++;
                                        cells[line] = commdate;
                                        line++;
                                      cells[line] = dataObj['salesrep'];
                                        line++;
                                    } else {
                                        for (var i = 0; i < 4; i++) {
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
											if (prop == 'salesrep') {
                                                cells[line] = dataObj[prop];
                                              line++;
                                            } 
                                        }
                                     var commdate =maxCommunicationDates[estate];
                                      cells[line] = commdate;
                                        line++;
                                    } else {
                                        for (var i = 0; i < 3; i++) {
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
                                            } if(prop == 'salesrep'){
												cells[line] = dataObj[prop];
                                              line++;
											}
                                        }
                                    } else {
                                        for (var i = 0; i < 3; i++) {
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
                                            cells[line] = dataObj[prop].toString().replace(/,/g, "");
                                            }
                                            line++;
                                        }
                                    } else {
                                        for (var i = 0; i < 5; i++) {
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
                               searchValue = searchValue.toString().replace(/,/g, "");

                        searchValue = (searchValue).toString().replace(/"/g, "");
                        if (searchValue.indexOf('+') == 0 || searchValue.indexOf('-') == 0) {
                           searchValue = " " + searchValue;
                        }

                        cells[line] = searchValue;
                        line++;
                     }
                  }
               }
                    csvLine = cells.join('"\,"');
                    lines.push(csvLine);
                    csvdata = lines.join('"\n"');
                }
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
                         columnNames.push('Sales Rep');
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
                        columnNames.push('Sales Rep');
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
                        columnNames.push('Sales Rep');

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
                        columnNames.push('Sales Rep')
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
                      name: "custentity_sales_rep",
                     join: "CUSTRECORD_PROPERTY_ESTATE",
                     label: "Sales Rep"
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
                    author: 2299863,
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
        return {
            execute
        }
    });

function getLastWeek() {
    var today = new Date();
    var lastWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 14);
    return lastWeek;
}