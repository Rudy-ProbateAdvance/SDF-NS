var header = ["Court Name","Jurisdiction","State of Case","Case Number","Pleading Title","Decedent Name",
              "Heir First","Heir Last","Heir Address","Heir City","Heir State","Heir Zip","Assignment Amount",
              "Rebate 1","Early Assign 1","Rebate 1 Time","Rebate 2","Early Assign 2","Rebate 2 Time","Rebate 3",
              "Early Assign 3","Rebate 3 Time","Cash Amount","Atty Name","Atty Firm","Atty Address","Atty City","Atty State","Atty Zip","Atty email","PR Name","PR Address","PR City","PR State","PR Zip","Sales Person","Court Address","Court City",
              "Court State","Court Zip"];

function Mail_Merge_CSV(request,response)
{
	try{
	var quoteId = request.getParameter("quote");

	var csvLine = [];

	var filters = [];
	filters.push(new nlobjSearchFilter("internalid",null,"is",quoteId));
	filters.push(new nlobjSearchFilter("mainline",null,"is","T"));
	var cols = [];
	cols.push(new nlobjSearchColumn("parent","customer"));
	cols.push(new nlobjSearchColumn("billaddress1","customer"));
	cols.push(new nlobjSearchColumn("billcity","customer"));
	cols.push(new nlobjSearchColumn("billstate","customer"));
	cols.push(new nlobjSearchColumn("billzipcode","customer"));
	cols.push(new nlobjSearchColumn("custbody_heir_first_name"));
	cols.push(new nlobjSearchColumn("custbody_heir_last_name"));
	cols.push(new nlobjSearchColumn("custbody_assignment_size"));
	cols.push(new nlobjSearchColumn("custbody_case_no"));
	cols.push(new nlobjSearchColumn("tranid"));
	cols.push(new nlobjSearchColumn("custbody_assignment_no"));
	cols.push(new nlobjSearchColumn("custbody_rebate_1_amount"));
	cols.push(new nlobjSearchColumn("custbody_rebate_1_month"));
	cols.push(new nlobjSearchColumn("custbody_rebate_2_month"));
	cols.push(new nlobjSearchColumn("custbody_rebate_3_month"));
	cols.push(new nlobjSearchColumn("custbody_rebate_2_amount"));
	cols.push(new nlobjSearchColumn("custbody_rebate_3_amount"));
	cols.push(new nlobjSearchColumn("custbody_county"));
	cols.push(new nlobjSearchColumn("custrecord_county_pleading_title","custbody_county"));
	cols.push(new nlobjSearchColumn("custrecord_county_court_name","custbody_county"));
	cols.push(new nlobjSearchColumn("custrecord_court_street_address","custbody_county"));
	cols.push(new nlobjSearchColumn("custrecord_court_city","custbody_county"));
	cols.push(new nlobjSearchColumn("custrecord_court_state","custbody_county"));
	cols.push(new nlobjSearchColumn("custrecord_court_zip","custbody_county"));
	cols.push(new nlobjSearchColumn("custbody_decedent_name"));
	cols.push(new nlobjSearchColumn("custbody_bill_address_1"));
	cols.push(new nlobjSearchColumn("custbody_bill_city"));
	cols.push(new nlobjSearchColumn("custbody_bill_state"));
	cols.push(new nlobjSearchColumn("custbody_bill_zip_code"));
	cols.push(new nlobjSearchColumn("custbody_court_name"));
	cols.push(new nlobjSearchColumn("custbody_advance_size"));
	cols.push(new nlobjSearchColumn("custbody_option_1_pricing"));
	cols.push(new nlobjSearchColumn("custbody_option_2_pricing"));
	cols.push(new nlobjSearchColumn("custbody_option_3_pricing"));
	cols.push(new nlobjSearchColumn("custbody_pleading_title"));
	cols.push(new nlobjSearchColumn("salesrep"));
	cols.push(new nlobjSearchColumn("billaddress1","custbody_attorney"));
	cols.push(new nlobjSearchColumn("billcity","custbody_attorney"));
	cols.push(new nlobjSearchColumn("billstate","custbody_attorney"));
	cols.push(new nlobjSearchColumn("billzipcode","custbody_attorney"));
	cols.push(new nlobjSearchColumn("email","custbody_attorney"));
	cols.push(new nlobjSearchColumn("entityid","custbody_attorney"));
	cols.push(new nlobjSearchColumn("custentity_law_firm","custbody_attorney"));
	cols.push(new nlobjSearchColumn("custbody_personal_rep"));
	cols.push(new nlobjSearchColumn("custbody_state_of_case"));
	cols.push(new nlobjSearchColumn("billaddress1","custbody_personal_rep"));
	cols.push(new nlobjSearchColumn("entityid","custbody_personal_rep"));
	cols.push(new nlobjSearchColumn("billcity","custbody_personal_rep"));
	cols.push(new nlobjSearchColumn("billstate","custbody_personal_rep"));
	cols.push(new nlobjSearchColumn("billzipcode","custbody_personal_rep"));
	cols.push(new nlobjSearchColumn("firstname","customer"));
	cols.push(new nlobjSearchColumn("lastname","customer"));
    cols.push(new nlobjSearchColumn("custentity_desired_advance_size","customer"));
    cols.push(new nlobjSearchColumn("custentity_early_rebate_option_1","customer"));
    cols.push(new nlobjSearchColumn("custentity_early_rebate_option_2","customer"));
    cols.push(new nlobjSearchColumn("custentity_early_rebate_option_3","customer"));
	var results = nlapiSearchRecord("estimate",null,filters,cols);
	var court_name='';
	var name='';
	var decedentname='';
	var pleading_title='';
	var state_case='';
	var court_street='';var court_zip='';var court_state='';var court_city='';
	if(results)
	{

		var estate = results[0].getValue("parent","customer");
		var searchObj=nlapiLookupField("customer",estate,["custentity1","companyname","custentity2"]);
		var caseNo = searchObj.custentity1;
		var countyid=searchObj.custentity2;
		decedentname=searchObj.companyname;
		var customerObj= nlapiLookupField("customer",estate,['custentity3'],'T');
		state_case=customerObj.custentity3;
		nlapiLogExecution("debug", "state_case",state_case);
		var attorneyFlds = null;
		var personalRepFlds = null;
		if (estate != null && estate != "") {
			var filters = [];
//			filters.push(new nlobjSearchFilter("company", null, "is", estate));
			filters.push(new nlobjSearchFilter("internalid", "company", "is", estate));
			filters.push(new nlobjSearchFilter("category", null, "is", "1")); //Contact Category = Attorney
			var cols = [];
			cols.push(new nlobjSearchColumn("custentity_law_firm"));
			cols.push(new nlobjSearchColumn("entityid"));
			cols.push(new nlobjSearchColumn("email"));
			cols.push(new nlobjSearchColumn("phone"));
			cols.push(new nlobjSearchColumn("billaddress1"));
			cols.push(new nlobjSearchColumn("billcity"));
			cols.push(new nlobjSearchColumn("billstate"));
			cols.push(new nlobjSearchColumn("billzipcode"));
			var attresults = nlapiSearchRecord("contact", null, filters, cols);
			if (attresults) {
				attorneyFlds = attresults[0];
			}
			var filters = [];
			filters.push(new nlobjSearchFilter("internalid", "company", "anyof", estate));
			filters.push(new nlobjSearchFilter("role", null, "is", "-10")); //Contact Category = Personal Representative
			var cols = [];
			cols.push(new nlobjSearchColumn("entityid"));
			cols.push(new nlobjSearchColumn("email"));
			cols.push(new nlobjSearchColumn("phone"));
			cols.push(new nlobjSearchColumn("billaddress1"));
			cols.push(new nlobjSearchColumn("billcity"));
			cols.push(new nlobjSearchColumn("billstate"));
			cols.push(new nlobjSearchColumn("billzipcode"));
			var perresults = nlapiSearchRecord("contact", null, filters, cols);
			if (perresults) {
				personalRepFlds = perresults[0];
			}
		}
		if(countyid){
			var county = nlapiLookupField("customrecord173", countyid, ["custrecord_county_pleading_title", "custrecord_county_address_of_court", "custrecord_county_court_phone_number", "custrecord_county_court_name", "custrecord_court_street_address", "custrecord_court_city", "custrecord_court_state", "custrecord_court_zip",'name']);
			court_name=county.custrecord_county_court_name;
			name=county.name;
			pleading_title=county.custrecord_county_pleading_title;
			court_street=county.custrecord_court_street_address;
			court_city=county.custrecord_court_city;
			court_state=county.custrecord_court_state;
			court_zip=county.custrecord_court_zip;

		}
		csvLine.push('"' +court_name  + '"');
		csvLine.push('"' +  name+ '"');
		csvLine.push('"' + state_case+ '"');

		csvLine.push('"' + caseNo + '"');
		csvLine.push('"' + pleading_title.replace(/\n/g," ") + '"');
		csvLine.push('"' + decedentname + '"');
		csvLine.push('"' + results[0].getValue("firstname","customer") + '"');
		csvLine.push('"' + results[0].getValue("lastname","customer") + '"');
		csvLine.push('"' + results[0].getValue("billaddress1","customer") + '"');
		csvLine.push('"' + results[0].getValue("billcity","customer") + '"');
		csvLine.push('"' + results[0].getValue("billstate","customer") + '"');
		csvLine.push('"' + results[0].getValue("billzipcode","customer") + '"');
		csvLine.push('"' + results[0].getValue("custbody_assignment_size") + '"');
		csvLine.push('"' + results[0].getValue("custbody_rebate_1_amount") + '"');
		csvLine.push('"' + results[0].getValue("custbody_option_1_pricing") + '"');
		csvLine.push('"' + results[0].getText("custbody_rebate_1_month") + '"');
		csvLine.push('"' + results[0].getValue("custbody_rebate_2_amount") + '"');
		csvLine.push('"' + results[0].getValue("custbody_option_2_pricing") + '"');
		csvLine.push('"' + results[0].getText("custbody_rebate_2_month") + '"');
		csvLine.push('"' + results[0].getValue("custbody_rebate_3_amount") + '"');
		csvLine.push('"' + results[0].getValue("custbody_option_3_pricing") + '"');
		csvLine.push('"' + results[0].getText("custbody_rebate_3_month") + '"');
		//csvLine.push('"' + results[0].getValue("custentity_desired_advance_size","customer") + '"');
      csvLine.push('"' + results[0].getValue("custbody_advance_size") + '"');
      
		if(attorneyFlds){
        var eid=attorneyFlds.getValue("entityid");
        if(eid.match(/:/)) {
          eid=eid.replace(/ :.*/,'');
        }
		csvLine.push('"' + eid + '"');
//		csvLine.push('"' + attorneyFlds.getValue("entityid") + '"');
		csvLine.push('"' + attorneyFlds.getValue("custentity_law_firm") + '"');
		csvLine.push('"' + attorneyFlds.getValue("billaddress1") + '"');
		csvLine.push('"' + attorneyFlds.getValue("billcity") + '"');
		csvLine.push('"' + attorneyFlds.getValue("billstate") + '"');
		csvLine.push('"' + attorneyFlds.getValue("billzipcode") + '"');
		csvLine.push('"' + attorneyFlds.getValue("email") + '"');
        }else{
          csvLine.push('');
          csvLine.push('');
          csvLine.push('');
          csvLine.push('');
          csvLine.push('');
          csvLine.push('');
	  	  csvLine.push('');
        }
      if(personalRepFlds){
        var eid=personalRepFlds.getValue("entityid");
        if(eid.match(/:/)) {
          eid=eid.replace(/ :.*/,'');
        }
		csvLine.push('"' + eid + '"');
//		csvLine.push('"' + personalRepFlds.getValue("entityid") + '"');
		csvLine.push('"' + personalRepFlds.getValue("billaddress1") + '"');
		csvLine.push('"' + personalRepFlds.getValue("billcity") + '"');
		csvLine.push('"' + personalRepFlds.getValue("billstate") + '"');
		csvLine.push('"' + personalRepFlds.getValue("billzipcode") + '"');
      }else{
        csvLine.push('');
        csvLine.push('');
        csvLine.push('');
        csvLine.push('');
        csvLine.push('');
      }

		csvLine.push('"' + results[0].getText("salesrep") + '"');

		csvLine.push('"' + court_street+ '"');
		csvLine.push('"' + court_city + '"');
		csvLine.push('"' + court_state+ '"');
		csvLine.push('"' + court_zip + '"');
	}

	var csvFileStr = header.join(",") + "\n" + csvLine.join(",");

	var csvFile = nlapiCreateFile(results[0].getValue("tranid")+".csv","CSV",csvFileStr);

	response.setContentType("CSV",results[0].getValue("tranid")+".csv","attachment");
	response.write(csvFile.getValue());
	}catch(e){        nlapiLogExecution("error", "error",e);
}
}