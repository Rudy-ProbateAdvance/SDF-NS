function Deal_Backlog_CS_FC(type,name,linenum)
{			

   
	if(type=="custpage_deals" && name=="custpage_marketing_channel")
	{
		try
		{
			var marketingChannel = nlapiGetLineItemValue("custpage_deals","custpage_marketing_channel",linenum);
			
			var customerId = nlapiGetLineItemValue("custpage_deals","custpage_customer_internalid",linenum);
			
			nlapiSubmitField("customer",customerId,"leadsource",marketingChannel);
		}
		catch(err)
		{
			nlapiLogExecution("error","Error Updating Marketing Channel","Details: " + err.message);
		}
	}
	else if(type=="custpage_deals" && name=="custpage_sales_person")
	{
		try
		{
			var salesRep = nlapiGetLineItemValue("custpage_deals","custpage_sales_person",linenum);
			
			var quoteId = nlapiGetLineItemValue("custpage_deals","custpage_quote_internalid",linenum);
			console.log("Quote ID: " + quoteId);
			
			if(quoteId!=null && quoteId!="")
			{
				var quote = nlapiLoadRecord("estimate",quoteId);
			
				for(var x=0; x < quote.getLineItemCount("salesteam"); x++)
				{
					quote.removeLineItem("salesteam",x+1);
					x--;
				}
				
				quote.selectNewLineItem("salesteam");
				quote.setCurrentLineItemValue("salesteam","employee",salesRep);
				quote.setCurrentLineItemValue("salesteam","isprimary","T");
				quote.commitLineItem("salesteam");
				
				nlapiSubmitRecord(quote,true,true);
			}
			else
			{
				var customerId = nlapiGetLineItemValue("custpage_deals","custpage_customer_internalid",linenum);
				
				var customer = nlapiLoadRecord("customer",customerId);
			
				for(var x=0; x < customer.getLineItemCount("salesteam"); x++)
				{
					customer.removeLineItem("salesteam",x+1);
					x--;
				}
				
				customer.selectNewLineItem("salesteam");
				customer.setCurrentLineItemValue("salesteam","employee",salesRep);
				customer.setCurrentLineItemValue("salesteam","isprimary","T");
				customer.commitLineItem("salesteam");
				
				nlapiSubmitRecord(customer,true,true);
			}
		}
		catch(err)
		{
			nlapiLogExecution("error","Error Updating Sales Rep","Details: " + err.message);
		}
	}
	else if(type=="custpage_deals" && name=="custpage_case_status")
	{
		try
		{
			var caseStatus = nlapiGetLineItemValue("custpage_deals","custpage_case_status",linenum);
			var caseStatusRec = nlapiGetLineItemValue("custpage_deals","custpage_case_status_internalid",linenum);
			
			nlapiSubmitField("customrecord_case_status",caseStatusRec,"custrecord_case_status_status",caseStatus);
		}
		catch(err)
		{
			nlapiLogExecution("error","Error Updating Case Status","Details: " + err.message);
		}
	}
	else if(type=="custpage_deals" && name=="custpage_notes")
	{
		try
		{
			var caseNotes = nlapiGetLineItemValue("custpage_deals","custpage_notes",linenum);
			//var caseStatusRec = nlapiGetLineItemValue("custpage_deals","custpage_case_status_internalid",linenum);
			var caseStatus = nlapiGetLineItemValue("custpage_deals","custpage_case_status",linenum);
			var customer = nlapiGetLineItemValue("custpage_deals","custpage_customer_internalid",linenum);
			
			//Create new case status note
			var caseStatusRec = nlapiCreateRecord("customrecord_case_status");
			caseStatusRec.setFieldValue("custrecord_case_status_status",caseStatus);
			caseStatusRec.setFieldValue("custrecord_case_status_notes",caseNotes);
			caseStatusRec.setFieldValue("custrecord_case_status_customer",customer);
			var caseStatusRecId = nlapiSubmitRecord(caseStatusRec,true,true);
			
			//nlapiSubmitField("customrecord_case_status",caseStatusRec,"custrecord_case_status_notes",caseNotes);
		}
		catch(err)
		{
			nlapiLogExecution("error","Error Updating Case Status Notes","Details: " + err.message);
		}
	} if(type=='custpage_deals'&&name=='custpage_diligence'){
		try
		{			console.log('enter')

			var phonecall = nlapiCreateRecord("phonecall", {
		          recordmode: "dynamic"
		        });
	        var subject='Assigned Diligence assignee';
	        var todaydate=new Date();
	        var date=nlapiDateToString(todaydate);
         			var estateId = nlapiGetLineItemValue("custpage_deals","custpage_estate_internalid",linenum);
         			var diligence = nlapiGetLineItemValue("custpage_deals","custpage_diligence",linenum);
         var customerId = nlapiGetLineItemValue("custpage_deals","custpage_customer_internalid",linenum);
                 if(diligence!=''&&diligence!=''){
		        phonecall.setFieldValue("company", estateId);
		        phonecall.setFieldValue("title", subject);
		        phonecall.setFieldValue("startdate",date);
		        phonecall.setFieldValue("assigned", diligence);
		        phonecall.setFieldValue("message", subject);
		        var phonecallId = nlapiSubmitRecord(phonecall, true, true);
                   			console.log(phonecallId);
                   nlapiSubmitField("customer", customerId, "custentity_diligence_assignee", diligence);
                 }else{
                nlapiSubmitField("customer", customerId, "custentity_diligence_assignee", '');}

		}
		catch(err)
		{
			nlapiLogExecution("error","Error Updating Case Status Notes","Details: " + err.message);
		}
   }
}


/*
function onDownload(){
  var columns=JSON.parse(nlapiGetFieldValue('custpage_datastore'));
  var lineCount = nlapiGetLineItemCount("custpage_deals");
    if (lineCount > 0) {
    	var xmlString = 'Decedent Name,Total Assignment,Est Date of Distr,LIST OF INVOICES,COUNTY,LAST PHONE CALL DATE,SUBJECT,MESSAGE,NEXT EVENT DATE,SUBJECT,ESTATE STATUS,Dot,ESCROW,BLOCKED ACCOUNT LETTER,PROBLEM CASE\n'; 
    	var content=[];
	    for (var line = 1; line <= lineCount; line++) {
          var invoice_list=nlapiGetLineItemValue("custpage_deals", "custpage_invoice_list_text", line);
          const strCopy = invoice_list.split(',');
          for (var index = 0; index < strCopy.length; index++) {
          var row = [];
		    	row = [
		    	           	nlapiGetLineItemValue("custpage_deals", "custpage_decedent_name_text", line),
		    	           	nlapiGetLineItemValue("custpage_deals", "custpage_total_assignment", line), 
		    	           	nlapiGetLineItemValue("custpage_deals", "custpage_est_date_of_distr", line),
			           		strCopy[index],
			           		nlapiGetLineItemValue("custpage_deals", "custpage_county", line),
			           		nlapiGetLineItemValue("custpage_deals", "custpage_last_phone_date", line),
			           		nlapiGetLineItemValue("custpage_deals", "custpage_last_phone_subject", line),
			           		nlapiGetLineItemValue("custpage_deals", "custpage_last_phone_message", line),
			           		nlapiGetLineItemValue("custpage_deals", "custpage_next_event_date", line),
			           		nlapiGetLineItemValue("custpage_deals", "custpage_next_event_subject", line),
			           		nlapiGetLineItemValue("custpage_deals", "custpage_estate_status_part", line),
			           		nlapiGetLineItemValue("custpage_deals", "custpage_dot", line),
			                nlapiGetLineItemValue("custpage_deals", "custpage_escrow", line),
			           	    nlapiGetLineItemValue("custpage_deals", "custpage_blocked_account", line),
			           	    nlapiGetLineItemValue("custpage_deals", "custpage_problem_case", line)
			          
	           		]; 
       	content.push(row);
          }

	    }
    }
 var  finalVal='';
  for (var i = 0; i < content.length; i++) {
    var value = content[i];
    for (var j = 0; j < value.length; j++) {
        var innerValue =  value[j]===null?'':value[j].toString();
        var result = innerValue.replace(/"/g, '""');
        if (result.search(/("|,|\n)/g) >= 0)
            result = '"' + result + '"';
        if (j > 0)
            finalVal += ',';
        finalVal += result;
    }

    finalVal += '\n';
}
  xmlString+=finalVal;
	var element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(xmlString));
    element.setAttribute('download', "Diligence List Report.csv");
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}
*/
function onDownload(){
  debugger;
  var columns=JSON.parse(nlapiGetFieldValue('custpage_datastore'));
  var fieldids=[];
  console.log(columns);
  var lineCount = nlapiGetLineItemCount("custpage_deals");
  if (lineCount > 0) {
//    var xmlString = 'Decedent Name,Total Assignment,Est Date of Distr,LIST OF INVOICES,COUNTY,LAST PHONE CALL DATE,SUBJECT,MESSAGE,NEXT EVENT DATE,SUBJECT,ESTATE STATUS,Dot,ESCROW,BLOCKED ACCOUNT LETTER,PROBLEM CASE\n';
    var xmlString = '';
    var len=columns.length;
    for(var z=0; z<len; z++) {
      if(columns[z].id!='custpage_invoice_list_of') {
        if(columns[z].id=='custpage_decedent_name') {
          fieldids.push('custpage_decedent_name_text');
        } else {
          fieldids.push(columns[z].id);
        }
        xmlString+=columns[z].label;
        if(len-z>1) {
          xmlString+=',';
        }
      }
    }
    xmlString+='\n';
    var content=[];
    for (var line = 1; line <= lineCount; line++) {
      var invoice_list=nlapiGetLineItemValue("custpage_deals", "custpage_invoice_list_text", line);
      const strCopy = invoice_list.split(',');
      for (var index = 0; index < strCopy.length; index++) {
        var row = [];
        for(var z=0; z<fieldids.length; z++) {
          row.push(nlapiGetLineItemValue("custpage_deals", fieldids[z], line));
        }
        var r=row.slice(0,3);
        r.push(strCopy[index]);
        r=r.concat(row.slice(4));

        content.push(r);
      }

    }
  }
  var  finalVal='';
  for (var i = 0; i < content.length; i++) {
    var value = content[i];
    for (var j = 0; j < value.length; j++) {
      var innerValue =  value[j]===null?'':value[j].toString();
      var result = innerValue.replace(/"/g, '""');
      if (result.search(/("|,|\n)/g) >= 0)
        result = '"' + result + '"';
      if (j > 0)
        finalVal += ',';
      finalVal += result;
    }

    finalVal += '\n';
  }
  xmlString+=finalVal;
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(xmlString));
  element.setAttribute('download', "Diligence List Report.csv");
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}



/***************************************************************************/
  function getDateTime(date) {
    console.log(date);
    var d;
    if(!!date)
      d=new Date(date);
    else
      d=new Date();
    var datestring=d.getFullYear()+(d.getMonth()+1).toString().padStart(2,'0')+(d.getDate()).toString().padStart(2,'0')+'-'+(d.getHours()).toString().padStart(2,'0')+(d.getMinutes()).toString().padStart(2,'0')+(d.getSeconds()).toString().padStart(2,'0');
    return datestring;
  }

  function getcsvdata(sublistId) {
    tables=document.getElementsByTagName('table');
    var mytable=null;
    for(var i=0; i<tables.length; i++) {
      var table=tables[i];
      if(table.id.match(sublistId)) {
        mytable=table;
      }
    }    var b=mytable.getElementsByTagName('tbody');
    var rows=b[0].childNodes;
    var data=[];
    data[0]=rows[0].innerText.split(/\n\t\n/);
    for(var i=2; i<rows.length; i+=2) {
      data.push(rows[i].innerText.split(/\t/));
    }
    return data;
  }

  function csvexport() {
//    alert(`sublistId:${sublistId}, filename:${filename}, mapfunction:${mapfunction}`);
    var mapfunction=null;
    var filename='DiligenceListCsv ';
    var data=getcsvdata('custpage_deals');
    var xmlstring='';
    for(var i=0; i<data.length; i++) {
      data[i]=data[i].map(function(field) {return field.trim()});
      data[i]=data[i].map(function(field) {return field.replace(/"/g,'""')});
      if(mapfunction!=null && mapfunction!=undefined) {
        data[i]=data[i].map(mapfunction);
      }
      xmlstring += '"' + data[i].join('","') + '"\r\n';
    }
//    return xmlstring.trim();
    var d = new Date();
    var datestring = getDateTime();
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(xmlstring));
    element.setAttribute('download', filename + " - " + datestring + ".csv");
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    return true;
  }
