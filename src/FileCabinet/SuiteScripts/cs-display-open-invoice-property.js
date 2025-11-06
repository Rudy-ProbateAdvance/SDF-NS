/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
var objRecord;
define(['N/currentRecord'], function(cr) {
	function pageInit(scriptContext) {
      return true;
	}

	function csv1download() {
		var objRecord=cr.get();

		var numLines = objRecord.getLineCount({
			sublistId: 'sublist1'
		});
		console.log(numLines);
		var xmlString='';

        
		xmlString+='"PROPERTY NAME","PROPERTY ID","ESTATE","TOTAL INVOICE AMOUNT","LAST COMMUNICATION DATE","% OWNED","ESCROW","DOT (DEED OF TRUST)","LISTING STATUS","LAST EVENT TYPE AMOUNT","VALUE","EVENT EFFECTIVE DATE","LAST SALE DATE","SALE AMOUNT","ESTIMATED RP VALUE","DEFAULT AMOUNT","ESTIMATED MORTGAGE AMOUNT","ESTIMATED MORTGAGE AMOUNT LAST UPDATED","PREFORECLOSURE STATUS","AUCTION DATE","FORECLOSURE EVENT DATE","OWNER NAME","PROPERTY TYPE","APN"'+ '\n'; //headers
		for (var i = 0; i <numLines; i++) {
			var row = [];
			row = [
			       objRecord.getSublistValue({sublistId: 'sublist1',fieldId: 'a',line: i}).trim(),
			       objRecord.getSublistValue({sublistId: 'sublist1',fieldId: 'b',line: i}).trim(),
			       objRecord.getSublistValue({sublistId: 'sublist1',fieldId: 'c',line: i}).trim(),
			       objRecord.getSublistValue({sublistId: 'sublist1',fieldId: 'd',line: i}).trim(),
			       objRecord.getSublistValue({sublistId: 'sublist1',fieldId: 'e',line: i}).trim(),
			       objRecord.getSublistValue({sublistId: 'sublist1',fieldId: 'f',line: i}).trim(),
			       objRecord.getSublistValue({sublistId: 'sublist1',fieldId: 'g',line: i}).trim(),
			       objRecord.getSublistValue({sublistId: 'sublist1',fieldId: 'h',line: i}).trim(),
			       objRecord.getSublistValue({sublistId: 'sublist1',fieldId: 'i',line: i}).trim(),
			       objRecord.getSublistValue({sublistId: 'sublist1',fieldId: 'j',line: i}).trim(),
			       objRecord.getSublistValue({sublistId: 'sublist1',fieldId: 'k',line: i}).trim(),
			       objRecord.getSublistValue({sublistId: 'sublist1',fieldId: 'l',line: i}).trim(),
                   objRecord.getSublistValue({sublistId: 'sublist1',fieldId: 'm',line: i}).trim(),
                   objRecord.getSublistValue({sublistId: 'sublist1',fieldId: 'n',line: i}).trim(),
                   objRecord.getSublistValue({sublistId: 'sublist1',fieldId: 'o',line: i}).trim(),
                   objRecord.getSublistValue({sublistId: 'sublist1',fieldId: 'p',line: i}).trim(),
                   objRecord.getSublistValue({sublistId: 'sublist1',fieldId: 'q',line: i}).trim(),
                   objRecord.getSublistValue({sublistId: 'sublist1',fieldId: 'r',line: i}).trim(),
                   objRecord.getSublistValue({sublistId: 'sublist1',fieldId: 's',line: i}).trim(),
                   objRecord.getSublistValue({sublistId: 'sublist1',fieldId: 't',line: i}).trim(),
                   objRecord.getSublistValue({sublistId: 'sublist1',fieldId: 'u',line: i}).trim(),
                   objRecord.getSublistValue({sublistId: 'sublist1',fieldId: 'v',line: i}).trim(),
                   objRecord.getSublistValue({sublistId: 'sublist1',fieldId: 'w',line: i}).trim(),
                   objRecord.getSublistValue({sublistId: 'sublist1',fieldId: 'x',line: i}).trim(),
			       ]; 
			row = row.map(function(field) {
				field = field.replace(/,/g, ' ');
				return '' + field.replace(/"/g, '""') + '';
			});

			xmlString = xmlString + '"' + row.join('","') + '"\n';

		}
        var d=new Date();
        var datestring=d.getFullYear().toString()
            +(d.getMonth()+1).toString().padStart(2,'0')
            +(d.getDate()).toString().padStart(2,'0');
		var element = document.createElement('a');
		element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(xmlString));
		element.setAttribute('download', "Status Change Within Past Month - "+datestring+".csv");
		element.style.display = 'none';
		document.body.appendChild(element);
		element.click();
		document.body.removeChild(element);
		return true;
	}
	
	function csv2download(){
		var objRecord=cr.get();

		var numLines = objRecord.getLineCount({
			sublistId: 'sublist2'
		});
		console.log(numLines);
		var xmlString='';

        
		xmlString+='"Property Name","Property Id","Estate","Customer","Invoice Number","Invoice Date","Total Invoice Amount","% Owned","Preforeclosure Status","Estimated Amount","Listing Status","Last Event Type Amount","Event Effective Date","Sale Amount","Last Sale Date","Estimated Mortgage Amount","Estimated Mortgage Amount Last Updated","Auction Date","Attom Address","Owner Name","Property Type","APN","Foreclosure Event Date"'+ '\n'; //headers
		for (var i = 0; i <numLines; i++) {
			var row = [];
			row = [
			       objRecord.getSublistValue({sublistId: 'sublist2',fieldId: 'a',line: i}).trim(),
			       objRecord.getSublistValue({sublistId: 'sublist2',fieldId: 'b',line: i}).trim(),
			       objRecord.getSublistValue({sublistId: 'sublist2',fieldId: 'c',line: i}).trim(),
			       objRecord.getSublistValue({sublistId: 'sublist2',fieldId: 'd',line: i}).trim(),
			       objRecord.getSublistValue({sublistId: 'sublist2',fieldId: 'e',line: i}).trim(),
			       objRecord.getSublistValue({sublistId: 'sublist2',fieldId: 'f',line: i}).trim(),
			       objRecord.getSublistValue({sublistId: 'sublist2',fieldId: 'g',line: i}).trim(),
			       objRecord.getSublistValue({sublistId: 'sublist2',fieldId: 'h',line: i}).trim(),
			       objRecord.getSublistValue({sublistId: 'sublist2',fieldId: 'i',line: i}).trim(),
			       objRecord.getSublistValue({sublistId: 'sublist2',fieldId: 'j',line: i}).trim(),
			       objRecord.getSublistValue({sublistId: 'sublist2',fieldId: 'k',line: i}).trim(),
			       objRecord.getSublistValue({sublistId: 'sublist2',fieldId: 'l',line: i}).trim(),
                   objRecord.getSublistValue({sublistId: 'sublist2',fieldId: 'm',line: i}).trim(),
                   objRecord.getSublistValue({sublistId: 'sublist2',fieldId: 'n',line: i}).trim(),
                   objRecord.getSublistValue({sublistId: 'sublist2',fieldId: 'o',line: i}).trim(),
                   objRecord.getSublistValue({sublistId: 'sublist2',fieldId: 'p',line: i}).trim(),
                   objRecord.getSublistValue({sublistId: 'sublist2',fieldId: 'q',line: i}).trim(),
                   objRecord.getSublistValue({sublistId: 'sublist2',fieldId: 'r',line: i}).trim(),
                   objRecord.getSublistValue({sublistId: 'sublist2',fieldId: 's',line: i}).trim(),
                   objRecord.getSublistValue({sublistId: 'sublist2',fieldId: 't',line: i}).trim(),
                   objRecord.getSublistValue({sublistId: 'sublist2',fieldId: 'u',line: i}).trim(),
                   objRecord.getSublistValue({sublistId: 'sublist2',fieldId: 'v',line: i}).trim(),
                   objRecord.getSublistValue({sublistId: 'sublist2',fieldId: 'w',line: i}).trim(),
			       ]; 
			row = row.map(function(field) {
				field = field.replace(/,/g, ' ');
				return '' + field.replace(/"/g, '""') + '';
			});

			xmlString = xmlString + '"' + row.join('","') + '"\n';

		}
        var d=new Date();
        var datestring=d.getFullYear().toString()
            +(d.getMonth()+1).toString().padStart(2,'0')
            +(d.getDate()).toString().padStart(2,'0');
		var element = document.createElement('a');
		element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(xmlString));
		element.setAttribute('download', "Preforeclosure Status - "+datestring+".csv");
		element.style.display = 'none';
		document.body.appendChild(element);
		element.click();
		document.body.removeChild(element);
        return true;
	}

	function csv3download() {
		var objRecord=cr.get();

		var numLines = objRecord.getLineCount({
			sublistId: 'sublist3'
		});
		console.log(numLines);
		var xmlString='';

        
		xmlString+='"PROPERTY NAME","ESTATE","TOTAL INVOICE AMOUNT","LAST COMMUNICATION DATE","DOT (DEED OF TRUST)"'+ '\n'; //headers
		for (var i = 0; i <numLines; i++) {
			var row = [];
			row = [
			       objRecord.getSublistValue({sublistId: 'sublist3',fieldId: 'a',line: i}).trim(),
			       objRecord.getSublistValue({sublistId: 'sublist3',fieldId: 'b',line: i}).trim(),
			       objRecord.getSublistValue({sublistId: 'sublist3',fieldId: 'c',line: i}).trim(),
			       objRecord.getSublistValue({sublistId: 'sublist3',fieldId: 'd',line: i}).trim(),
			       objRecord.getSublistValue({sublistId: 'sublist3',fieldId: 'e',line: i}).trim(),
			       ]; 
			row = row.map(function(field) {
				field = field.replace(/,/g, ' ');
				return '' + field.replace(/"/g, '""') + '';
			});

			xmlString = xmlString + '"' + row.join('","') + '"\n';

		}
        var d=new Date();
        var datestring=d.getFullYear().toString()
            +(d.getMonth()+1).toString().padStart(2,'0')
            +(d.getDate()).toString().padStart(2,'0');
		var element = document.createElement('a');
		element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(xmlString));
		element.setAttribute('download', "DOT REPORT - "+datestring+".csv");
		element.style.display = 'none';
		document.body.appendChild(element);
		element.click();
		document.body.removeChild(element);
        return true;
	}

	return {
		pageInit:pageInit,
		csv1download:csv1download,
		csv2download:csv2download,
		csv3download:csv3download,
	};

});