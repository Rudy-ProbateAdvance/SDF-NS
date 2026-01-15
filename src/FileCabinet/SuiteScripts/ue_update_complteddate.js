/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/search','N/record','N/runtime','N/file'],
		/**
		 * @param{search} search
  @param{record} record
		 */
		(search,record,runtime,file) => {
			/**
			 * Defines the function definition that is executed before record is submitted.
			 * @param {Object} scriptContext
			 * @param {Record} scriptContext.newRecord - New record
			 * @param {Record} scriptContext.oldRecord - Old record
			 * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
			 * @since 2015.2
			 */
			const beforeSubmit = (scriptContext) => {
				try{}catch(e){
					log.error('e',error);
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
				try{	
					var recObj=scriptContext.newRecord;
					var id=recObj.id;
					var rectype=recObj.type;
                 
                      var userObj = runtime.getCurrentUser();
log.debug('Internal ID of current user: ' + userObj.id);
                   var currentuser=userObj.id
                  var rec=record.load({type:rectype,id:id})
					var completed=rec.getValue({fieldId:'custrecord_followup_completed'});
					var complete_date=rec.getValue({fieldId:'custrecord_complete_date'});
                  log.debug('completed',completed);
                     if(completed==true&&(complete_date==''||complete_date=='')){
                    	 var date=new Date();
                    	 var otherId = record.submitFields({
                    		    type: rectype,
                    		    id: id,
                    		    values: {
                    		        'custrecord_complete_date': date,
                                  'custrecord_followup_completedby':currentuser
                    		    }
                    		});
                     } if(completed==false){
                        var otherId = record.submitFields({
                    		    type: rectype,
                    		    id: id,
                    		    values: {
                    		        'custrecord_complete_date': '',
                                  'custrecord_followup_completedby':''
                    		    }
                    		});
                     }
				}catch(e){
					log.debug('ERROR',e);
				}
			}

			return { beforeSubmit,afterSubmit }

		});


