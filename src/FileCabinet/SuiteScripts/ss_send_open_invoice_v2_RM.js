/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */

var d=new Date(); 
var today=d.getFullYear().toString().padStart(4,"0")+(d.getMonth()+1).toString().padStart(2,"0")+d.getDate().toString().padStart(2,"0")+d.getHours().toString().padStart(2,"0")+d.getMinutes().toString().padStart(2,"0")+d.getSeconds().toString().padStart(2,"0");
var savefolder='18150';
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
    log.debug("-BEGIN-");
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
      column.push(search.createColumn({
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
            'salesrep': result.getText(result.columns[5])
          }
          openinvoies_pastmonth[estate] = {
            'Amount': result.getValue(result.columns[4]),
            'salesrep': result.getText(result.columns[5])
          }
          // invoiceTotal1.push({estate:result.getValue( result.columns[ 4 ] )});
          if (invoiceTotal1.hasOwnProperty(estate)) {
            invoiceTotal1[estate] += Number(amount);
          } else {
            invoiceTotal1[estate] = Number(amount);
          }
        });

      log.debug('openinvoies', openinvoies)
      /**/
      if (allOpeninvoice.length > 0) {

        let csvString = geratecsv(allOpeninvoice, 'allprop', openinvoies, invoiceTotal1);
        let filename = 'All Properties-'+today+'.csv';
        let fileObj = file.create({
          name: filename,
          fileType: file.Type.CSV,
          folder: savefolder,
          contents: csvString.replace('"', '')
        });
        attachmentsList.push(fileObj);
        log.debug('fileObj', fileObj.save());
      } /**/
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
      column1.push(search.createColumn({
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
      let filename = 'New Estates-'+today+'.csv';
      let fileObj = file.create({
      name: filename,
      fileType: file.Type.CSV,
      folder: savefolder,
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
        log.debug('maxCommunicationDates', maxCommunicationDates);
        //let csvString = geratecsv( effectivedateResult, 'event', openinvoies ,invoiceTotal);   // Commented on 21/03
        let csvString = geratecsv(effectivedateResult, 'event', openinvoies_pastmonth, invoiceTotal1, maxCommunicationDates);
        let filename = 'Status Change within past month-'+today+'.csv';
        let fileObj = file.create({
          name: filename,
          fileType: file.Type.CSV,
          folder: savefolder,
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
        log.debug('maxCommunicationDates', maxCommunicationDates);
        let csvString = geratecsv(statusSearchObjResult, 'status', openinvoies, invoiceTotal1, maxCommunicationDates);
        let filename = 'Preforeclosure Status-'+today+'.csv';
        let fileObj = file.create({
          name: filename,
          fileType: file.Type.CSV,
          folder: savefolder,
          contents: csvString.replace('"', '')
        });
        attachmentsList.push(fileObj);
        log.debug('fileObj', fileObj.save());
      }
      let dotSearchObjResult = dotSearchObj(allOpeninvoice);
      var searchResultCount2 = dotSearchObjResult.runPaged().count;
      log.debug('statusSearchObjResult', searchResultCount2)
      if (searchResultCount2 > 0) {
        let maxCommunicationDates = maxCommunicationDate(allOpeninvoice);
        let csvString = geratecsv(dotSearchObjResult, 'dot', openinvoies, invoiceTotal1, maxCommunicationDates);
        let filename = 'DOT REPORT-'+today+'.csv';
        let fileObj = file.create({
          name: filename,
          fileType: file.Type.CSV,
          folder: savefolder,
          contents: csvString.replace('"', '')
        });
        attachmentsList.push(fileObj);
        log.debug('fileObj', fileObj.save());
      }

      if (allOpeninvoice.length > 0) {
        var csvvStringg = generateLiensAssignments(allOpeninvoice);
        var filename = 'OpenInvoiceLiensAssignments-'+today+'.csv';
        var fileObj = file.create({
          name: filename,
          fileType: file.Type.CSV,
          folder: savefolder,
          contents: csvvStringg
        });
        attachmentsList.push(fileObj);
        log.debug('openinvoiceliensfileObj', fileObj.save());
      }

      if(allOpeninvoice.length > 0) {
        var csvvStringg = generateEstateAssets(allOpeninvoice);
        var filename = 'OpenEstatesAssetTotals-'+today+'.csv';
        var fileObj = file.create({
          name: filename,
          fileType: file.Type.CSV,
          folder: savefolder,
          contents: csvvStringg
        });
        attachmentsList.push(fileObj);
        log.debug('openestatesfileObj', fileObj.save());
      }

      var scriptobj=runtime.getCurrentScript();
      let emailtxt=scriptobj.getParameter('custscript_recipients').replace(/[,;]/g,' ').split(/\s+/);
//      let emailtxt = 'rmontoya@probateadvance.com';
//      let emailtxt =['rmontoya@probateadvance.com','akononenko@probateadvance.com','stephanie@probateadvance.com','jstawski@probateadvance.com','jeremy@probateadvance.com','dwinkiel@oasisfinancial.com','adam@probateadvance.com', 'kayala@probateadvance.com'];
      log.debug('emailtxt', JSON.stringify(emailtxt));
      if (attachmentsList.length > 0) {
        sendEmail(emailtxt, attachmentsList)
      }

      log.debug("--END--");

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

  const geratecsv = (estates, action, lastweekInv, invoiceTotal, maxCommunicationDates) => {
    try {
      log.debug('action', action)
      let searchObj;
      if (action == 'lastestate') {
        searchObj = getSearchObj(estates);
      } else if (action == 'allprop') {
        searchObj = getSearchObj(estates);
        columns = [
          search.createColumn({
            name: "name",
            label: "Property Name"
          }),
          /**/

          search.createColumn({
            name: "custrecord_property_address",
            label: "Address"
          }),
          search.createColumn({
            name: "custrecord_property_city",
            label: "City"
          }),
          search.createColumn({
            name: "custrecord_property_state",
            label: "State"
          }),
          
          
          /**/
          search.createColumn({
            name: "custrecord_event_type",
            label: "Listing Status"
          }),
          search.createColumn({
            name: "custrecord_property_value",
            label: "Value"
          }),
          search.createColumn({
            name: "custrecord_property_mortgage",
            label: "Mortgage"
          }),
          search.createColumn({
            name: "custrecord_property_percent_owned",
            label: "% Owned"
          }),
          search.createColumn({
            name: "custrecord_property_total",
            label: "Total"
          }),
          search.createColumn({
            name: "custrecord_sold",
            label: "Sold"
          })
        ];
        searchObj.filters.splice(1,1);
        searchObj.columns.splice(0, 1);
        searchObj.columns = columns.concat(searchObj.columns);
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
        } else if (action == 'dot') {
          csvString += getCSVheader3(searchcolumns, action);
        } else {
          csvString += getCSVheader(searchcolumns, action);
        }

        csvString += "\r\n";
        searchResults = getSearchResult(searchObj);
        csvString += getLineString(searchcolumns, searchResults, action, lastweekInv, invoiceTotal, maxCommunicationDates);

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
      log.debug('action status', action);
      log.debug('searchResults status', searchResults.length);
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
                cells[line] = searchValue.toString().replace(/,/g, ""); //`"${searchValue}"`;
                line++;
              }
              var estate = result.getValue(columns[y]);
              var dataObj = lastweekInv[estate];
              var invamount = invoiceTotal[estate];
              if (action == 'status') {
                var commdate = maxCommunicationDates[estate];
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
              } else if (action == 'event') {
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
                  var commdate = maxCommunicationDates[estate];
                  cells[line] = commdate;
                  line++;
                } else {
                  for (var i = 0; i < 3; i++) {
                    cells[line] = '';
                    line++;
                  }
                }
              } else if (action == 'dot') {
                if (dataObj) {
                  for (var prop in dataObj) {
                    if (prop == 'Amount') {
                      cells[line] = invamount;
                      line++;
                      var commdate = maxCommunicationDates[estate];
                      cells[line] = commdate;
                      line++;
                    }
                    if (prop == 'salesrep') {
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
              } else {
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

  const getCSVheader3 = (columns, action) => {
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
          ["custrecord_last_sales_date_new", "within", "thismonth"],
          "OR", ["custrecord_event_effective_date_new", "within", "thismonth"],
          "OR", ["custrecord_event_effective_date_new", "within", "lastmonth"], "OR", ["custrecord_last_sales_date_new", "within", "lastmonth"]
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
  const dotSearchObj = (allOpeninvoice) => {
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
//    let userObj = runtime.getCurrentUser();
//    let senderId = parseInt(userObj.id);
    let senderId = 2410713; // 2299863 - Rudy, 2410713 - ProbateAdvance Reports
    let subject = 'Property List As of';
    let body = "Please open the attached file to view your Property List.";
    if (emailtxt) {
      email.send({
        author: senderId,
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

  function generateLiensAssignments(customers) {
    
    var customers=[];
    var filters=[];
    filters.push(search.createFilter({name:'type', operator:'anyof', values:'CustInvc'}));
    filters.push(search.createFilter({name:'status', operator:'anyof', values:['CustInvc:A']}));
    //filters.push(search.createFilter({name:'sum(amount)', operator:'greaterthan', values:'0.00'});
    var columns=[];
    columns.push(search.createColumn({name:'entity', summary:'group', label:'Name'}));
    var s=search.create({type: "invoice", filters: filters, columns:columns});
    log.audit("customers result count: "+s.runPaged().count);
    var pageddata=s.runPaged({pageSize:1000});
    for(var x in pageddata.pageRanges) {
      pageddata.fetch(x).data.forEach(function(result) {
        customers.push(result.getValue({name:"entity", summary:"group"}));
        return true;
      });
    }
    

    var liensjudgments = {};
    var filters = [];
    filters.push(search.createFilter({
        name: 'custrecord_lein_judgement_customer',
        operator: 'anyof',
        values: customers
      }));
    var columns = [];
    columns.push(search.createColumn({
        name: "custrecord_lein_judgement_customer",
        summary: "group",
        label: "Internal ID"
      }));
    columns.push(search.createColumn({
        name: "custrecord_lein_judgement_amount",
        summary: "SUM",
        label: "Amount"
      }));
    var s = search.create({
      type: "customrecord_lein_judgement",
      filters: filters,
      columns: columns
    });
    log.audit("liens+judgments result count: "+s.runPaged().count);
    s.run().each(function (result) {
      liensjudgments[result.getText({
          name: "internalid",
          join: 'custrecord_lein_judgement_customer',
          summary: "group"
        })] = result.getValue({
          name: "custrecord_lein_judgement_amount",
          summary: "sum"
        });
      return true;
    });
    log.audit("liens+judgments", JSON.stringify(liensjudgments));
    
    var assignments = {};
    var filters = [];
    filters.push(search.createFilter({
        name: "internalid",
        join: "custrecord_existing_assignment_customer",
        operator: "anyof",
        values: customers
      }));
    var columns = [];
    columns.push(search.createColumn({
        name: "internalid",
        join: "custrecord_existing_assignment_customer",
        summary: "group",
        label: "Customer Internal ID"
      }));
    columns.push(search.createColumn({
        name: "custrecord_existing_assignment_amount",
        summary: "sum",
        label: "Amount"
      }));
    var s = search.create({
      type: "customrecord_existing_assignment",
      filters: filters,
      columns: columns
    });
    log.audit("assignments result count: "+s.runPaged().count);
    s.run().each(function (result) {
      assignments[result.getText({
          name: "internalid",
          join: "custrecord_existing_assignment_customer",
          summary: "group"
        })] = result.getValue({
          name: "custrecord_existing_assignment_amount",
          summary: "sum"
        });
      return true;
    });
    log.audit("assignments", JSON.stringify(assignments));

    var filters = [];
    filters.push(search.createFilter({
        name: 'internalid',
        operator: 'anyof',
        values: customers
      }));
    var columns = [];
    columns.push(search.createColumn({
        name: 'internalid',
        label: "Internal ID"
      }));
    columns.push(search.createColumn({
         name: "firstname",
         label: "First Name"
      }));
    columns.push(search.createColumn({
         name: "lastname",
         label: "Last Name"
      }));
    columns.push(search.createColumn({
         name: "parent",
         label: "Decedent Name"
      }));
    columns.push(search.createColumn({
        name: 'custentity_percent_estate_due_to_custome',
        label: 'Estate % Due To Customer'
      }));
    columns.push(search.createColumn({
        name: 'custentity_specific_bequest_due_to_cust',
        label: 'Bequest Due To Customer'
      }));
    var s = search.create({
      type: 'customer',
      filters: filters,
      columns: columns
    });
    var csvlines = [];
    var csvheader = ["First Name", "Last Name", "Decedent Name", "Estate % Due To Customer", "Bequest Due To Customer", "Liens And Judgments", "Existing Assignments"];
    csvlines.push('"' + csvheader.join('","') + '"');
    var rc=s.runPaged().count;
    if(rc) {
      var pageindex=0;
      var pageddata=s.runPaged({pageSize:1000});
      do {
        var page=pageddata.fetch(pageindex++);
        page.data.forEach(function(result){
          var intid = result.getValue("internalid");
          var csvdata = [];
          csvdata.push((result.getValue("firstname")||' ').replace(/,/g, " "));
          csvdata.push((result.getValue("lastname")||' ').replace(/,/g, " "));
          csvdata.push((result.getText("parent")||' ').replace(/,/g, " "));
          csvdata.push((result.getValue("custentity_percent_estate_due_to_custome")).replace(/,/g, " "));
          csvdata.push((result.getValue("custentity_specific_bequest_due_to_cust")).replace(/,/g, " "));
          if (typeof(liensjudgments) != 'undefined' && liensjudgments.hasOwnProperty(intid)) {
            csvdata.push(liensjudgments[intid]);
          } else {
            csvdata.push("");
          }
          if (typeof(assignments) != 'undefined' && assignments.hasOwnProperty(intid)) {
            csvdata.push(assignments[intid]);
          } else {
            csvdata.push("");
          }
          csvlines.push('"' + csvdata.join('","') + '"');
          return true;
        });
      } while(!page.isLast);
    }
    var csvstring = csvlines.join("\r\n");
    log.audit("csvstring", csvstring);
    return csvstring;
  }

  function generateEstateAssets(estates) {
    var properties={};
    var filters=[];
    filters.push(search.createFilter({name:"custrecord_property_estate", operator:"anyof", values:estates}));
    var columns=[];
    columns.push(search.createColumn({name:"custrecord_property_estate", sort: search.Sort.ASC, label: "Internal ID"}));
    columns.push(search.createColumn({name:"custrecord_property_value", label: "Property Value"}));
    columns.push(search.createColumn({name:"custrecord_property_percent_owned", label: "Property % Owned"}));
    columns.push(search.createColumn({name:"custrecord_property_mortgage", label: "Mortgage Amount"}));
    var s=search.create({type: "customrecord_property", filters:filters, columns:columns});
    var rc=s.runPaged().count;
    if(rc){
      var pageddata=s.runPaged({pageSize:1000});
      var pageindex=0;
      do {
        page=pageddata.fetch(pageindex++);
        page.data.forEach(function(result){
          var key=result.getValue({name:"custrecord_property_estate"});
          var value1=parseFloat(result.getValue({name:"custrecord_property_value"}))||0;
          var temp=parseFloat(result.getValue({name:"custrecord_property_percent_owned"}));
          var value2=isNaN(temp) ? 1 : temp/100;
          var value3=parseFloat(result.getValue({name:"custrecord_property_mortgage"}))||0;
          var value=value2*(value1-value3);
          if(properties.hasOwnProperty(key)){
            properties[key]=parseInt(properties[key])+parseInt(value);
          } else {
            properties[key]=parseInt(value);
          }
          return true;
        });
      } while(!page.isLast);
    }

    var assets={};
    var filters=[];
    filters.push(search.createFilter({name:"custrecord_asset_estate", operator:"anyof", values:estates}));
    columns=[];
    columns.push(search.createColumn({name:"custrecord_asset_estate", summary:"group", sort: search.Sort.ASC, label: "Estate Internal ID"}));
    columns.push(search.createColumn({name: "custrecord_asset_value", summary:"sum", label: "Asset Value"}));
    var s=search.create({type:"customrecord_asset", filters:filters, columns:columns});
    var rc=s.runPaged().count;
    if(rc) {
      pageindex=0;
      var pageddata=s.runPaged({pageSize:1000});
      do {
          page=pageddata.fetch(pageindex++);
          page.data.forEach(function(result){
            assets[result.getValue({name:"custrecord_asset_estate", summary:"group"})]=result.getValue({name:"custrecord_asset_value", summary:"sum"});
            return true;
          });
      } while(!page.isLast);
    }

    var claims={};
    var filters=[];
    filters.push(search.createFilter({name:"custrecord_claim_estate", operator:"anyof", values:estates}));
    columns=[];
    columns.push(search.createColumn({name:"custrecord_claim_estate", summary:"group", sort: search.Sort.ASC, label: "Estate Internal ID"}));
    columns.push(search.createColumn({name: "custrecord_claim_value", summary:"sum", label: "Claim Value"}));
    var s=search.create({type:"customrecord_claim", filters:filters, columns:columns});
    var rc=s.runPaged().count;
    if(rc) {
      pageindex=0;
      var pageddata=s.runPaged({pageSize:1000});
      do {
          page=pageddata.fetch(pageindex++);
          page.data.forEach(function(result){
            claims[result.getValue({name:"custrecord_claim_estate", summary:"group"})]=result.getValue({name:"custrecord_claim_value", summary:"sum"});
            return true;
          });
      } while(!page.isLast);
    }

    var bequests={};
    var filters=[];
    filters.push(search.createFilter({name:"internalid", operator:"anyof", values:estates}));
    filters.push(search.createFilter({name:"custentity_specific_bequests_due_to_heir", operator:"isnotempty"}));
    columns=[];
    columns.push(search.createColumn({name:"internalid", summary:"group", sort: search.Sort.ASC, label: "Bequest Estate"}));
    columns.push(search.createColumn({name: "custentity_specific_bequests_due_to_heir", summary:"sum", label: "Bequest Value"}));
    var s=search.create({type:"customer", filters:filters, columns:columns});
    var rc=s.runPaged().count;
    if(rc) {
      pageindex=0;
      var pageddata=s.runPaged({pageSize:1000});
      do {
          page=pageddata.fetch(pageindex++);
          page.data.forEach(function(result){
            bequests[result.getValue({name:"internalid", summary:"group"})]=result.getValue({name:"custentity_specific_bequests_due_to_heir", summary:"sum"});
            return true;
          });
      } while(!page.isLast);
    }
  
      //var closingcosts={}; // 6% of owned property value
      
      //var attorneyfees={}; // greater of 3000 or 6% of property + assets value
      
      //var netequity={}; // properties + assets - claims - bequests - closing - attorney fees

      estatevalues={};
      var filters=[];
      filters.push(search.createFilter({name:"internalid", operator:"anyof", values:estates}));
      columns=[];
      columns.push(search.createColumn({name: "internalid", sort: search.Sort.ASC, label: "Internal ID"}));
      columns.push(search.createColumn({name: "entityid", label: "Estate ID"}));
      columns.push(search.createColumn({name: "altname", label: "Estate Name"}));
      var s=search.create({type: "customer", filters:filters, columns:columns});
      var rc=s.runPaged().count;
      if(rc) {
          pageindex=0;
          var pageddata=s.runPaged({pageSize:1000});
          do {
              page=pageddata.fetch(pageindex++);
              page.data.forEach(function(result){
                var intid=result.getValue({name:"internalid"});
                var estate={};
                estate.estate=result.getValue({name:"entityid"})+' '+result.getValue({name:"altname"});
                estate.property=parseInt(properties[intid])||0;
                estate.assets=parseInt(assets[intid])||0;
                estate.claims=parseInt(claims[intid])||0;
                estate.bequests=parseInt(bequests[intid])||0;
                estate.closing=parseInt(estate.property*0.06);
                var temp=parseInt((estate.property+estate.assets)*0.06);
                estate.attorneyfees=temp>3000?temp:3000;
                estate.netequity=parseInt(estate.property+estate.assets-estate.claims-estate.bequests-estate.closing-estate.attorneyfees);
                estatevalues[intid]=estate;
                return true;
              });
          } while(!page.isLast);
          var csvlines=[];
          var csvheader=['Estate', 'Total Value Of Real Property', 'Total Assets', 'Total Claims', 'Specific Bequest To Heirs', 'Real Estate Closing Costs', 'Attorney Fees', 'Net Equity Value Of Estate'];
          csvlines.push('"' + csvheader.join('","') + '"');
          for(var i=0; i<Object.keys(estatevalues).length; i++) {
            csvlines.push('"'+Object.values(estatevalues[Object.keys(estatevalues)[i]]).join('","')+'"');
          }
          csvdata=csvlines.join('\r\n');
          return csvdata;
      } else {
        return false;
      }
  }
      
  function getLastWeek() {
    var today = new Date();
    var lastWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 14);
    return lastWeek;
  }

  return {
    execute
  }

});
