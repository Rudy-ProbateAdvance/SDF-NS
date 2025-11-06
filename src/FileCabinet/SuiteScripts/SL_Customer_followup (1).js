/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

var clientScriptFileId='cs_customer_followup.js'
	define(['N/record', 'N/redirect', 'N/search', 'N/ui/serverWidget','N/runtime','N/format','N/url'],

			function(record, redirect, search, ui,runtime,format,url) {

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

					var form = ui.createForm({
						title: 'Customer Follow Up Reminder',
						hideNavBar: false
					});
                     var userObj = runtime.getCurrentUser();
                     var userId=userObj.id;
					var fromdate = context.request.parameters.fromdate;
                    var todate = context.request.parameters.todate;
					var assingned = context.request.parameters.assigned;
					var completed = context.request.parameters.completed;
//if(completedVal==true||completedVal=='true'){completed='T'}
					form.addSubtab({id:'custpage_subtab1', label:'Customer Follow Up Reminder'});
					var fileId= getfileId(clientScriptFileId);
                  log.debug('assingned',assingned)
					form.clientScriptFileId = fileId;
                  ///**************
                  var fromfilter = form.addField({id : 'custpage_from_date_filter', type : ui.FieldType.DATE, label : 'From DATE'});
                  var tofilter = form.addField({id : 'custpage_to_date_filter', type : ui.FieldType.DATE, label : 'To DATE'});

                  var assignfilter = form.addField({id : 'custpage_assigned_filter', type : ui.FieldType.SELECT, source:'employee',label : 'ASSIGNED'});
                  var completedfilter = form.addField({id : 'custpage_completed_filter', type : ui.FieldType.SELECT, label : 'COMPLETED'});
                  completedfilter.addSelectOption({value : '0'	, text : 'ALL'});
                  completedfilter.addSelectOption({value : '1'	, text : 'NO'});
                  completedfilter.addSelectOption({value : '2'	, text : 'YES'});

                  if(fromdate != '' && fromdate != null){
						fromfilter.defaultValue = format.parse({value:fromdate,type:format.Type.DATE});
					}
                  if(todate != '' && todate != null){
						tofilter.defaultValue = format.parse({value:todate,type:format.Type.DATE});
					}
                  if(assingned=='all'){
                  }else if(assingned != '' && assingned != null){
						assignfilter.defaultValue = assingned;
					}else{
                      assignfilter.defaultValue = userId;
                    }
                    if(completed != '' && completed != null&& completed != 'undefined'){
                         log.debug('completed',completed)
						completedfilter.defaultValue = completed
					}else{
                        log.debug('else completed',completed)
                      completedfilter.defaultValue = '1';
                    }
                 
                  //************
					var sublist = form.addSublist({id : 'custpage_sublistid',type : ui.SublistType.LIST, label:'Customer Follow Up Reminder',tab : 'custpage_subtab1'});
					sublist.addField({id : 'custpage_title'   ,type : ui.FieldType.TEXT		,label : 'Title'});
                  var field = sublist.addField({
					id : 'custpage_followup_id',
					type : ui.FieldType.TEXT,
					label : 'Text'
				});
				field.updateDisplayType({
					displayType: ui.FieldDisplayType.HIDDEN
				});
					sublist.addField({id : 'custpage_customer'	  ,type : ui.FieldType.TEXT		,label : 'Customer',});
					sublist.addField({id : 'custpage_assigned'	  ,type : ui.FieldType.TEXT		,label : 'Assigned',});
					var completedfield=sublist.addField({id : 'custpage_completed'	  ,type : ui.FieldType.CHECKBOX		,label : 'Completed'});
                  
					sublist.addField({id : 'custpage_completed_date'		  ,type : ui.FieldType.TEXT		,label : 'Complete Date'});
					sublist.addField({id : 'custpage_date'		  ,type : ui.FieldType.TEXT		,label : 'Date'});
					sublist.addField({id : 'custpage_completed_by'	  ,type : ui.FieldType.TEXT		,label : 'Completed By'});
					sublist.addField({id : 'custpage_email'	  ,type : ui.FieldType.TEXT		,label : 'Email'});
					sublist.addField({id : 'custpage_note'		  ,type : ui.FieldType.TEXTAREA		,label : 'Note'});//TEXTAREA
					sublist.addField({id : 'custpage_phone'		  ,type : ui.FieldType.TEXT		,label : 'Phone'});	
					sublist.addField({id : 'custpage_newfollowup'		  ,type : ui.FieldType.TEXT		,label : 'New Followup'});	

            
			var filter=new Array();
                  if(fromdate!=''&&fromdate!=null&&todate!=''&&todate!=null)
			filter.push(search.createFilter({ name: "custrecord_followup_date",operator: "within",values:[fromdate,todate]}));
                  if(completed=='1'){
			filter.push(search.createFilter({ name: "custrecord_followup_completed",operator: "is",values:'F'}));
                  }else if(completed=='2'){
                   filter.push(search.createFilter({ name: "custrecord_followup_completed",operator: "is",values:'T'}));
                  }else if(completed=='0'){
                    
                  }else{
                  filter.push(search.createFilter({ name: "custrecord_followup_completed",operator: "is",values:'F'}));

                  }
                 if(assingned=='all'){
                  }else if(assingned){
			filter.push(search.createFilter({ name: "custrecord_assigned",operator: "anyof",values:assingned}));}else{
              filter.push(search.createFilter({ name: "custrecord_assigned",operator: "anyof",values:userId}));
log.debug('Internal ID of current user: ' + userObj.id);
            }
log.debug('filter',filter);
					var customerSearch = search.create({
						type: "customrecord_customer_follow_up",
						filters:filter,
							 columns:
								 [
								  search.createColumn({name: "custrecord_followup_title", label: "Title"}),
								  search.createColumn({name: "custrecord_followup_customer", label: "Customer"}),
								  search.createColumn({name: "custrecord_assigned", label: "Assigned"}),
								  search.createColumn({name: "custrecord_followup_completed", label: "Completed"}),
								  search.createColumn({name: "custrecord_complete_date", label: "Complete Date"}),
								  search.createColumn({name: "custrecord_followup_date",sort: search.Sort.ASC, label: "Date"}),
								  search.createColumn({name: "custrecord_followup_completedby", label: "Completed By"}),
								  search.createColumn({name: "custrecord_followup_email", label: "Email"}),
								  search.createColumn({name: "custrecord_followup_note", label: "Note"}),
								  search.createColumn({name: "custrecord_followup_phone", label: "Phone"})
								  ]
					});
					var searchResultCount = customerSearch.runPaged().count;
					log.debug("customrecord_customer_follow_upSearchObj result count",searchResultCount);

					var objPagedData = customerSearch.runPaged({
						pageSize: 1000
					});
					var lineIndex=0;
					var strSLURL = url.resolveScript({
						scriptId: 'customscript_sl_customer_reminders',
						deploymentId: 'customdeploy_sl_customer_reminders',
						returnExternalUrl: false
					});
					objPagedData.pageRanges.forEach(function(pageRange){
						var objPage = objPagedData.fetch({
							index: pageRange.index
						});
						objPage.data.forEach(function(result){
							var urlVal=strSLURL;
							urlVal += "&customer=" +result.getValue(result.columns[1]);
							//	strSLURL += "&phone=" + result.getValue(result.columns[9]);
                          	urlVal += "&flg=suitelet";

							urlVal += "&emailId=" +result.getValue(result.columns[7]);
							var completed_date=result.getValue(result.columns[4]);
							var completed=result.getValue(result.columns[3]);
							var completed_by=result.getText(result.columns[6]);
							var note=result.getValue(result.columns[8]);
							var email=result.getValue(result.columns[7]);
							var phone=result.getValue(result.columns[9]);
							var date=result.getValue(result.columns[5]);
							var newfollowup='';
							newfollowup+='<html>';
							newfollowup+='<a href='+urlVal+'>New Customer Followup</a></html>';
                          sublist.setSublistValue({id : 'custpage_followup_id',line : lineIndex,value : result.id});
                          var customerLink='';
                          if(result.getValue(result.columns[1])){
                            var output = url.resolveRecord({recordType:'customer',recordId:result.getValue(result.columns[1]),isEditMode:false});
									customerLink+='<html>';
									customerLink+='<a href='+output+'>'+result.getText(result.columns[1])+'</a></html>';
                          }
                          if( result.getValue(result.columns[0]))
							sublist.setSublistValue({id : 'custpage_title',line : lineIndex,value : result.getValue(result.columns[0])});
                          if(customerLink)
							sublist.setSublistValue({id : 'custpage_customer',line : lineIndex,value :customerLink });
                          if(result.getText(result.columns[2]))
							sublist.setSublistValue({id : 'custpage_assigned',line : lineIndex,value : result.getText(result.columns[2])});
							if(completed)
								sublist.setSublistValue({id : 'custpage_completed',line : lineIndex,value : 'T'});
							else{
								sublist.setSublistValue({id : 'custpage_completed',line : lineIndex,value : 'F'});
							}
							if(completed_date)
								sublist.setSublistValue({id : 'custpage_completed_date',line : lineIndex,value : completed_date});
							if(date)
								sublist.setSublistValue({id : 'custpage_date',line : lineIndex,value :date});
							if(completed_by)
								sublist.setSublistValue({id : 'custpage_completed_by',line : lineIndex,value :completed_by });
							if(email)
								sublist.setSublistValue({id : 'custpage_email',line : lineIndex,value : email});
							if(note)
								sublist.setSublistValue({id : 'custpage_note',line : lineIndex,value : note});
							if(phone)
								sublist.setSublistValue({id : 'custpage_phone',line : lineIndex,value : phone});
                          if(newfollowup)
							sublist.setSublistValue({id : 'custpage_newfollowup',line : lineIndex,value : newfollowup});

							lineIndex++;
						});
					});
					context.response.writePage(form);
				}

			}catch(e){log.error('ERROR',e)}

		}
		function getfileId(clientScript) {
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

		return {
			onRequest: onRequest
		};

	});