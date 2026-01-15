/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */

define(['N/https', 'N/record', 'N/search', 'N/runtime', 'N/email', 'N/file'], function (https, record, search, runtime, email, file) {

  function doPost(datain) {
    log.debug("-BEGIN-");
    var rtnObj = {
      success: true,
      message: "connection successful"
    };
    var data = datain;
    var accountId=runtime.accountId;
    var accountURL=accountId.toLowerCase().replace('_','-');
    var baseURL='https://'+accountURL+'.app.netsuite.com';
    log.debug("Incoming Data", JSON.stringify(datain));
    if(!datain.sourceurl)
      datain.sourceurl = '';
    datain.sourceurl = datain.sourceurl.split('?')[0];
//    send_email(data);
    try {
      //Lookup marketing campaign if provided
      var campaign = "";
      var customerId;
      if(datain.adgroup != null && datain.adgroup != "") {
        var filters = [];
        filters.push(search.createFilter({name:"custrecord_pub_id", operator:"is", values:datain.adgroup}));
        var cols = [];
        cols.push(search.createColumn({name:"custrecord_ns_lead_source"}));
        var s=search.create({columns:cols, filters:filters, type:"customrecord_pub_id_mapping"});
        var rc=s.runPaged().count;
        if(rc>0) {
          var results = s.run().getRange(0,1000);
          campaign = results[0].getValue("custrecord_ns_lead_source");
        }
      }
  
      var estate = record.create({type:"customer", isDynamic:true});
      estate.setValue({fieldId:"subsidiary", value:"2"});
      estate.setValue({fieldId:"isperson", value:"F"});
      var estname = datain.heriting_from.trim();
      if(estname == '' || estname == null) {
        estname = "[TEMP] " + datain.firstname + " " + datain.lastname;
      }
      if(!!datain.test) {
        log.debug("Found test parameter");
        log.debug("--END--");
        return {"status":true, "message":"found test parameter", "datain":datain};
      }
      estate.setValue({fieldId:"companyname", value:estname});
      estate.setValue({fieldId:"category", value:"2"});
      estate.setValue({fieldId:"custentity_source", value:'web services'});
      estate.setValue({fieldId:"custentity1", value:datain.cnumber});
      var statefile = datain.statefile;
      var countyfile = datain.countyfile;
      estate.setValue({fieldId:"custentity3", value:mapStateAbbrev(mapState(statefile).abbrev)});
      var notes = datain.notes;
      if(statefile && countyfile) {
        var cty = statefile + "_" + countyfile;
        try {
          estate.setText({fieldId:"custentity2", value:cty});
        } catch (e) {
          log.debug('error setting county:' + estateId + '; ' + cty);
        }
      }
      estateId = estate.save({enableSourcing:true, ignoreMandatoryFields:true});
      log.debug("Created estate record "+estateId, baseURL+'/app/site/hosting/scriptlet.nl?script=180&deploy=1&compid='+accountId+'&estate='+estateId);
      try {
        var customer = record.create({type:"customer", isDynamic:true});
        customer.setValue({fieldId:"subsidiary", value:"2"});
        customer.setValue({fieldId:"isperson", value:'T'});
        customer.setValue({fieldId:"firstname", value:datain.firstname});
        customer.setValue({fieldId:"lastname", value:datain.lastname});
        
        var phoneerror=false;
        var emailerror=false;
        var params={};
        var phone=datain.phone;
        var recipientId='2299863';
        var recipientType='employee';
        var validatePhoneObj = https.requestSuitelet({
          deploymentId: 'customdeploy_mmsdf_sl_phone_validator',
          scriptId: 'customscript_mmsdf_sl_phone_validator',
          method: https.Method.GET,
          urlParams: {
            methodName: 'validatePhoneNumber',
            functionParams: JSON.stringify({
              phoneNumber: phone,
              recipientId: recipientId,
              recipientType: recipientType
            })
          }
        });
        log.debug('suitelet response', validatePhoneObj.body);
        validatePhoneObj = JSON.parse(validatePhoneObj.body);
        var cleanedPhoneNumber = validatePhoneObj.e164Format;
        var phoneIsValid = validatePhoneObj.isValid;

    
        if(!phoneIsValid) {
          phone=null;
          phoneerror=true;
        }
        
        customer.setValue({fieldId:"phone", value:phone});
        customer.setValue({fieldId:"altphone", value:phone});
  
        var emailaddr=datain.email;
        var emailre=/^[a-zA-Z0-9%&./=^'{}|+\-_~!#$]+@[a-zA-Z0-9][a-zA-Z0-9\-]+[a-zA-Z0-9]\.[a-zA-Z0-9][a-zA-Z0-9\-]+[a-zA-Z0-9]$/;
        if(!emailaddr.match(emailre)) {
          log.debug('email was not valid: '+emailaddr);
          emailaddr=null;
          emailerror=true;
        } else {
          log.debug('email was valid: '+emailaddr);
          send_email(data);
        }
        
        customer.setValue({fieldId:"email", value:emailaddr});
        customer.setValue({fieldId:"category", value:"1"});
        customer.setValue({fieldId:"custentity_infusionsoft_id", value:datain.infusionsoft_id});
        customer.setValue({fieldId:"custentity_campaign", value:formatNull(datain.campaign)});
        customer.setValue({fieldId:"custentity_adgroup", value:formatNull(datain.adgroup)});
        customer.setValue({fieldId:"custentity_keyword", value:formatNull(datain.keyword)});
        customer.setValue({fieldId:"custentity_click_id", value:formatNull(datain.click_id)});
        customer.setValue({fieldId:"custentity_creative", value:formatNull(datain.creative)});
        customer.setValue({fieldId:"custentity_device", value:formatNull(datain.device)});
        customer.setValue({fieldId:"custentity_matchtype", value:formatNull(datain.matchtype)});
        customer.setValue({fieldId:"custentity_sourceurl", value:formatNull(datain.sourceurl)});
        customer.setValue({fieldId:"custentity_msclkid", value:formatNull(datain.msclkid)});
        customer.setValue({fieldId:"leadsource", value:campaign});
        customer.setValue({fieldId:"parent", value:estateId});
        customer.setValue({fieldId:"custentity_source", value:'web services'});
        customerId = customer.save({enableSourcing:true, ignoreMandatoryFields:true});
        log.debug("Created customer record "+customerId, baseURL+'/app/site/hosting/scriptlet.nl?script=180&deploy=1&compid='+accountId+'&customer='+customerId);
      } catch(err) {
        log.error("Error Creating Customer", "Details: " + err.message + '; ' + JSON.stringify(err) + '\n\n' + JSON.stringify(datain));
        //send email to Jeff
        var errbody = JSON.stringify(err) + '\n\n\n' + JSON.stringify(datain);
        var errrecipient = '2299863'; //'2698763'; // Jeff
        var errsubject = 'LeadAPI - Unrecoverable error creating customer';
        var errauthor = '2410713'; // API Master
        email.send({author:errauthor, recipients:errrecipient, subject:errsubject, body:errbody});
      }
      if(customerId) {
        log.debug('create case status');
        var caseStatusRec = record.create({type:"customrecord_case_status"});
        caseStatusRec.setValue({fieldId:"custrecord_case_status_status", value:"1"}); //Prospective
        caseStatusRec.setValue({fieldId:"custrecord_case_status_customer", value:customerId});
        caseStatusRec.setValue({fieldId:"custrecord_case_status_notes", value:formatNull(datain.about_case)});
        var caseStatusRecId = caseStatusRec.save({enableSourcing:true, ignoreMandatoryFields:true});
        log.debug('caseStatusRecId', caseStatusRecId);
      }
      if(estateId && (phoneerror || emailerror)) {
        log.debug('create case update (phonecall)');
        var phonecall=record.create({type:'phonecall'});
        var d=new Date();
//        var today=''+(d.getMonth()+1).toString()+'/'+d.getDate()+'/'+d.getFullYear();
        phonecall.setValue({fieldId:"company", value:estateId});
        phonecall.setValue({fieldId:"title", value:"Recovered Error Data"});
        phonecall.setValue({fieldId:"startdate", value:d});
        phonecall.setValue({fieldId:"assigned", value:'2378997'});
        phonecall.setValue({fieldId:"message", value:jsontotext(datain)});
        var phonecallId = phonecall.save({enableSourcing:true, ignoreMandatoryFields:true});
        log.debug('phonecallId', phonecallId);
      }
      log.debug('customerid/notes', customerId + '/' + notes);
      if(customerId && notes) {
        try {
          var note = record.create({type:"note"});
          note.setValue({fieldId:"entity", value:customerId});
          note.setValue({fieldId:"note", value:notes});
          var noteId = note.save({enableSourcing:true, ignoreMandatoryFields:true});
          log.debug("created note with id " + noteId);
        } catch (e) {
          log.error(e.message + ": Error creating note for customer with id " + customerId, notes);
        }
      }
    } catch (err) {
      log.error("Error Creating Customer/Estate", "Details: " + err.message);
      email.send({
        author:'2410713',
        recipients:'rmontoya@probateadvance.com',
        subject:'Lead API - error creating customer/estate',
        body:JSON.stringify(err) + '\n\n\n' + JSON.stringify(data)
      });
  
      rtnObj.success = false;
      rtnObj.message = err.message;
    }
    log.debug("--END--");
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
      var currentScript = runtime.getCurrentScript();
      var emailBodyFile = currentScript.getParameter({name:'custscript_email_body_file01_ss21'});
      var emailSubject = currentScript.getParameter({name:'custscript_lead_email_subject01_ss21'});
      var customerEmail = data.email;
      var DefaultSenderText = 'Probate Advance';
      //	var empEmail = 'referral@probateadvance.com';
      var empEmail = 'newapplication@probateadvance.com';
      var senderId;
      var emailBody = file.load({id:emailBodyFile}).getContents();
      emailBody = emailBody.replace('{firstName}', data.firstname);
      emailBody = emailBody.replace('{lastName}', data.lastname);
      emailBody = emailBody.replace('{sender}', DefaultSenderText);
      senderId = 2595575; //referral@probateadvance.com - old value: 751981;
      //		nlapiSendEmail(senderId,[customerEmail],emailSubject,emailBody,null,null,null,null);	
      email.send({author:senderId, recipients:[customerEmail, empEmail], subject:emailSubject, body:emailBody});
      log.debug('email sent', customerEmail);
    } catch (err) {
      log.error("Error Email Send", "Details: " + err.message);
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
    };
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
    for(var i in data) {
      text+=i+' : '+data[i]+'\r\n';
    }
    return text;
  }

  return {post:doPost};

});