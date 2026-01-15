/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
var objRecord;
define(['N/currentRecord'],

		function(currentRecord) {



	/**
	 * Validation function to be executed when record is saved.
	 *
	 * @param {Object} scriptContext
	 * @param {Record} scriptContext.currentRecord - Current form record
	 * @returns {boolean} Return true if record is valid
	 *
	 * @since 2015.2
	 */
	function pageInit(scriptContext) {

		var currRecord = scriptContext.currentRecord;
		objRecord = currRecord;

	}
	function csvdownload(){
		var objRecord=currentRecord.get();

		var numLines = objRecord.getLineCount({
			sublistId: 'custpage_sublistid'
		});
		console.log(numLines);
		var xmlString='';

        
		xmlString+=['Property Name','Property Id', '% OWNED', 'ESTATE Name' ,'Customer' ,'Document', 'Invoice Date','Amount', 'Sale Amount',
        'Property Type', 'Estimated RP Value', 'Default Amount','Event Effective Date','Listing Status','Last Event Type Amount','Estimated Mortagage Amount','Estimated mortage amount last updated',
        'Preforeclosure Status','Auction Date'
        ,'Foreclosure Event Date']+ '\n';
		for (var i = 0; i <numLines; i++) {
			var row = [];
			row = [
			       objRecord.getSublistValue({sublistId: 'custpage_sublistid',fieldId: 'custpage_property',line: i}).trimStart(),
			       objRecord.getSublistValue({sublistId: 'custpage_sublistid',fieldId: 'custpage_internalid',line: i}),
			       objRecord.getSublistValue({sublistId: 'custpage_sublistid',fieldId: 'custpage_property_percent_owned',line: i}),
			       objRecord.getSublistValue({sublistId: 'custpage_sublistid',fieldId: 'custpage_estate_name',line: i}),  
			       objRecord.getSublistValue({sublistId: 'custpage_sublistid',fieldId: 'custpage_customer',line: i}),
			       objRecord.getSublistValue({sublistId: 'custpage_sublistid',fieldId: 'custpage_documentnumber',line: i}).trimStart(),
			       objRecord.getSublistValue({sublistId: 'custpage_sublistid',fieldId: 'custpage_invoicedatee',line: i}),
			       objRecord.getSublistValue({sublistId: 'custpage_sublistid',fieldId: 'custpage_amount',line: i}),
			       objRecord.getSublistValue({sublistId: 'custpage_sublistid',fieldId: 'custpage_salesamount',line: i}),
			       objRecord.getSublistValue({sublistId: 'custpage_sublistid',fieldId: 'custpage_property_type',line: i}),
			       objRecord.getSublistValue({sublistId: 'custpage_sublistid',fieldId: 'custpage_estimatedvalue',line: i}),
			       objRecord.getSublistValue({sublistId: 'custpage_sublistid',fieldId: 'custpage_default_amount',line: i}),
                   objRecord.getSublistValue({sublistId: 'custpage_sublistid',fieldId: 'custpage_event_effective_date',line: i}),
                   objRecord.getSublistValue({sublistId: 'custpage_sublistid',fieldId: 'custpage_event_type',line: i}),
                   objRecord.getSublistValue({sublistId: 'custpage_sublistid',fieldId: 'custpage_last_sale_valueamount',line: i}),
                   objRecord.getSublistValue({sublistId: 'custpage_sublistid',fieldId: 'custpage_est_mortage_amt_attom',line: i}),
                   objRecord.getSublistValue({sublistId: 'custpage_sublistid',fieldId: 'custpage_est_mortage_amt_last_update',line: i}),
                   objRecord.getSublistValue({sublistId: 'custpage_sublistid',fieldId: 'custpage_custrecord4',line: i}),
                   objRecord.getSublistValue({sublistId: 'custpage_sublistid',fieldId: 'custpage_auction_date',line: i}),
                   objRecord.getSublistValue({sublistId: 'custpage_sublistid',fieldId: 'custpage_foreclosure_event_date',line: i})


			       ]; 
			row = row.map(function(field) {
				field = field.replace(/,/g, ' ');
				return '' + field.replace(/"/g, '""') + '';
			});

			xmlString = xmlString + row.join() + '\n';

		}
		var element = document.createElement('a');
		element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(xmlString));
		element.setAttribute('download', "Open Property.csv");
		element.style.display = 'none';
		document.body.appendChild(element);
		element.click();
		document.body.removeChild(element);
	}

	return {

		pageInit: pageInit,
		csvdownload:csvdownload
	};

});