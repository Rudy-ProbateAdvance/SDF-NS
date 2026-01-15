/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */


define(['N/record', 'N/redirect', 'N/search', 'N/ui/serverWidget','N/runtime','N/format','N/url'],

		function(record, redirect, search, serverWidget,runtime,format,url) {

	/**
	 * Definition of the Suitelet script trigger point.
	 *
	 * @param {Object} context
	 * @param {ServerRequest} context.request - Encapsulation of the incoming request
	 * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
	 * @Since 2015.2
	 */
	function onRequest(context) {
		try{
			if(context.request.method=='GET'){
				var customer = context.request.parameters.customer;
				var phone = context.request.parameters.phone;
				var emailId = context.request.parameters.emailId;
				var flg= context.request.parameters.flg;
				var userObj = runtime.getCurrentUser();
				var currentUser=userObj.id;
				var form = serverWidget.createForm({
					title: 'Follow Up',
					hideNavBar: false
				});
				var title='';
				if(customer){
					var fieldLookUp = search.lookupFields({
						type: search.Type.CUSTOMER,
						id: customer,
						columns: ['entityid', 'firstname', 'lastname','phone']
					});
					title='Follow up '+fieldLookUp.firstname+' '+fieldLookUp.lastname+' '+fieldLookUp.entityid;
					phone=fieldLookUp.phone
				}
				var tomorrow =  new Date()
				tomorrow.setDate(tomorrow.getDate() + 1)
				// Get parameters
				form.addFieldGroup({
					id: 'custpage_fieldgroup_filters',
					label: 'Filters'
				});
				log.debug('title',title);
				//fieldGroupFilters.isSingleColumn = true;
				form.addField({
					id: 'custpage_title',
					type: serverWidget.FieldType.TEXT,
					label: 'Title',
					container: 'custpage_fieldgroup_filters'
				}).defaultValue=title;

				var clientField = form.addField({
					id: 'custpage_customer',
					type: serverWidget.FieldType.SELECT,
					label: 'Customer',
					source:'customer',
					container: 'custpage_fieldgroup_filters'
				});
				clientField.defaultValue=customer;
				clientField.updateDisplayType({
					displayType: serverWidget.FieldDisplayType.INLINE
				});
				var dateField = form.addField({
					id: 'custpage_date',
					type: serverWidget.FieldType.DATE,
					label: 'Date',
					container: 'custpage_fieldgroup_filters'
				});
				dateField.defaultValue=tomorrow;
				var phoneField=form.addField({
					id: 'custpage_phone',
					type: serverWidget.FieldType.PHONE,
					label: 'phone',
					container: 'custpage_fieldgroup_filters'
				});
				phoneField.defaultValue=phone;
				var emailField = form.addField({
					id: 'custpage_email',
					type: serverWidget.FieldType.EMAIL,
					label: 'Email',
					container: 'custpage_fieldgroup_filters'
				});
				emailField.defaultValue=emailId;
				var field = form.addField({
					id : 'custpage_flg',
					type : serverWidget.FieldType.TEXT,
					label : 'Text'
				});
				field.defaultValue=flg;
				field.updateDisplayType({
					displayType: serverWidget.FieldDisplayType.HIDDEN
				});
				form.addField({
					id: 'custpage_notes',
					type: serverWidget.FieldType.TEXTAREA,
					label: 'notes',
					container: 'custpage_fieldgroup_filters'
				});
				/*var phoneField=form.addField({
					id: 'custpage_complete',
					type: serverWidget.FieldType.DATE,
					label: 'Completed Date',
					container: 'custpage_fieldgroup_filters'
				});*/
				var assingdObj=  form.addField({
					id: 'custpage_assigned',
					type: serverWidget.FieldType.SELECT,
					label: 'Assigned',
					source:'employee',
					container: 'custpage_fieldgroup_filters'
				});
				assingdObj.defaultValue=      currentUser;
				form.addSubmitButton({label: 'Submit'});
				context.response.writePage(form);
			}else{

				var title    = context.request.parameters.custpage_title;
				var customer = context.request.parameters.custpage_customer
				var phone    = context.request.parameters.custpage_phone;
				var date     = context.request.parameters.custpage_date;
				var note     = context.request.parameters.custpage_notes;
				var emailId     = context.request.parameters.custpage_email;
				var assigned     = context.request.parameters.custpage_assigned;
				var completed     = context.request.parameters.custpage_complete;
				var flg = context.request.parameters.custpage_flg;
log.debug('flg',flg);
				var parsedDate = format.parse({
					value: date,
					type: format.Type.DATE
				});
				/* var completedDate = format.parse({
                    value: completed,
                    type: format.Type.DATE
                  });*/
				var userObj = runtime.getCurrentUser();
				var currentUser=userObj.id;
				var followupObj=record.create({type:'customrecord_customer_follow_up'});
				followupObj.setValue({fieldId:'custrecord_followup_title',value:title});
				followupObj.setValue({fieldId:'custrecord_followup_customer',value:customer});
				if(phone)
					followupObj.setValue({fieldId:'custrecord_followup_phone',value:phone});
				followupObj.setValue({fieldId:'custrecord_followup_date',value:parsedDate});
				followupObj.setValue({fieldId:'custrecord_followup_createdby',value:currentUser});
				if(note!=null&&note!='')
					followupObj.setValue({fieldId:'custrecord_followup_note',value:note});
				if(emailId)
					followupObj.setValue({fieldId:'custrecord_followup_email',value:emailId});
				// if(completedDate!=''&&completedDate!=null)
				//followupObj.setValue({fieldId:'custrecord_complete_date',value:completedDate});
				if(assigned!=null&&assigned!='')
					followupObj.setValue({fieldId:'custrecord_assigned',value:assigned});

				var recordId=followupObj.save();
				log.debug('recordId',recordId)
				// var body = "Customer Follow up Record # "+recordId + ' was successfully saved';
				if(flg=='suitelet'){
					var html='';
                  var scheme = 'https://';
				//method works for specific account
				var host = url.resolveDomain({hostType: url.HostType.APPLICATION});
				var link = url.resolveScript({scriptId: 'customscript_sl_customer_followup',
					deploymentId: 'customdeploy_sl_customer_followup',});
				var urlVal=scheme+host+link;
                  log.debug('urlVal',urlVal);
					html+='<script>'
				html+='window.open("'+urlVal+'","_self");</script>';		
				context.response.writeLine(html);
				}else{
					var html='';
					html+='<script>'			
						html+='window.close();</script>';}		
				context.response.writeLine(html);
				//context.response.write(body);

			}

		}catch(e){log.error('ERROR',e)}

	}

	return {
		onRequest: onRequest
	};

});