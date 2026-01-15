/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/https', 'N/search', 'N/format'],
	/**
	 * @param{record} record
	 * @param{search} search
	 */
	(record, https, search, format) => {
		/**
		 * Defines the function that is executed at the beginning of the map/reduce process and generates the input data.
		 * @param {Object} inputContext
		 * @param {boolean} inputContext.isRestarted - Indicates whether the current invocation of this function is the first
		 *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
		 * @param {Object} inputContext.ObjectRef - Object that references the input data
		 * @typedef {Object} ObjectRef
		 * @property {string|number} ObjectRef.id - Internal ID of the record instance that contains the input data
		 * @property {string} ObjectRef.type - Type of the record instance that contains the input data
		 * @returns {Array|Object|Search|ObjectRef|File|Query} The input data to use in the map/reduce process
		 * @since 2015.2
		 */
		const getInputData = (inputContext) => {
			try {
				/*return search.load({
					id: 'customsearch_update_property_search'
				});*/
				var column = new Array();
				var filter;
				column.push(search.createColumn({
					name: "parent",
					join: "customer",
					summary: "GROUP",
					sort: search.Sort.ASC,

				}));
				filter = [
					["type", "anyof", "CustInvc"], "AND", ["mainline", "is", "T"], "AND", ["status", "anyof", "CustInvc:A"]
				];
				var searchObject = search.create({
					type: search.Type.INVOICE,
					columns: column,
					filters: filter
				});
				var pagedData = searchObject.runPaged({
					pageSize: 1000
				});
				var estates = [];
				var estateJson = [];
				var searchResult;
				pagedData.pageRanges.forEach(function(pageRange) {
					var pageIndex = pageRange.index;
					log.debug('pageIndex', pageIndex);
					var searchPage = pagedData.fetch({
						index: pageIndex
					});
					searchPage.data.forEach(function(result) {
						var estate = result.getValue(result.columns[0]);
						estates.push(estate);
					});
				});
				if (estates.length > 0) {
					var propertySearchObj = search.create({
						type: "customrecord_property",
						filters: [
							["custrecord_property_estate", "anyof", estates]
						],
						columns: [
							search.createColumn({
								name: "name",
								sort: search.Sort.ASC,
								label: "Name"
							}),
							search.createColumn({
								name: "internalid",
								sort: search.Sort.ASC,
								label: "internalid"
							})
						]
					});
					var propertyresults = getSearchResult(propertySearchObj);
					propertyresults.forEach(function(result) {
						var id = result.getValue({
							name: 'internalid'
						});
						estateJson.push(id);
					});
				}
				//
				//estateJson.push( 5723);
				log.debug('estateJson', estateJson);
				return estateJson;
			} catch (e) {
				log.error('ERROR', e)
			}
		}

		/**
		 * Defines the function that is executed when the map entry point is triggered. This entry point is triggered automatically
		 * when the associated getInputData stage is complete. This function is applied to each key-value pair in the provided
		 * context.
		 * @param {Object} mapContext.write({key:'',value:}) - Data collection containing the key-value pairs to process in the map stage. This parameter
		 *     is provided automatically based on the results of the getInputData stage.
		 * @param {Iterator} mapContext.errors - Serialized errors that were thrown during previous attempts to execute the map
		 *     function on the current key-value pair
		 * @param {number} mapContext.executionNo - Number of times the map function has been executed on the current key-value
		 *     pair
		 * @param {boolean} mapContext.isRestarted - Indicates whether the current invocation of this function is the first
		 *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
		 * @param {string} mapContext.key - Key to be processed during the map stage
		 * @param {string} mapContext.value - Value to be processed during the map stage
		 * @since 2015.2
		 */

		const map = (mapContext) => {
			try {
				let recid = mapContext.value;
              //let recid = mapContext.key;

				var msg;
				var attom_error;
				let recordObj = record.load({
					type: 'customrecord_property',
					id: recid
				});
				try {
					var address;
					var attom_address = recordObj.getValue({
						fieldId: 'custrecord_attom_address'
					});
					if (attom_address != '' && attom_address != null) {
						address = attom_address;
					} else {
						var address = recordObj.getValue({
							fieldId: 'name'
						})
					}
                  var attomDate = recordObj.getValue({
							fieldId: 'custrecord_last_sale_date_attom'
						})
					// split the address with comm based Swagger addresss format
					var name = address.split(',');
					if (name.length > 1) {
						log.debug('name', name);
						var city = name[1];
						var address = name[0];
						let url = "https://prod-ss-rtcma-ext.clearcollateral.com/api/v1/listings?address=" + address;
						let eventurl = "https://prod-ss-rtcma-ext.clearcollateral.com/api/v1/listings/events?address=" + address
						if (city) {
							url += "&city=" + city;
							eventurl += "&city=" + city;
						}
						if (name.length > 2) {
							var details = name[2].split(' ');
							if (name.length > 2) {
								var state = details[1];
								var zip = details[2];
							}
							if (state) {
								url += "&state=" + state;
								eventurl += "&state=" + state;
							}
							if (zip) {
								eventurl += "&zip=" + zip;
								url += "&zip=" + zip;

							}
						}

						log.debug('url', url);
						try {
							let headerObj = {
								"X-API-KEY": "b9d00164-6463-4cbb-ae2a-bad5d16b0866",
								"accept": "application/json"
							};
							/*var response = https.get({
								url: url,
								headers: headerObj
							});*/
							var eventreponse = https.get({
								url: eventurl,
								headers: headerObj
							});
                                                

							log.debug('response.body'+eventreponse.code, eventreponse)
							let listingEventsbody = JSON.parse(eventreponse.body);
							let estimatedValue=listingEventsbody.estimatedValue;
                            let estimatedAmount = estimatedValue.value;
							let listingEvents = listingEventsbody.listingEvents;
                             msg = listingEventsbody.message;
                          if(eventreponse.code==200){
                             msg = "Success";}

							log.debug('listingEvents', listingEvents.length);
							let effectiveDate = listingEvents[0].valueEffectiveDate;
							let type = listingEvents[0].eventType;
							let valueamount = listingEvents[0].valueAmount;
							log.debug('effectiveDate'+attomDate,effectiveDate);
                            var date1=new Date(attomDate);
                            var date2=new Date(effectiveDate)
							log.debug('effectiveDate'+date1,date2);
							recordObj.setValue({
								fieldId: 'custrecord_last_sale_valueamount',
								value: valueamount
							});
							
							let valueEffectiveDate = listingEvents[0].valueEffectiveDate;
							let eventType = listingEvents[0].eventType;
                          if(eventType=='Deleted' &&listingEvents.length>1){
                            eventType = listingEvents[1].eventType;
                            valueEffectiveDate= listingEvents[1].valueEffectiveDate;
                          }
                          log.debug('eventType',eventType);
							if (eventType) {
								recordObj.setValue({
									fieldId: 'custrecord_event_type',
									value: eventType
								});
							}
							if (valueEffectiveDate) {
								recordObj.setValue({
									fieldId: 'custrecord_event_effective_date',
									value: valueEffectiveDate
								});
							}
							log.debug('valueEffectiveDate', valueEffectiveDate + '//' + eventType);  
                          if (estimatedAmount) {
									recordObj.setValue({
										fieldId: 'custrecord_estimatedvalue',
										value: estimatedAmount
									});
								}
							
								log.debug('estimatedValue', estimatedAmount + '////////' + estimatedAmount);
							
						} catch (e) {
							log.error('ERROR', e)
						}
					}else {
						msg = 'Must provide proper address'
					}
				} catch (e) {

					log.debug('ERROR', e);
				}
				if (msg != 'undefined') {
					recordObj.setValue({
						fieldId: 'custrecord_error',
						value: msg
					});
				}

				recordObj.setValue({
					fieldId: 'custrecord_swagger_script_last_run_date',
					value: new Date()
				});
				log.debug('swgger msg', msg);
				let recordId = recordObj.save({
					enableSourcing: true,
					ignoreMandatoryFields: true
				});
				log.debug('recordId', recordId);
				mapContext.write({
					key: recordId,
					value: recordId
				});
			} catch (e) {
				log.error('ERROR', e.message)
			}
		}



		/**
		 * Defines the function that is executed when the summarize entry point is triggered. This entry point is triggered
		 * automatically when the associated reduce stage is complete. This function is applied to the entire result set.
		 * @param {Object} summaryContext - Statistics about the execution of a map/reduce script
		 * @param {number} summaryContext.concurrency - Maximum concurrency number when executing parallel tasks for the map/reduce
		 *     script
		 * @param {Date} summaryContext.dateCreated - The date and time when the map/reduce script began running
		 * @param {boolean} summaryContext.isRestarted - Indicates whether the current invocation of this function is the first
		 *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
		 * @param {Iterator} summaryContext.output - Serialized keys and values that were saved as output during the reduce stage
		 * @param {number} summaryContext.seconds - Total seconds elapsed when running the map/reduce script
		 * @param {number} summaryContext.usage - Total number of governance usage units consumed when running the map/reduce
		 *     script
		 * @param {number} summaryContext.yields - Total number of yields when running the map/reduce script
		 * @param {Object} summaryContext.inputSummary - Statistics about the input stage
		 * @param {Object} summaryContext.mapSummary - Statistics about the map stage
		 * @param {Object} summaryContext.reduceSummary - Statistics about the reduce stage
		 * @since 2015.2
		 */
		const summarize = (summaryContext) => {
			try {
				let type = summaryContext.toString();
				let totalProcess = 0;
				summaryContext.output.iterator().each(function(key, value) {
					totalProcess++;
					return true;
				});
				// Log details about the total number of pairs saved.
				log.audit("Total Records:" + totalProcess, "Time:" + summaryContext.seconds + " | Yields : " + summaryContext.yields + "| Concurrency :" + summaryContext.concurrency + "| Usage: " + summaryContext.usage);

			} catch (e) {
				log.error('error', e)
			}

		}

		/**
		 * Get the search result
		 */
		var getSearchResult = (pagedDataObj) => {
			var pagedData = pagedDataObj.runPaged({
				pageSize: 1000
			});
			var resultDetails = new Array();
			pagedData.pageRanges.forEach(function(pageRange) {
				var myPage = pagedData.fetch({
					index: pageRange.index
				});
				myPage.data.forEach(function(result) {
					resultDetails.push(result);
				});
			});

			return resultDetails;
		};

		return {
			getInputData,
			map,
			summarize
		}

	});