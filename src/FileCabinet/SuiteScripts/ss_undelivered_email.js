/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/record', 'N/search', 'N/runtime', 'N/config', 'N/format'],
	/**
	 * @param{record} record
	 * @param{search} search
	 */
	(record, search, runtime, config, format) => {

		/**
		 * Defines the Scheduled script trigger point.
		 * @param {Object} scriptContext
		 * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
		 * @since 2015.2
		 */
		const execute = (scriptContext) => {
			try {
				var searchObj = search.load({
					id: 'customsearch_undelivered_email'
				})
				var searchResultCount = searchObj.runPaged().count;
				log.debug('searchResultCount', searchResultCount);
				if (searchResultCount > 0) {
					var messageIds = [];
					var customrecord525SearchObj = search.create({
						type: "customrecord525",
						filters: [],
						columns: [search.createColumn({
							name: "custrecord_message_id",
							label: "Message ID"
						})]
					});
					var searchResultCount = customrecord525SearchObj.runPaged().count;
					customrecord525SearchObj.run().each(function (result) {
						messageIds.push(result.getValue({
							name: 'custrecord_message_id'
						}));
						return true;
					});
					searchObj.run().each(function (result) {
						var messageid = result.getValue({
							name: 'messageid'
						});
                      var recipients = result.getValue({
                          name: "recipients"
						})
                      log.debug('recipients',recipients);
                      if(recipients.indexOf('<')){
                      var newrecipients=recipients.split("<");
                      if(newrecipients.length>0){
                        recipients=newrecipients[0];
                      }
                      }
                      log.debug('after recipients',recipients);
						if(messageIds.indexOf(messageid)==-1){
						var recordObj = record.create({
							type: 'customrecord525',
							isDynamic: true
						});
						var sentdate = new Date(result.getValue({
							name: 'sentdate'
						}));
						var logdate = new Date(result.getValue({
							name: 'logdate'
						}));
						recordObj.setText({
							fieldId: 'custrecord_sent_date',
							text: result.getValue({
								name: 'sentdate'
							})
						});
						
						var customer;//contains
						var customerSearchObj = search.create({
							type: "customer",
							filters: [
								["entityid", "haskeywords", recipients],
								"OR", ["email", "contains", recipients]
							],
							columns: [
								search.createColumn({
									name: "internalid",
									sort: search.Sort.ASC,
									label: "ID"
								})
							]
						});
						customerSearchObj.run().each(function (result) {
							customer = result.getValue({
								name: 'internalid'
							})
						});
						log.debug('customer',customer+'>>>>>>>>>'+recipients);
                          try{
                      if(customer){
                      recordObj.setValue({
							fieldId: 'custrecord_customer',
							value: customer
						});}
                          }catch(e){log.error('Customer ERROR',e)}
						recordObj.setText({
							fieldId: 'custrecord_log_date',
							text: result.getValue({
								name: 'logdate'
							})
						});
						recordObj.setValue({
							fieldId: 'custrecord_reason',
							value: result.getValue({
								name: 'reason'
							})
						});
						recordObj.setValue({
							fieldId: 'custrecord_subject',
							value: result.getValue({
								name: 'subject'
							})
						});
						recordObj.setValue({
							fieldId: 'custrecord_from',
							value: result.getValue({
								name: 'from'
							})
						});
						recordObj.setValue({
							fieldId: 'custrecord_recipients',
							value: result.getValue({
								name: 'recipients'
							})
						});
						recordObj.setValue({
							fieldId: 'custrecord_compliance_verified',
							value: result.getValue({
								name: 'complianceverified'
							})
						});
						recordObj.setValue({
							fieldId: 'custrecord_message_id',
							value: messageid
						});
						var recordId = recordObj.save({
							enableSourcing: false,
							ignoreMandatoryFields: true
						});
						log.debug('recordId', recordId);
						}
						return true;

					});
				}

			} catch (e) {
				log.error('ERROR', e)
			}
		}

		return {
			execute
		}

	});