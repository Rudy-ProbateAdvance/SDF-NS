/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search'],
    /**
 * @param{record} record
 * @param{search} search
 */
    (record, search) => {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => {
            
        }

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {
            try{
                const newRec = scriptContext.newRecord;

              var preforeclosure_statuses= {
                'yes':'Yes',
                'yeS':'Yes',
                'yEs':'Yes',
                'yES':'Yes',
                'Yes':'Yes',
                'YeS':'Yes',
                'YEs':'Yes',
                'YES':'Yes',
                'no':'No',
                'nO':'No',
                'No':'No',
                'NO':'No',
                '':''
              }
             //custrecord_event_type_new
              const event_type = newRec.getValue({fieldId: "custrecord_event_type"});
              const preforeclosure_status = preforeclourestatuses[newRec.getValue({fieldId: "custrecord4"})];
              const preforeclosure_check=newRec.getValue({fieldId: "custrecord_preforeclosure_checkbox"});
              const listing_check=newRec.getValue({fieldId: "custrecord_listing_checkbox"});
              if(preforeclosure_check==false)
                  newRec.setText({fieldId:'custrecord_event_type_new',text:event_type})
              if(listing_check==false){
                  newRec.setText({fieldId:'custrecord_preforeclosure_status',text:preforeclosure_status})
              }
                  
               
            
            }catch (e) {
                log.error("Exception on beforeSubmit", e);
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

        }

        return { beforeSubmit}

    });