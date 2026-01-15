/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 *
 */
var PAGE_SIZE = 1000;
let openinvoies = {}
let invoiceTotal1 = {};
define(['N/file', 'N/format', 'N/https', 'N/runtime', 'N/search', 'N/ui/serverWidget', 'N/url'],
		(file, format, https, runtime, search, serverWidget, url) => {
			const onRequest = (context) => {
				try {
					if (context.request.method == 'GET') {
						var subsidiary = context.request.parameters.subsidiary;
						var formObj = serverWidget.createForm({
							title: 'New Estate'
						});
						var filename = 'cs_open_property.js';
						var fileId = getfileId(filename);
						formObj.clientScriptFileId = fileId;
						var fieldgroup = formObj.addFieldGroup({
							id: 'custpage_fieldgroup',
							label: ' '
						});
						formObj.addSubtab({
							id: 'custpage_subtab1',
							label: 'Property DETAILS'
						});

						var sublist = formObj.addSublist({
							id: 'custpage_sublistid',
							type: serverWidget.SublistType.LIST,
							label: 'Property DETAILS',
							tab: 'custpage_subtab1'
						});
                        sublist.addField({
							id: 'custpage_property',
							type: serverWidget.FieldType.TEXT,
							label: 'Property Name'
						});
                        sublist.addField({
							id: 'custpage_internalid',
							type: serverWidget.FieldType.TEXT,
							label: 'Property Id'
						});
                        
                      sublist.addField({
							id: 'custpage_estate_name',
							type: serverWidget.FieldType.TEXT,
							label: 'ESTATE name'
						});		
                        sublist.addField({
                            id: "custpage_customer",
                            type: serverWidget.FieldType.TEXT,
                            label: "Customer"
                        })	
                        sublist.addField({
                            id: "custpage_documentnumber",
                            type: serverWidget.FieldType.TEXT,
                            label: "Invoice Number"
                        })
                        sublist.addField({
                            id: "custpage_invoicedatee",
                            type: serverWidget.FieldType.TEXT,
                            label: "invoice date"
                        })		
                        sublist.addField({
                            id: "custpage_amount",
                            type: serverWidget.FieldType.TEXT,
                            label: 'Total Invoice Amount'
                        })		
                        sublist.addField({
							id: 'custpage_property_percent_owned',
							type: serverWidget.FieldType.TEXT,
							label: '% OWNED'
						});
                     		
						sublist.addField({
							id: 'custpage_salesamount',
							type: serverWidget.FieldType.TEXT,
							label: 'Sale Amount'
						});

                        sublist.addField({
                            id: "custpage_property_type",
                            type: serverWidget.FieldType.TEXT,
                            label: "Property Type"
                        });
                        sublist.addField({
                            id: "custpage_estimatedvalue",
                            type: serverWidget.FieldType.TEXT,
                            label: "Estimated RP Value"
                        }),
                        sublist.addField({
                            id: "custpage_default_amount",
                            type: serverWidget.FieldType.TEXT,
                            label: "Default Amount"
                        }),
                        sublist.addField({
                            id: "custpage_event_effective_date",
                            type: serverWidget.FieldType.TEXT,
                            label: "Event Effective Date"
                        }),
    
                        sublist.addField({
                            id: "custpage_event_type",
                            type: serverWidget.FieldType.TEXT,
                            label: "Listing Status"
                        }),
                        sublist.addField({
                            id: "custpage_last_sale_valueamount",
                            type: serverWidget.FieldType.TEXT,
                            label: "Last Event Type Amount"
                        }),
                        sublist.addField({
                            id: "custpage_est_mortage_amt_attom",
                            type: serverWidget.FieldType.TEXT,
                            label: "Estimated Mortagage Amount"
                        }),
                        sublist.addField({
                            id: "custpage_est_mortage_amt_last_update",
                            type: serverWidget.FieldType.TEXT,
                            label: "Estimated mortage amount last updated"
                        }),
                        sublist.addField({
                            id: "custpage_custrecord4",
                            type: serverWidget.FieldType.TEXT,
                            label: "Preforeclosure Status"
                        }),
                        sublist.addField({
                            id: "custpage_auction_date",
                            type: serverWidget.FieldType.TEXT,
                            label: "Auction Date"
                        }),
                        sublist.addField({
                            id: "custpage_foreclosure_event_date",
                            type: serverWidget.FieldType.TEXT,
                            label: "Foreclosure Event Date"
                        })
						
						formObj.addButton({id : 'custpage_renewal_all',
							label   : "CSV",
							functionName: 'newestatecsvdownload();'});

						var retrieveSearch = returnSearchObject(sub,PAGE_SIZE);

						var lineIndex=0;
						log.debug('retrieveSearch',retrieveSearch.length)
                      if(retrieveSearch.length>0){
						//for(var j in retrieveSearch)
                        retrieveSearch.forEach(function (result) {
                            let recordId=result.getValue({name:'custrecord_property_estate'});
							var name=result.getText({name:'name'});
							var estate=result.getValue({name:'custrecord_property_estate'});
							var estateName=result.getText({name:'custrecord_property_estate'})
							if(estate){
								var output = url.resolveRecord({recordType:'customer',recordId:estate,isEditMode:false});
								var projecname='';
								projecname+='<html>';
								projecname+='<a href='+output+'>'+estateName+'</a></html>';
								sublist.setSublistValue({id : 'custpage_estate' ,line : lineIndex,value :projecname});
                                sublist.setSublistValue({id : 'custpage_estate_name' ,line : lineIndex,value :estateName});
							}
                            var invoiceObj=openinvoies[recordId];
                            let invoiceTotal =invoiceTotal1[recordId];
                            if(invoiceObj.customer )
                            sublist.setSublistValue({id : 'custpage_customer' ,line : lineIndex,value :invoiceObj.customer });
                            if(invoiceObj.tranid)
                            sublist.setSublistValue({id : 'custpage_documentnumber' ,line : lineIndex,value :invoiceObj.tranid });
                            if(invoiceObj.date)
                            sublist.setSublistValue({id : 'custpage_invoicedatee' ,line : lineIndex,value :invoiceObj.date });
                            if(invoiceTotal)
                            sublist.setSublistValue({id : 'custpage_amount' ,line : lineIndex,value :invoiceTotal});
                        
                            
								sublist.setSublistValue({id : 'custpage_property' ,line : lineIndex,value :result.getValue({name:'name'}) });
								if(result.id)
								sublist.setSublistValue({id : 'custpage_internalid' ,line : lineIndex,value :result.id });
							
                                if(result.getValue({name:'custrecord_property_percent_owned'}))
								sublist.setSublistValue({id : 'custpage_property_percent_owned' ,line : lineIndex,value :result.getValue({name:'custrecord_property_percent_owned'}) });
							
                                  if(result.getValue({name:'custrecord_saleamount'}))
								sublist.setSublistValue({id : 'custpage_salesamount' ,line : lineIndex,value :result.getValue({name:'custrecord_saleamount'}) });
							
                                if(result.getValue({name:'custrecord_property_type'}))
								sublist.setSublistValue({id : 'custpage_property_type' ,line : lineIndex,value :result.getValue({name:'custrecord_property_type'}) });
							
                                if(result.getValue({name:'custrecord_estimatedvalue'}))
								sublist.setSublistValue({id : 'custpage_estimatedvalue' ,line : lineIndex,value :result.getValue({name:'custrecord_estimatedvalue'}) });
							
                                if(result.getValue({name:'custrecord_default_amount'}))
								sublist.setSublistValue({id : 'custpage_default_amount' ,line : lineIndex,value :result.getValue({name:'custrecord_default_amount'}) });
							
                                if(result.getValue({name:'custrecord_event_effective_date'}))
								sublist.setSublistValue({id : 'custpage_event_effective_date' ,line : lineIndex,value :result.getValue({name:'custrecord_event_effective_date'}) });
							
                                if(result.getValue({name:'custrecord_event_type'}))
								sublist.setSublistValue({id : 'custpage_event_type' ,line : lineIndex,value :result.getValue({name:'custrecord_event_type'}) });
						
                                if(result.getValue({name:'custrecord_last_sale_valueamount'}))
								sublist.setSublistValue({id : 'custpage_last_sale_valueamount' ,line : lineIndex,value :result.getValue({name:'custrecord_last_sale_valueamount'}) });
							
                                if(result.getValue({name:'custrecord_est_mortage_amt_attom'}))
								sublist.setSublistValue({id : 'custpage_est_mortage_amt_attom' ,line : lineIndex,value :result.getValue({name:'custrecord_est_mortage_amt_attom'}) });
                                if(result.getValue({name:'custrecord4'}))
								sublist.setSublistValue({id : 'custpage_custrecord4' ,line : lineIndex,value :result.getValue({name:'custrecord4'}) });
                                if(result.getValue({name:'custrecord_est_mortage_amt_last_update'}))
								sublist.setSublistValue({id : 'custpage_est_mortage_amt_last_update' ,line : lineIndex,value :result.getValue(result.getValue({name:'custrecord_est_mortage_amt_last_update'})) });
                                if(result.getValue({name:'custrecord_auction_date'}))
								sublist.setSublistValue({id : 'custpage_auction_date' ,line : lineIndex,value :result.getValue({name:'custrecord_auction_date'}) });
                                if(result.getValue({name:'custrecord_foreclosure_event_date'}))
								sublist.setSublistValue({id : 'custpage_foreclosure_event_date' ,line : lineIndex,value :result.getValue({name:'custrecord_foreclosure_event_date'}) });
							//*/
							lineIndex++;

						});
                      }
						context.response.writePage({
							pageObject: formObj
						});

					} else {
						var sub = context.request.parameters.custpage_subsid;
						//LOGIC TO GET DYNAMIC URL STARTS
						var scheme = 'https://';
						//method works for specific account
						var host = url.resolveDomain({
							hostType: url.HostType.APPLICATION
						});
						var link = url.resolveScript({
							scriptId: 'customscript_sl_open_property_report',
							deploymentId: 'customdeploy_sl_open_property_report'
						});
						var urlVal = scheme + host + link;
						urlVal += '&subsidiary=' + sub;
						//	LOGIC TO GET DYNAMIC URL ENDS
						var html = '';
						html += '<script>';
						html += 'window.open("' + urlVal + '","_self");</script>';
						context.response.writeLine(html);
					}
				} catch (e) {
					log.error("ERROR IS:", e)
				}
			}

			const	returnSearchObject  = (subsidiary,PAGE_SIZE) => {
				var column = new Array();
				var filter ;
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
				filter=[ ["type", "anyof", "CustInvc"], "AND", ["mainline", "is", "T"], "AND", ["status", "anyof", "CustInvc:A"], 'AND', ["trandate", "within", lastweek, todatDate]];
				var searchObject = search.create({
					type: search.Type.INVOICE,
					columns: column,
					filters: filter
				});
				var pagedData= searchObject.runPaged({
					pageSize: PAGE_SIZE
				});

				return fetchSearchResult(pagedData);
			}
            
			const	fetchSearchResult = (pagedData) => {
				var estates = [];
				var estateJson =[];
				var searchResult;
				pagedData.pageRanges.forEach(function (pageRange) {
					var pageIndex=pageRange.index;
					log.debug('pageIndex',pageIndex);
					var searchPage = pagedData.fetch({
						index: pageIndex
					});
					searchPage.data.forEach(function (result) {
						var estate = result.getValue(result.columns[0]);
						estates.push(estate);
                        let amount=result.getValue(result.columns[4]);
                        openinvoies[estate] = {
                            'customer': result.getText(result.columns[3]),
                            'tranid': result.getValue(result.columns[1]),
                            'date': result.getValue(result.columns[2]),
                            'Amount': result.getValue(result.columns[4])
                        }
                        if (invoiceTotal1.hasOwnProperty(estate)) {
                        invoiceTotal1[estate] += Number(amount);
                    } else {
                        invoiceTotal1[estate] = Number(amount);
                    }
					});
				});
				try {
                  log.debug('estates',estates)
					if(estates&&estates.length>0){
						var propertySearchObj = search.create({
							type: "customrecord_property",
							filters:
								[
								 ["custrecord_property_estate","anyof",estates],
                                 "AND",
                                 ["custrecord_sold", "is", "F"], 'AND',
                                 ["custrecord_property_percent_owned", "greaterthan", "0"]
								 ],
								 columns:
									 [
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
						var propertyresults=getSearchResult(propertySearchObj);
						/*propertyresults.forEach(function (result) {
							var name=result.getValue(result.columns[0]);
							var estate=result.getValue(result.columns[1]);
							var estatename=result.getText(result.columns[1]);
							estateJson.push({
								"name":name,
								"estate":estate,
								"estatename":estatename,
								"col1":result.getValue(result.columns[2]),
								"col2":result.getValue(result.columns[3]),
								"col3":result.getValue(result.columns[4]),
								"col4":result.getValue(result.columns[5]),
								"col5":result.getValue(result.columns[6]),
								"col6":result.getValue(result.columns[7]),
								"col9":result.getValue(result.columns[8]),
								"col10":result.getValue(result.columns[9]),
							
							});
						});*/
						
					}
				} catch (e) {
					log.error("Error is here = ", e);
				}
              var results=propertyresults&&propertyresults.length>0?propertyresults:[];
                log.debug('results',results);
              return results;
			}


			const	getfileId = (clientScript) => {
				//we can make it as function to reuse.
				var search_folder = search.create({
					type: 'folder',
					filters: [{
						name: 'name',
						join: 'file',
						operator: 'is',
						values: clientScript
					}],
					columns: [{
						name: 'internalid',
						join: 'file'
					}]
				});
				var searchFolderId = '';
				var searchFolderName = '';
				search_folder.run().each(function (result) {
					searchFolderId = result.getValue({
						name: 'internalid',
						join: 'file'
					});
					return true;
				});
				return searchFolderId;
			}




			/**
			 * Get the search result
			 */
			var getSearchResult = (pagedDataObj) => {
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
			};
          function getLastWeek() {
    var today = new Date();
    var lastWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 14);
    return lastWeek;
}

			return {
				onRequest
			}

		});