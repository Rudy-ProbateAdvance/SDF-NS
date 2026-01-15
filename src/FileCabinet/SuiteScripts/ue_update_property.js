/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/https', 'N/search', 'N/format'],
	/**
		 * @param{search} search
  @param{record} record
		 */
	(record, https, search, format) => {
		/**
		 * Defines the function definition that is executed before record is submitted.
		 * @param {Object} scriptContext
		 * @param {Record} scriptContext.newRecord - New record
		 * @param {Record} scriptContext.oldRecord - Old record
		 * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
		 * @since 2015.2
		 */
		const beforeSubmit = (scriptContext) => {
			try {} catch (e) {
				log.error('e', error);
			}
		}
		/**
		 * Defines the function definition that is executed after record is submitted.
		 * @param {Object} scriptContext
		 * @param {Record} scriptContext.newRecord - New record
		 * @param {Record} scriptContext.oldRecord - Old record
		 * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
		 * @since 2015.2
		 */
		const afterSubmit = (scriptContext) => {
			try {
              log.debug('scriptContext',scriptContext.type);
              var recObj = scriptContext.newRecord;
              	let recordObj = record.load({
					type: recObj.type,
					id: recObj.id
				});
              var note = recordObj.getValue({
						fieldId: 'custrecord_notes'
					});
               var sole = recordObj.getValue({
						fieldId: 'custrecord_sold'
					});
              log.debug('sole'+sole,'note'+note);
              if(scriptContext.type=='xedit'&&(note!=''||sole)){return;}
				var msg;
				var attom_error;
				
			
				try {

					var update = recordObj.getValue({
						fieldId: 'custrecord_swagger_update'
					});
					//  if(update==true){
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
					var name = address.split(',');
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
						log.debug('response.body', eventreponse)
						let listingEventsbody = JSON.parse(eventreponse.body);
                        let estimatedValue=listingEventsbody.estimatedValue;
						let listingEvents = listingEventsbody.listingEvents
						let effectiveDate = listingEvents[0].valueEffectiveDate;
						let type = listingEvents[0].eventType;
						let valueamount = listingEvents[0].valueAmount;
                        let estimatedAmount = estimatedValue.value;
                      if(eventreponse.code==200){
                             msg = "Success";}
						recordObj.setValue({
							fieldId: 'custrecord_last_sale_valueamount',
							value: valueamount
						});
                      log.debug('estimatedAmount',estimatedAmount);
							if (estimatedAmount) {
								recordObj.setValue({
									fieldId: 'custrecord_estimatedvalue',
									value: estimatedAmount
								});
							}
						let valueEffectiveDate = listingEvents[0].valueEffectiveDate;
						let eventType = listingEvents[0].eventType;
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

					
					} catch (e) {
						log.error('ERROR', e)
					}
					// }
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

			} catch (e) {
				log.debug('ERROR', e);
			}
		}

		return {
			afterSubmit
		}

	});