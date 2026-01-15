/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record','N/runtime','N/format','N/url'],

		function(record,runtime,format,url) {


	/**
	 * Function to be executed when field is changed.
	 *
	 * @param {Object} scriptContext
	 * @param {Record} scriptContext.currentRecord - Current form record
	 * @param {string} scriptContext.sublistId - Sublist name
	 * @param {string} scriptContext.fieldId - Field name
	 * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
	 * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
	 *
	 * @since 2015.2
	 */
	function fieldChanged(scriptContext) {
		try{
                        	
var objRecord=scriptContext.currentRecord;
                     var currentRec = scriptContext.currentRecord;

          if(scriptContext.fieldId=='custpage_from_date_filter'||scriptContext.fieldId=='custpage_to_date_filter'||scriptContext.fieldId=='custpage_assigned_filter'||scriptContext.fieldId=='custpage_completed_filter'){
			var fromDate=currentRec.getText({ fieldId : 'custpage_from_date_filter'});
			var toDate= currentRec.getText({ fieldId : 'custpage_to_date_filter'});
            var assigned= currentRec.getValue({ fieldId : 'custpage_assigned_filter'});
            var completed= currentRec.getValue({ fieldId : 'custpage_completed_filter'});

             var link = url.resolveScript({scriptId: 'customscript_sl_customer_followup',
			deploymentId: 'customdeploy_sl_customer_followup'});
            var urlVal= link+"&fromdate="+fromDate
			urlVal += "&todate="+toDate;
            if(assigned){
              			urlVal += "&assigned="+assigned;
            }else{
              urlVal += "&assigned=all"
            }
          if(completed){
              			urlVal += "&completed="+completed

            }
            					console.log(urlVal);

			window.onbeforeunload= null;
			window.location.href=urlVal;
          }
            
          
		if(scriptContext.fieldId=='custpage_completed'&&scriptContext.sublistId=='custpage_sublistid'){
          console.log(scriptContext.fieldId);
                    console.log(scriptContext.sublistId);
				var completed = objRecord.getCurrentSublistValue({
					sublistId: 'custpage_sublistid',
					fieldId: 'custpage_completed'
				});if(completed)
          window.nlapiDisableLineItemField('custpage_sublistid','custpage_completed','T')
				var followupId = objRecord.getCurrentSublistValue({
					sublistId: 'custpage_sublistid',
					fieldId: 'custpage_followup_id'
				});
				var userObj = runtime.getCurrentUser();
				var curruser=userObj.id;
              	console.log(followupId+'///'+completed);

				log.debug('Internal ID of current user: ' + userObj.id);
				if (followupId != null && followupId != "") {
					var now = new Date(); // Say it's 7:01PM right now.
					var dateVal = format.format({value: now, type: format.Type.DATETIMETZ});
					log.debug('dateVal',dateVal);
					console.log(dateVal);
                     objRecord.setCurrentSublistValue({
					sublistId: 'custpage_sublistid',
					fieldId: 'custrecord_complete_date',
                    value:dateVal
				});
                      objRecord.setCurrentSublistValue({
					sublistId: 'custpage_sublistid',
					fieldId: 'custrecord_followup_completedby',
                    value:curruser
				});
					record.submitFields({
						type: 'customrecord_customer_follow_up',
						id: followupId,
						values: {
							'custrecord_followup_completed': completed,
							'custrecord_complete_date':dateVal,
							'custrecord_followup_completedby':curruser

						}
					});
               
                  	window.onbeforeunload= null;
                  window.location.href = window.location.href;

            
				}
			}

		}catch(e){
          console.log(e)
			log.error('ERROR',e);
		}

	}
/**
     * Function to be executed after line is selected.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function lineInit(scriptContext) {
      try{
        var objRecord=scriptContext.currentRecord;
				var completed = objRecord.getCurrentSublistValue({
					sublistId: 'custpage_sublistid',
					fieldId: 'custpage_completed'
				});

if(completed=='T'){window.nlapiDisableLineItemField('custpage_sublistid', "custpage_followup_completed", true);}else{window.nlapiDisableLineItemField('custpage_sublistid', "custpage_followup_completed", false);}

      }catch(e){log.error('ERROR',e)}

    }


	return {
		fieldChanged: fieldChanged,

	};

});
