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
						title: 'Customers with Problem case and Blocked Account Letter'
					});
					let filename = 'cs_open_property.js';
					let fileId = getfileId(filename);
					formObj.clientScriptFileId = fileId;
					var fieldgroup = formObj.addFieldGroup({
						id: 'custpage_fieldgroup',
						label: ' '
					});
					formObj.addSubtab({
						id: 'custpage_subtab1',
						label: 'Estate DETAILS'
					});

					var sublist = formObj.addSublist({
						id: 'custpage_sublistid',
						type: serverWidget.SublistType.LIST,
						label: 'Estate DETAILS',
						tab: 'custpage_subtab1'
					});
					sublist.addField({
						id: 'custpage_estate',
						type: serverWidget.FieldType.TEXT,
						label: 'Estate Name'
					});
					sublist.addField({
						id: 'custpage_estate_hidden',
						type: serverWidget.FieldType.TEXT,
						label: 'Estate Name Hidden'
					}).updateDisplayType({
						displayType: serverWidget.FieldDisplayType.HIDDEN
					});
					sublist.addField({
						id: 'custpage_total_invoice',
						type: serverWidget.FieldType.TEXT,
						label: 'Total Invoice Amount'
					});

					sublist.addField({
						id: 'custpage_last_communcation',
						type: serverWidget.FieldType.TEXT,
						label: 'Last Communication Date'
					});
					sublist.addField({
						id: "custpage_last_communcation_note",
						type: serverWidget.FieldType.TEXTAREA,
						label: "Last Communication Note"
					})
					sublist.addField({
						id: "custpage_next_event",
						type: serverWidget.FieldType.TEXT,
						label: "Next Event "
					})
					formObj.addButton({
							id: 'custpage_renewal_all',
							label: "CSV",
							functionName: 'casecsvdownload();'
						});
					var retrieveSearch = returnSearchObject(sub, PAGE_SIZE);
					var lineIndex = 0;
					log.debug('retrieveSearch', retrieveSearch)
					if (retrieveSearch) {
						for (let j in retrieveSearch) {
							let result = retrieveSearch[j];
							let estate = result.id;
							let estateName = result.customer
							if (estate) {
								var output = url.resolveRecord({
									recordType: 'customer',
									recordId: estate,
									isEditMode: false
								});
								var projecname = '';
								projecname += '<html>';
								projecname += '<a href=' + output + '>' + estateName + '</a></html>';
								sublist.setSublistValue({
									id: 'custpage_estate',
									line: lineIndex,
									value: projecname
								});
								sublist.setSublistValue({
									id: 'custpage_estate_hidden',
									line: lineIndex,
									value: estateName
								});
							}
							if (result.amount)
								sublist.setSublistValue({
									id: 'custpage_total_invoice',
									line: lineIndex,
									value: result.amount
								});
							if (result.message)
								sublist.setSublistValue({
									id: 'custpage_last_communcation_note',
									line: lineIndex,
									value: result.message
								});
							if (result.date)
								sublist.setSublistValue({
									id: 'custpage_last_communcation',
									line: lineIndex,
									value: result.date
								});
							if (result.events)
								sublist.setSublistValue({
									id: 'custpage_next_event',
									line: lineIndex,
									value: result.events
								});
								

							lineIndex++;
						}
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
						scriptId: 'customscript_sl_new_report',
						deploymentId: 'customdeploy_sl_new_report'
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

		const returnSearchObject = (subsidiary, PAGE_SIZE) => {
			/*		var column = new Array();
					var filter;

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
					filter = [
						["type", "anyof", "CustInvc"], "AND", ["mainline", "is", "T"], "AND", ["status", "anyof", "CustInvc:A"]
					] //'AND', ["trandate", "within", lastweek, todatDate]
					//];
					var searchObject = search.create({
						type: search.Type.INVOICE,
						columns: column,
						filters: filter
					});*/
			var searchObject = search.create({
				type: "customer",
				filters: [
					[
						["custentity_problem_case", "is", "T"], "OR", ["custentity_blocked_account_letter", "is", "T"]
					],
					"AND",
					["transaction.type", "anyof", "CustInvc"],
					"AND",
					["transaction.status", "anyof", "CustInvc:A"],
					"AND",
					["transaction.mainline", "is", "T"]
				],
				columns: [
					search.createColumn({
						name: "internalid",
						summary: "GROUP",
						label: "Internal ID"
					}),
					search.createColumn({
						name: "altname",
						summary: "GROUP",
						label: "Name"
					}),
					search.createColumn({
						name: "amount",
						join: "transaction",
						summary: "SUM",
						label: "Amount"
					}),
					search.createColumn({
						name: "startdate",
						join: "event",
						summary: "MAX",
						label: "Start Date"
					}),
					search.createColumn({
						name: "internalid",
						join: "parentCustomer",
						summary: "GROUP",
						label: "Internal ID"
					})
				]
			});

			var pagedData = searchObject.runPaged({
				pageSize: PAGE_SIZE
			});

			return fetchSearchResult(pagedData);
		}

		const fetchSearchResult = (pagedData) => {
			let estates = [];
			let communication = {}
			let calendarEvents = {};

			pagedData.pageRanges.forEach(function (pageRange) {
				var pageIndex = pageRange.index;
				var searchPage = pagedData.fetch({
					index: pageIndex
				});
				searchPage.data.forEach(function (result) {
					var estate = result.getValue(result.columns[0]);
					var parentCustomer = result.getValue(result.columns[4]);
					estates.push(parentCustomer);
					openinvoies[estate] = {
						'customer': result.getValue(result.columns[1]),
						'customerid': parentCustomer,
						'Amount': result.getValue(result.columns[2])
					}
				});
			});
			log.debug('estates', estates);
			try {
				if (estates && estates.length > 0) {
					var phonecallSearchObj = search.create({
						type: "phonecall",
						filters: [
							["company", "anyof", estates]
						],
						columns: [

							search.createColumn({
								name: "startdate",
								summary: "MAX",
								sort: search.Sort.DESC,
								label: "Phone Call Date"
							}),
							search.createColumn({
								name: "company",
								summary: "GROUP",
								label: "Company"
							}),
							search.createColumn({
								name: "message",
								summary: "GROUP",
								label: "Comment"
							})
						]
					});
					let searchResultCount = phonecallSearchObj.runPaged().count;
					let phonecallSearchResult = getSearchResult(phonecallSearchObj);
					log.debug("phonecallSearchObj result count", searchResultCount);
					let customers = [];
					phonecallSearchResult.forEach(function (result) {
						let customer = result.getValue(result.columns[1])
						if (customers.indexOf(customer) == -1) {
							communication[customer] = {
								'comdate': result.getValue(result.columns[0]),
								'message': result.getValue(result.columns[2])
							}
							customers.push(customer);
						}
						return true;
					})
					var calendareventSearchObj = search.create({
						type: "calendarevent",
						filters: [
							["attendee", "anyof", estates]
						],
						columns: [
							search.createColumn({
								name: "attendee",
								summary:'GROUP',
								label: "Attendees"
							}),
							search.createColumn({
								name: "title",
								summary:'GROUP',
								label: "Event"
							}),
							search.createColumn({
								name: "startdate",
								label: "Start Date",
								summary: "MAX",
								sort: search.Sort.DESC,
							})
							
						]
					});
					let eventSearchResultCount = calendareventSearchObj.runPaged().count;
					let eventSearchResult = getSearchResult(calendareventSearchObj);
					log.debug("eventSearchResultCount", eventSearchResultCount);
					let events = [];
					eventSearchResult.forEach(function (result) {
						let attendee = result.getValue(result.columns[0])
						if (events.indexOf(attendee) == -1) {
							calendarEvents[attendee] = result.getValue(result.columns[2])+" "+result.getValue(result.columns[1])
							events.push(attendee);
						}
					})

				}
			} catch (e) {
				log.error("Error is here = ", e);
			}
			var results = {};
			for (let index in openinvoies) {
				let result = openinvoies[index];
				if (communication.hasOwnProperty(result.customerid)) {
					let comResult = communication[result.customerid];
					results[index] = {
						id: index,
						customer: result.customer,
						amount: result.Amount,
						date: comResult.comdate,
						message: comResult.message,
						events:calendarEvents[result.customerid]
					};
				} else {
					results[index] = {
						id: index,
						customer: result.customer,
						amount: result.Amount,
						date: '',
						message: '',
						events:calendarEvents[result.customerid]
					};

				}
			}
			log.debug('results', results);
			return results;
		}


		const getfileId = (clientScript) => {
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
		const getSearchResult = (pagedDataObj) => {
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



		return {
			onRequest
		}

	});