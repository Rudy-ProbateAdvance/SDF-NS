/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/https', 'N/search','N/format'],
		/**
		 * @param{record} record
		 * @param{search} search
		 */
		(record, https, search,format) => {
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
              try{
				return search.load({
					id: 'customsearch_update_property_search'
				});
             
            }catch(e){log.error('ERROR',e)}
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
				try{
                  log.debug('mapContext',mapContext);
					let recid=mapContext.key;
					var msg ;
                  var saleAmount;
                  log.debug('recid',recid);
					var attom_error;
					//var recObj=scriptContext.newRecord;
					let recordObj=record.load({type:'customrecord_property',id:recid});
					try{
						var name=recordObj.getValue({fieldId:'name'}).split(',');
						log.debug('name',name);
                      if(name.length>1){
						var city=name[1];
						var address=name[0];
					let headerObj2 = {
							"apikey": "4e2ccfc66bc3b3a6cf4aca699f2360e6",
							"accept": "application/json"
						};
						let headerObj1 = {
							"apikey": "4e2ccfc66bc3b3a6cf4aca699f2360e6",
							"accept": "application/json"
						};
						var url2 = 'https://api.gateway.attomdata.com/propertyapi/v1.0.0/sale/detail?address1=' + name[0];
						var url1 = 'https://api.gateway.attomdata.com/propertyapi/v1.0.0/valuation/homeequity?address1=' + name[0];

						if (name.length > 2) {
							url1 += '&address2=' + name[1] + name[2];
							url2 += '&address2=' + name[1] + name[2];
						} else if (name.length > 1) {
							url1 += '&address2=' + name[1];
							url2 += '&address2=' + name[1]
						}
						log.debug('url1', url1);
						try {
							var response = https.get({
								url: url2,
								headers: headerObj1
							});
							var response1 = https.get({
								url: url1,
								headers: headerObj2
							});
							let repbody = JSON.parse(response.body);
							var responseStatus = (repbody);
							let repbody1 = JSON.parse(response1.body);
							log.debug('repbody1', repbody1);
							var statuscode = response.code;
							log.debug('statuscode', statuscode);
							if(statuscode==401){
								attom_error=responseStatus.Response.status.msg;
							}else if(statuscode==400){
								attom_error=repbody.status.msg
							}
							if(statuscode==200||statuscode==0){
								attom_error='Success';
								let property=repbody.property;
								let sale=property[0].sale;
								 saleAmount=sale.amount.saleamt;
								let saletranstype=sale.amount.saletranstype;
								let address=property[0].address;
								let attomaddress=address.line1+','+address.line2;
								log.debug('attomaddress',attomaddress);
								log.debug('saleAmount'+saletranstype,saleAmount);
                                 let saledate = sale.amount.salerecdate;
								if (saledate)
									recordObj.setValue({
										fieldId: 'custrecord_last_sale_date_attom',
										value: saledate
									});
								if(saleAmount){
									recordObj.setValue({fieldId:'custrecord_saleamount',value:saleAmount});
								}
								if(attomaddress){
									recordObj.setValue({fieldId:'custrecord_attom_address',value:attomaddress});
								}

								if(saletranstype){
									recordObj.setValue({fieldId:'custrecord_saletranstype',value:saletranstype});
								}
                                let property1 = repbody1.property;
								let homeEquity = property1[0].homeEquity;
								let totalEstimatedLoanBalance = homeEquity.totalEstimatedLoanBalance;
								let recordLastUpdated = homeEquity.recordLastUpdated;
								if (totalEstimatedLoanBalance)
									recordObj.setValue({
										fieldId: 'custrecord_est_mortage_amt_attom',
										value: totalEstimatedLoanBalance
									});
								if (recordLastUpdated)
									recordObj.setValue({
										fieldId: 'custrecord_est_mortage_amt_last_update',
										value: recordLastUpdated
									});
							}
						}catch(e){log.error('ERROR',e)}
                      }else{
                        attom_error='Must provide an address'
                      }
					}catch(e){

						log.debug('ERROR',e);
					}
					if(attom_error!='undefined'||(attom_error=='SuccessWithResult'&&saleAmount!='')){
						recordObj.setValue({fieldId:'custrecord_attom_error',value:attom_error});
					}
                  recordObj.setValue({fieldId:'custrecord_update',value:false});
					log.debug('attom_error',attom_error);
					let recordId=recordObj.save({enableSourcing: true,ignoreMandatoryFields: true});
					log.debug('recordId',recordId);
                  mapContext.write({key:recordId,value:recordId})
				}catch(e){log.error('ERROR',e.message)
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
				try{
					let type = summaryContext.toString();
					let totalProcess  = 0;
					summaryContext.output.iterator().each(function(key, value) {
						totalProcess++;
						return true;
					});
					// Log details about the total number of pairs saved.
					log.audit("Total Records:"+totalProcess, "Time:"+summaryContext.seconds +" | Yields : "+summaryContext.yields +"| Concurrency :"+ summaryContext.concurrency +"| Usage: "+summaryContext.usage);

				}catch (e) {
					log.error('error',e)
				}

			}


			return {getInputData, map, summarize}

		});