function Lead_API(datain) {
  nlapiLogExecution("DEBUG", "-BEGIN-")
  var rtnObj = {
    success: true,
    message: "connection successful"
  };
  var data = datain;
  var accountId=nlapiGetContext().company;
  var accountURL=accountId.toLowerCase().replace('_','-');
  var baseURL='https://'+accountURL+'.app.netsuite.com';
  nlapiLogExecution("debug", "Incoming Data", JSON.stringify(datain));
  //  if(!!!datain.sourceurl) {
  //    datain.sourceurl="not-received";
  //  }
  //  if(datain.sourceurl=='https://probateadvance.com/cc-app/') {
  //    datain.sourceurl="REP";
  //  }
  if(!datain.sourceurl)
    datain.sourceurl = '';
  datain.sourceurl = datain.sourceurl.split('?')[0];
  //  nlapiLogExecution("debug", "sourceurl", datain.sourceurl);
  send_email(data);
  try {
    //Lookup marketing campaign if provided
    var campaign = "";
    var customerId;
    if(datain.adgroup != null && datain.adgroup != "") {
      var filters = [];
      filters.push(new nlobjSearchFilter("custrecord_pub_id", null, "is", datain.adgroup));
      var cols = [];
      cols.push(new nlobjSearchColumn("custrecord_ns_lead_source"));
      var results = nlapiSearchRecord("customrecord_pub_id_mapping", null, filters, cols);
      if(results) {
        campaign = results[0].getValue("custrecord_ns_lead_source");
      }
    }

    var estate = nlapiCreateRecord("customer");
    estate.setFieldValue("subsidiary", "2");
    estate.setFieldValue("isperson", "F");
    var estname = datain.heriting_from.trim();
    if(estname == '' || estname == null) {
      estname = "[TEMP] " + datain.firstname + " " + datain.lastname;
    }
    if(datain.test == "test") {
      nlapiLogExecution("DEBUG", "Found test parameter");
      nlapiLogExecution("DEBUG", "--END--");
      return {"status":true, "message":"found test parameter", "datain":datain};
    }
    estate.setFieldValue("companyname", estname);
    estate.setFieldValue("category", "2");
    estate.setFieldValue("custentity_source", 'web services');
    estate.setFieldValue("custentity1", datain.cnumber);
    var statefile = datain.statefile;
    var countyfile = datain.countyfile;
    estate.setFieldValue("custentity3", mapStateAbbrev(mapState(statefile).abbrev));
    var notes = datain.notes;
    if(statefile && countyfile) {
      var cty = statefile + "_" + countyfile;
      try {
        estate.setFieldText("custentity2", cty);
      } catch (e) {
        log.debug('error setting county:' + estateId + '; ' + cty);
      }
    }
    estateId = nlapiSubmitRecord(estate, true, true);
    nlapiLogExecution("debug", "Created estate record "+estateId, baseURL+'/app/site/hosting/scriptlet.nl?script=180&deploy=1&compid='+accountId+'&estate='+estateId);
    try {
      var phone = datain.phone;
      if((phone[0] == '+' && phone[1] != '1') || phone[0] == '0' || phone == null) {
        datain.phone = "";
      }
      //        nlapiLogExecution("audit", "updated phone", datain.phone);
    } catch (e) {
      nlapiLogExecution("DEBUG", e.name, e.message);
    }
    try {
      var customer = nlapiCreateRecord("customer", {
        recordmode: "dynamic"
      });
      customer.setFieldValue("subsidiary", "2");
      customer.setFieldValue("isperson", "T");
      customer.setFieldValue("firstname", datain.firstname);
      customer.setFieldValue("lastname", datain.lastname);
      customer.setFieldValue("phone", datain.phone);
      customer.setFieldValue("altphone", datain.phone);
      customer.setFieldValue("email", datain.email);
      customer.setFieldValue("category", "1");
      customer.setFieldValue("custentity_infusionsoft_id", datain.infusionsoft_id);
      customer.setFieldValue("custentity_campaign", formatNull(datain.campaign));
      customer.setFieldValue("custentity_adgroup", formatNull(datain.adgroup));
      customer.setFieldValue("custentity_keyword", formatNull(datain.keyword));
      customer.setFieldValue("custentity_click_id", formatNull(datain.click_id));
      customer.setFieldValue("custentity_creative", formatNull(datain.creative));
      customer.setFieldValue("custentity_device", formatNull(datain.device));
      customer.setFieldValue("custentity_matchtype", formatNull(datain.matchtype));
      customer.setFieldValue("custentity_sourceurl", formatNull(datain.sourceurl));
      customer.setFieldValue("leadsource", campaign);
      customer.setFieldValue("parent", estateId);
      customer.setFieldValue("custentity_source", 'web services');
      customerId = nlapiSubmitRecord(customer, true, true);
    nlapiLogExecution("debug", "Created customer record "+customerId, baseURL+'/app/site/hosting/scriptlet.nl?script=180&deploy=1&compid='+accountId+'&customer='+customerId);
    } catch (err) {
      nlapiLogExecution("error", "Error Creating Customer", "Details: " + err.message + '; ' + JSON.stringify(err) + '\n\n' + JSON.stringify(datain));
      try {
        nlapiLogExecution("debug", "Trying again without email and phone fields...");
        var cust = nlapiCreateRecord("customer", {
          recordmode: "dynamic"
        });
        cust.setFieldValue("subsidiary", "2");
        cust.setFieldValue("isperson", "T");
        cust.setFieldValue("firstname", datain.firstname);
        cust.setFieldValue("lastname", datain.lastname);
        cust.setFieldValue("category", "1");
        cust.setFieldValue("custentity_infusionsoft_id", datain.infusionsoft_id);
        cust.setFieldValue("custentity_campaign", formatNull(datain.campaign));
        cust.setFieldValue("custentity_adgroup", formatNull(datain.adgroup));
        cust.setFieldValue("custentity_keyword", formatNull(datain.keyword));
        cust.setFieldValue("custentity_click_id", formatNull(datain.click_id));
        cust.setFieldValue("custentity_creative", formatNull(datain.creative));
        cust.setFieldValue("custentity_device", formatNull(datain.device));
        cust.setFieldValue("custentity_matchtype", formatNull(datain.matchtype));
        cust.setFieldValue("custentity_sourceurl", formatNull(datain.sourceurl));
        cust.setFieldValue("leadsource", campaign);
        cust.setFieldValue("parent", estateId);
        cust.setFieldValue("custentity_source", 'web services');
        customerId = nlapiSubmitRecord(cust, true, true);
        nlapiLogExecution("debug", "Created customer record "+customerId, baseURL+'/app/site/hosting/scriptlet.nl?script=180&deploy=1&compid='+accountId+'&customer='+customerId);
        if(customerId) {
          var phonecall=nlapiCreateRecord('phonecall');
          var d=new Date();
          var today=''+(d.getMonth()+1).toString()+'/'+d.getDate()+'/'+d.getFullYear();
          phonecall.setFieldValue("company", estateId);
          phonecall.setFieldValue("title", "Recovered Error Data");
          phonecall.setFieldValue("startdate", today);
          phonecall.setFieldValue("assigned", '2378997');
          phonecall.setFieldValue("message", jsontotext(datain));
          var phonecallId = nlapiSubmitRecord(phonecall, true, true);
          nlapiLogExecution("debug", 'phonecallId', phonecallId);
        }
      } catch (e) {
        nlapiLogExecution("debug", e.message);
        //send email to Jeff anyway   
        var errbody = JSON.stringify(e) + '\n\n\n' + JSON.stringify(datain);
        var errrecipient = '2698763';
        var errsubject = 'LeadAPI - Unrecoverable error creating customer';
        var errauthor = '2410713';
//        nlapiSendEmail(errauthor, errrecipient, errsubject, errbody);
      }
    }
    if(customerId) {
      var caseStatusRec = nlapiCreateRecord("customrecord_case_status");
      caseStatusRec.setFieldValue("custrecord_case_status_status", "1"); //Prospective
      caseStatusRec.setFieldValue("custrecord_case_status_customer", customerId);
      caseStatusRec.setFieldValue("custrecord_case_status_notes", formatNull(datain.about_case));
      var caseStatusRecId = nlapiSubmitRecord(caseStatusRec, true, true);
      nlapiLogExecution("debug", 'caseStatusRecId', caseStatusRecId);
    }
    nlapiLogExecution('debug', 'customerid/notes', customerId + '/' + notes);
    if(customerId && notes) {
      try {
        var note = nlapiCreateRecord("note");
        note.setFieldValue("entity", customerId);
        note.setFieldValue("note", notes);
        var noteId = nlapiSubmitRecord(note, true, true);
        nlapiLogExecution("debug", "created note with id " + noteId);
      } catch (e) {
        nlapiLogExecution("error", e.message + ": Error creating note for customer with id " + customerId, notes);
      }
    }
  } catch (err) {
    nlapiLogExecution("error", "Error Creating Customer/Estate", "Details: " + err.message);
    nlapiSendEmail(2410713, 'rmontoya@probateadvance.com', 'Lead API - error creating customer/estate', JSON.stringify(err) + '\n\n\n' + JSON.stringify(data));

    rtnObj.success = false;
    rtnObj.message = err.message;
  }
  nlapiLogExecution("DEBUG", "--END--");
  return rtnObj;
}

function formatNull(value) {
  if(value == null || value == "null" || value == "" || value == undefined) {
    return "";
  } else {
    return value;
  }
}

function send_email(data) {
  try {
    var emailBodyFile = nlapiGetContext().getSetting('SCRIPT', 'custscript_email_body_file01');
    var emailSubject = nlapiGetContext().getSetting('SCRIPT', 'custscript_lead_email_subject01');
    var customerEmail = data.email;
    var DefaultSenderText = 'Probate Advance';
    //	var empEmail = 'referral@probateadvance.com';
    var empEmail = 'newapplication@probateadvance.com';
    var senderId;
    var emailBody = nlapiLoadFile(emailBodyFile).getValue();
    emailBody = emailBody.replace('{firstName}', data.firstname);
    emailBody = emailBody.replace('{lastName}', data.lastname);
    emailBody = emailBody.replace('{sender}', DefaultSenderText);
    senderId = 2595575; //referral@probateadvance.com - old value: 751981;
    //		nlapiSendEmail(senderId,[customerEmail],emailSubject,emailBody,null,null,null,null);	
    nlapiSendEmail(senderId, [customerEmail, empEmail], emailSubject, emailBody, null, null, null, null);
    nlapiLogExecution("debug", 'email sent', customerEmail);
  } catch (err) {
    nlapiLogExecution("error", "Error Email Send", "Details: " + err.message);
  }
}

function mapState(fullName) {
  var country = "";
  var stateAbbrev = "";

  switch(fullName) {
    case "Alabama":
      stateAbbrev = "AL";
      country = "US";
      break;
    case "Alaska":
      stateAbbrev = "AK";
      country = "US";
      break;
    case "Arizona":
      stateAbbrev = "AZ";
      country = "US";
      break;
    case "Arkansas":
      stateAbbrev = "AR";
      country = "US";
      break;
    case "California":
      stateAbbrev = "CA";
      country = "US";
      break;
    case "Colorado":
      stateAbbrev = "CO";
      country = "US";
      break;
    case "Connecticut":
      stateAbbrev = "CT";
      country = "US";
      break;
    case "Delaware":
      stateAbbrev = "DE";
      country = "US";
      break;
    case "District of Columbia":
      stateAbbrev = "DC";
      country = "US";
      break;
    case "Florida":
      stateAbbrev = "FL";
      country = "US";
      break;
    case "Georgia":
      stateAbbrev = "GA";
      country = "US";
      break;
    case "Hawaii":
      stateAbbrev = "HI";
      country = "US";
      break;
    case "Idaho":
      stateAbbrev = "ID";
      country = "US";
      break;
    case "Illinois":
      stateAbbrev = "IL";
      country = "US";
      break;
    case "Indiana":
      stateAbbrev = "IN";
      country = "US";
      break;
    case "Iowa":
      stateAbbrev = "IA";
      country = "US";
      break;
    case "Kansas":
      stateAbbrev = "KS";
      country = "US";
      break;
    case "Kentucky":
      stateAbbrev = "KY";
      country = "US";
      break;
    case "Louisiana":
      stateAbbrev = "LA";
      country = "US";
      break;
    case "Maine":
      stateAbbrev = "ME";
      country = "US";
      break;
    case "Maryland":
      stateAbbrev = "MD";
      country = "US";
      break;
    case "Massachusetts":
      stateAbbrev = "MA";
      country = "US";
      break;
    case "Michigan":
      stateAbbrev = "MI";
      country = "US";
      break;
    case "Minnesota":
      stateAbbrev = "MN";
      country = "US";
      break;
    case "Mississippi":
      stateAbbrev = "MS";
      country = "US";
      break;
    case "Missouri":
      stateAbbrev = "MO";
      country = "US";
      break;
    case "Montana":
      stateAbbrev = "MT";
      country = "US";
      break;
    case "Nebraska":
      stateAbbrev = "NE";
      country = "US";
      break;
    case "Nevada":
      stateAbbrev = "NV";
      country = "US";
      break;
    case "New Hampshire":
      stateAbbrev = "NH";
      country = "US";
      break;
    case "New Jersey":
      stateAbbrev = "NJ";
      country = "US";
      break;
    case "New Mexico":
      stateAbbrev = "NM";
      country = "US";
      break;
    case "New York":
      stateAbbrev = "NY";
      country = "US";
      break;
    case "North Carolina":
      stateAbbrev = "NC";
      country = "US";
      break;
    case "North Dakota":
      stateAbbrev = "ND";
      country = "US";
      break;
    case "Ohio":
      stateAbbrev = "OH";
      country = "US";
      break;
    case "Oklahoma":
      stateAbbrev = "OK";
      country = "US";
      break;
    case "Oregon":
      stateAbbrev = "OR";
      country = "US";
      break;
    case "Pennsylvania":
      stateAbbrev = "PA";
      country = "US";
      break;
    case "Rhode Island":
      stateAbbrev = "RI";
      country = "US";
      break;
    case "South Carolina":
      stateAbbrev = "SC";
      country = "US";
      break;
    case "South Dakota":
      stateAbbrev = "SD";
      country = "US";
      break;
    case "Tennessee":
      stateAbbrev = "TN";
      country = "US";
      break;
    case "Texas":
      stateAbbrev = "TX";
      country = "US";
      break;
    case "Utah":
      stateAbbrev = "UT";
      country = "US";
      break;
    case "Vermont":
      stateAbbrev = "VT";
      country = "US";
      break;
    case "Virginia":
      stateAbbrev = "VA";
      country = "US";
      break;
    case "Washington":
      stateAbbrev = "WA";
      country = "US";
      break;
    case "West Virginia":
      stateAbbrev = "WV";
      country = "US";
      break;
    case "Wisconsin":
      stateAbbrev = "WI";
      country = "US";
      break;
    case "Wyoming":
      stateAbbrev = "WY";
      country = "US";
      break;
    case "Alberta":
      stateAbbrev = "AB";
      country = "CA";
      break;
    case "British Columbia":
      stateAbbrev = "BC";
      country = "CA";
      break;
    case "Manitoba":
      stateAbbrev = "MB";
      country = "CA";
      break;
    case "New Brunswick":
      stateAbbrev = "NB";
      country = "CA";
      break;
    case "Newfoundland and Labrador":
      stateAbbrev = "NL";
      country = "CA";
      break;
    case "Northwest Territories":
      stateAbbrev = "NT";
      country = "CA";
      break;
    case "Nova Scotia":
      stateAbbrev = "NS";
      country = "CA";
      break;
    case "Nunavut":
      stateAbbrev = "NU";
      country = "CA";
      break;
    case "Ontario":
      stateAbbrev = "ON";
      country = "CA";
      break;
    case "Prince Edward Island":
      stateAbbrev = "PE";
      country = "CA";
      break;
    case "Quebec":
      stateAbbrev = "QC";
      country = "CA";
      break;
    case "Saskatchewan":
      stateAbbrev = "SK";
      country = "CA";
      break;
    case "Yukon Territory":
      stateAbbrev = "YT";
      country = "CA";
      break;
  }

  return {
    abbrev: stateAbbrev,
    country: country
  }
}

function mapStateAbbrev(stateAbbrev) {
  var classId = "";

  switch(stateAbbrev) {
    case "AL":
      classId = "4";
      break;
    case "AK":
      classId = "5";
      break;
    case "AZ":
      classId = "6";
      break;
    case "AR":
      classId = "7";
      break;
    case "CA":
      classId = "1";
      break;
    case "CO":
      classId = "8";
      break;
    case "CT":
      classId = "9";
      break;
    case "DE":
      classId = "10";
      break;
    case "FL":
      classId = "3";
      break;
    case "GA":
      classId = "11";
      break;
    case "HI":
      classId = "12";
      break;
    case "ID":
      classId = "13";
      break;
    case "IL":
      classId = "14";
      break;
    case "IN":
      classId = "15";
      break;
    case "IA":
      classId = "16";
      break;
    case "KS":
      classId = "17";
      break;
    case "KY":
      classId = "18";
      break;
    case "LA":
      classId = "19";
      break;
    case "ME":
      classId = "20";
      break;
    case "MD":
      classId = "21";
      break;
    case "MA":
      classId = "22";
      break;
    case "MI":
      classId = "23";
      break;
    case "MN":
      classId = "24";
      break;
    case "MS":
      classId = "25";
      break;
    case "MO":
      classId = "26";
      break;
    case "MT":
      classId = "27";
      break;
    case "NE":
      classId = "28";
      break;
    case "NV":
      classId = "29";
      break;
    case "NH":
      classId = "30";
      break;
    case "NJ":
      classId = "31";
      break;
    case "NM":
      classId = "32";
      break;
    case "NY":
      classId = "2";
      break;
    case "NC":
      classId = "33";
      break;
    case "ND":
      classId = "34";
      break;
    case "OH":
      classId = "35";
      break;
    case "OK":
      classId = "36";
      break;
    case "OR":
      classId = "37";
      break;
    case "PA":
      classId = "38";
      break;
    case "RI":
      classId = "39";
      break;
    case "SC":
      classId = "40";
      break;
    case "SD":
      classId = "41";
      break;
    case "TN":
      classId = "42";
      break;
    case "TX":
      classId = "43";
      break;
    case "UT":
      classId = "44";
      break;
    case "VT":
      classId = "45";
      break;
    case "VA":
      classId = "46";
      break;
    case "WA":
      classId = "47";
      break;
    case "WV":
      classId = "48";
      break;
    case "WI":
      classId = "49";
      break;
    case "WY":
      classId = "50";
      break;
  }

  return classId;
}

function jsontotext(data) {
  var text='';
  for(i in data) {
    text+=i+' : '+data[i]+'\r\n';
  }
  return text;
}