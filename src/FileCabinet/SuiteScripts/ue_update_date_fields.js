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
		const beforeLoad = (scriptContext) => {
			try {
           
              
            } catch (e) {
				log.error('e', e);
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
			  let recObj = scriptContext.newRecord;
              let recordObj = record.load({
					type: recObj.type,
					id: recObj.id
				});
              log.debug('scriptContext',scriptContext.type);
              let lastsaleDate = recordObj.getValue({
						fieldId: 'custrecord_last_sale_date_attom'
					});
               let auctonDate = recordObj.getValue({
						fieldId: 'custrecord_auction_date'
					});        
                let  event_effective_date= recordObj.getValue({
						fieldId: 'custrecord_event_effective_date'
					}); 
              /*let dt1=format.format({value:event_effective_date, type: format.Type.DATE});
              let dt3=format.parse({value:event_effective_date, type: format.Type.DATE});
              
              log.debug('dt1',dt1);
              log.debug('dt3',dt3);*/

              if(event_effective_date){
                let myArray = event_effective_date.split("-");
                let date1=myArray[1]+'/'+myArray[2]+'/'+myArray[0]
                log.debug('date1',date1);
                let dt2=new Date(date1) ;
                let dt3=format.parse({value:date1, type: format.Type.DATE});
                log.debug('dt3',dt3);             
                log.debug('dt2',dt2);

                recordObj.setValue({
						fieldId: 'custrecord_event_effective_date_new',
                         value:dt3
					}); 
              }
               if(auctonDate){
                  let myArray = auctonDate.split("-");
                let date1=myArray[1]+'/'+myArray[2]+'/'+myArray[0]
                log.debug('date1',date1);
                let dt3=format.parse({value:date1, type: format.Type.DATE});
                log.debug(' auctonDate dt3',dt3);
                recordObj.setValue({
						fieldId: 'custrecord_swagger_auction_date',
                         value: dt3
					}); 
              }
              
               if(lastsaleDate){
                 let myArray = lastsaleDate.split("-");
                let date1=myArray[1]+'/'+myArray[2]+'/'+myArray[0]
                log.debug('date1',date1);
                let dt3=format.parse({value:date1, type: format.Type.DATE});
                log.debug(' lastsaleDate dt3',dt3);
                recordObj.setValue({
						fieldId: 'custrecord_last_sales_date_new',
                         value: new Date(dt3)
					}); 
              }



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