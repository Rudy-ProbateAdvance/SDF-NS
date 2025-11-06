// noinspection JSVoidFunctionReturnValueUsed
//jQuery(document).ready(alert("document.ready"));
//document.addEventListener("DOMContentLoaded", function(event){
//  alert("domcontentloaded");
//});

function clearchanged() {
//  window.ischanged=false;
  return true;
}


if(!window.NS.statecountyalerts) {
  window.NS.statecountyalerts = {counties:[], states:[]};
  var alerts=nlapiLookupField('customrecord_state_county_alerts','1',['custrecord_state_county_alert_states', 'custrecord_state_county_alert_counties']);
  alerts.custrecord_state_county_alert_counties.split(',').forEach(function(county){window.NS.statecountyalerts.counties.push(county)});
  alerts.custrecord_state_county_alert_states.split(',').forEach(function(state){window.NS.statecountyalerts.states.push(state)});
}


function New_Cust_App_CS_PI() {
  var elem=document.getElementById('custpage_courtapproved_blocked_account_fs_lbl');
  var x=nlapiGetFieldValue('custpage_diligence_blocked_account_letter');
  var y=nlapiGetFieldValue('custpage_client_signed_blocked_account');
  var z=nlapiGetFieldValue('custpage_courtapproved_blocked_account');
  if((x=='T' || y=='T')&&z=='F') {
    elem.style.backgroundColor='#ff0000';
  } else {
    elem.style.backgroundColor=null;
  }

  var savewarning=document.createElement('div');
  savewarning.innerHTML="<B><Center>Save in progress, stand by...</center></B>";
  savewarning.id='save-alert-box';
  savewarning.style='display:none; \
  position: fixed; \
  top: 50%; \
  left: 50%; \
  width: 25%; \
  transform: translate(-50%, -50%) /*scale(2.0, 2.0)*/; \
  background-color: #cff5ff; \
  padding: 20px; \
  border: 1px solid #ccc; \
  z-index: 1000; \
  textAlign: center;';
  parentElement=document.getElementById('body');
  parentElement.appendChild(savewarning);

  var customerId = nlapiGetFieldValue("custpage_customer_id");
  var estateId = nlapiGetFieldValue("custpage_estate");
  var d = new Date();
  var today = (d.getMonth() + 1) + '/' + d.getDate() + '/' + d.getFullYear();
  try {
    nlapiSubmitField('customer', estateId, 'custentity_lastviewedinapp', today);
  } catch(e) {
    ;
  }

  var estatestateval = nlapiGetFieldValue('custpage_estate_state');
//  if (estatestateval == '9') {
  if (window.NS.statecountyalerts.states.includes(mapclasstostate(estatestateval))) {
    nlapiSetFieldValue('custpage_estate_state_warn', '<h3 style="color:Red">STATE ALERT</h3>');
  } else {
//    nlapiSetFieldValue(name + 'custpage_estate_state_warn', ' ');
    nlapiSetFieldValue('custpage_estate_state_warn', ' ');
  }

  var stateval = nlapiGetFieldValue('custpage_state');
//  if (stateval == '9') {
  if (window.NS.statecountyalerts.states.includes(mapclasstostate(stateval))) {
    nlapiSetFieldValue('custpage_state_warn', '<h3 style="color:Red">STATE ALERT</h3>');
  } else {
//    nlapiSetFieldValue(name + 'custpage_state_warn', ' ');
    nlapiSetFieldValue('custpage_state_warn', ' ');
  }

  var countyval = nlapiGetFieldValue('custpage_estate_county');
  if(window.NS.statecountyalerts.counties.includes(countyval)) {
    nlapiSetFieldValue('custpage_estate_county_warn', '<h3 style="color:Red">COUNTY ALERT</h3>');
  } else {
    nlapiSetFieldValue('custpage_estate_county_warn', ' ');
  }

  calcEstateTotals();

  //calculateMonths();

  calcTotalAssignments();

  calcTotalLeins();

  calculateMaxAdvance();

  if (nlapiGetFieldValue("custpage_desired_advance") != null && nlapiGetFieldValue("custpage_desired_advance") != "")
    calculatePrice();

  setnextevent();
}

function New_Cust_App_CS_FC(type, name, linenum) {
  try {
  if(window.hasOwnProperty('inactivitytimerid')) {
    console.log('hasBeenActive', navigator.userActivation.hasBeenActive, 'ischanged', window.ischanged, 'timer id', window.inactivitytimerid);
    var result=window.clearTimeout(window.inactivitytimerid);
    console.log('cleared timeout', result);
    delete window.inactivitytimerid;
  }

  console.log('hasBeenActive', navigator.userActivation.hasBeenActive, 'ischanged', window.ischanged, 'timer id', window.inactivitytimerid);
  if(navigator.userActivation.hasBeenActive) {
    console.log('setting new timer');
    window.inactivitytimerid = window.setTimeout(function () {
      savebuttonclick();
    }, 900000);
  }
  window.ischanged=false;
  } catch(e) {
    console.log(e.name, e.message);
  }
    
  if(window.suppressfieldchangedfunction==true) {
    return;
  }

  if(name=='custpage_diligence_blocked_account_letter' || name=='custpage_client_signed_blocked_account' || name=='custpage_courtapproved_blocked_account') {
    var elem=document.getElementById('custpage_courtapproved_blocked_account_fs_lbl');
    var x=nlapiGetFieldValue('custpage_diligence_blocked_account_letter');
    var y=nlapiGetFieldValue('custpage_client_signed_blocked_account');
    var z=nlapiGetFieldValue('custpage_courtapproved_blocked_account');
    if((x=='T' || y=='T')&&z=='F') {
      elem.style.backgroundColor='#ff0000';
    } else {
      elem.style.backgroundColor=null;
    }
    return;
  }

  try {

    var customerId = nlapiGetFieldValue("custpage_customer_id");
    var estateId = nlapiGetFieldValue("custpage_estate");


    if (name == 'custpage_invoice_datefiled') {
      date = nlapiGetLineItemValue(type, name, linenum);
      var invintid = nlapiGetLineItemValue(type, 'custpage_invoice_internalid', linenum);
      nlapiSubmitField('invoice', invintid, 'custbody_invoice_datefiled', date);
      return true;
    }

    if (name == 'custpage_state' || name == 'custpage_estate_state') {
      var stateval = nlapiGetFieldValue(name);
//      if (stateval == '9') {
      if (window.NS.statecountyalerts.states.includes(mapclasstostate(stateval))) {
        nlapiSetFieldValue(name + '_warn', '<h3 style="color:Red">STATE ALERT</h3>');
      } else {
        nlapiSetFieldValue(name + '_warn', ' ');
      }
    }

    if(name == 'custpage_estate_county') {
      var countyval = nlapiGetFieldValue(name);
      if(window.NS.statecountyalerts.counties.includes(countyval)) {
        nlapiSetFieldValue(name + '_warn', '<h3 style="color:Red">COUNTY ALERT</h3');
      } else {
        nlapiSetFieldValue(name + '_warn', ' ');
      }
    }

    if (name == 'custpage_property_listingtype' && type == 'custpage_properties') {
      var property_id = nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_id");
      var eventtype = nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_listingtype")
      console.log('eventtype', eventtype);
      if (property_id)
        nlapiSubmitField("customrecord_property", property_id, ["custrecord_listing_checkbox", 'custrecord_event_type_new'], ['T', eventtype]);
    }
    if (name == 'custpage_property_preforeclosure_status' && type == 'custpage_properties') {
      var property_id = nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_id");
      var preforeclosure_status = nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_preforeclosure_status")
      console.log('preforeclosure_status', preforeclosure_status);
      if (property_id)
        nlapiSubmitField("customrecord_property", property_id, ["custrecord_preforeclosure_checkbox", 'custrecord_preforeclosure_status'], ['T', preforeclosure_status]);
    }
    if (name == "custpage_customer_id" || name == "custpage_estate") {
      var url = nlapiResolveURL("SUITELET", "customscript_new_customer_application", "customdeploy_new_customer_application");
      url += "&customer=" + nlapiGetFieldValue("custpage_customer_id");
      url += "&estate=" + nlapiGetFieldValue("custpage_estate");

      window.onbeforeunload = null;
      window.location.href = url;
    } else if (name == "custpage_wa_name" || name == "custpage_wa_state_name") {
      var customerId = nlapiGetFieldValue("custpage_customer_id");
      if (customerId != null && customerId != '') {
        switch (name) {
          case "custpage_wa_name":
            var wa_sl = nlapiGetFieldValue(name);
            console.log('wa_sl ' + wa_sl + '_customerId ' + customerId);
            var record_wa_cl = nlapiLoadRecord('customer', customerId)
            record_wa_cl.setFieldValue('custentity_mmsdf_send_wf_sms', wa_sl, false, true);
            var sl_id = nlapiSubmitRecord(record_wa_cl, true, true);
            break;

          case "custpage_wa_state_name":
            var wa_sl_s = nlapiGetFieldValue(name);
            var record_sa_cl = nlapiLoadRecord('customer', customerId)
            record_sa_cl.setFieldValue('custentity_mmsdf_stopsendingsms', wa_sl_s, false, true);
            var sl_id_s = nlapiSubmitRecord(record_sa_cl, true, true);
            break;
        }
      }

    } else if (name == 'custpage_followup_assinged' && type == 'custpage_followup_list') {
      var assigned = nlapiGetCurrentLineItemValue("custpage_followup_list", "custpage_followup_assinged");
      var followupId = nlapiGetCurrentLineItemValue("custpage_followup_list", "custpage_followup_id");
      if (followupId != null && followupId != "") {
        nlapiSubmitField("customrecord_customer_follow_up", followupId, "custrecord_assigned", assigned);
      }
    } else if (type == "custpage_properties" && (name == "custpage_property_value" || name == "custpage_property_mortgage" || name == "custpage_property_owned" || name == "custpage_property_note" || name == "custpage_property_sold" || name == "custpage_property_escrow" || name == "custpage_property_dot" || name == "custpage_property_dot_subdate" || name == "custpage_property_dot_recdate" || name == "custpage_property_lispendens" || name == "custpage_property_moi")) {
      try {
        var value = nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_value");
        var mortgage = nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_mortgage");
        var owned = nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_owned");
        var sold = nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_sold");
        var note = nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_note");
        var propertieId = nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_id");
        var escrow = nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_escrow");
        var dot = nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_dot");
        if (name == "custpage_property_escrow" && propertieId) {
          nlapiSubmitField("customrecord_property", propertieId, "custrecord_escrow", escrow);
        }
        if (name == "custpage_property_dot" && propertieId) {
          nlapiSubmitField("customrecord_property", propertieId, "custrecord_dot", dot);
          if(dot=='' || dot==null || dot==' ') {
            window.suppressfieldchangedfunction=true;
            nlapiSetCurrentLineItemValue("custpage_properties", "custpage_property_dot_subdate", "");
            nlapiSetCurrentLineItemValue("custpage_properties", "custpage_property_dot_recdate", "");
            window.suppressfieldchangedfunction=false;
          }
        }
        if (name == "custpage_property_dot_subdate" && propertieId) {
          if(dot=='' || dot==null || dot==' ') {
            alert("Cannot set a DOT date if DOT is not selected");
            window.suppressfieldchangedfunction=true;
            nlapiSetCurrentLineItemValue("custpage_properties", "custpage_property_dot_subdate", "");
            nlapiSetCurrentLineItemValue("custpage_properties", "custpage_property_dot_recdate", "");
            window.suppressfieldchangedfunction=false;
          }
          var val=nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_dot_subdate");
          nlapiSubmitField("customrecord_property", propertieId, "custrecord_property_dot_subdate", val);
        }
        if (name == "custpage_property_dot_recdate" && propertieId) {
          if(dot=='' || dot==null || dot==' ') {
            alert("Cannot set a DOT date if DOT is not selected");
            window.suppressfieldchangedfunction=true;
            nlapiSetCurrentLineItemValue("custpage_properties", "custpage_property_dot_subdate", "");
            nlapiSetCurrentLineItemValue("custpage_properties", "custpage_property_dot_recdate", "");
            window.suppressfieldchangedfunction=false;
          }
          var val=nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_dot_recdate");
          nlapiSubmitField("customrecord_property", propertieId, "custrecord_property_dot_recdate", val);
        }
        if (name == "custpage_property_lispendens" && propertieId) {
          var val=nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_lispendens");
          nlapiSubmitField("customrecord_property", propertieId, "custrecord_property_lispendens", val);
        }
        if (name == "custpage_property_moi" && propertieId) {
          var val=nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_moi");
          nlapiSubmitField("customrecord_property", propertieId, "custrecord_property_moi", val);
        }
        if (name == "custpage_property_sold" && propertieId) {
          nlapiSubmitField("customrecord_property", propertieId, "custrecord_sold", sold);
        }
        if (name == 'custpage_property_note' || propertieId) {
          nlapiSubmitField("customrecord_property", propertieId, "custrecord_notes", note);
        }
        if (value != null && value != "" && owned != null && owned != "") {
          var equity = parseFloat(value);

          if (mortgage != null && mortgage != "") {
            equity = equity - parseFloat(mortgage);
          }

          owned = owned.replace("%", "");
          owned = parseFloat(owned) / 100;

          var total = equity * owned;

          nlapiSetCurrentLineItemValue("custpage_properties", "custpage_property_total", total, true, true);
        }
      } catch (err) {
        nlapiLogExecution("error", "Error Calculating Total Property Value", "Details: " + err.message);
        console.log("Error Calculating Total Property Value: " + err.message);
      }
    } else if (name == "custpage_net_equity_value_1") {
      nlapiSetFieldValue("custpage_net_equity_value", nlapiGetFieldValue("custpage_net_equity_value_1"), true, true);

      calculateMaxAdvance();
    } else if (name == "custpage_percent_equity_due" || name == "custpage_bequest_due" || name == "custpage_liens_judgments" || name == "custpage_existing_agreements" || name == "custpage_adv_to_val_ratio") {
      calculateMaxAdvance();
    } else if (name == "custpage_price_level" || name == "custpage_desired_advance" || name == "custpage_early_rebate_1" || name == "custpage_early_rebate_2" || name == "custpage_early_rebate_3") {
      var pricelvl = nlapiGetFieldValue("custpage_price_level");
      if (name == "custpage_price_level" && pricelvl == 6) {
//        debugger;
//        window.suppressfieldchangedfunction=true;
        nlapiSetFieldValue("custpage_desired_advance", 5000);
        nlapiSetFieldValue("custpage_months_remaining", 18);
//        nlapiSetFieldValue("custpage_early_rebate_1", "");
//        nlapiSetFieldValue("custpage_early_rebate_2", "");
//        nlapiSetFieldValue("custpage_early_rebate_3", "");
//        nlapiSetFieldValue("custpage_assignment_size", 9900);
//        nlapiSetFieldValue("custpage_early_rebate_1_amt", "");
//        nlapiSetFieldValue("custpage_early_rebate_2_amt", "");
//        nlapiSetFieldValue("custpage_early_rebate_3_amt", "");
//        window.suppressfieldchangedfunction=false;
//        return;
      }
      if (name == "custpage_desired_advance") {
        var desiredAdvance = nlapiGetFieldValue("custpage_desired_advance");
        var maxAdvance = nlapiGetFieldValue("custpage_max_advance");

        if (desiredAdvance != null && desiredAdvance != "" && maxAdvance != null && maxAdvance != "") {
          desiredAdvance = parseFloat(desiredAdvance);
          maxAdvance = parseFloat(maxAdvance);

          if (desiredAdvance > maxAdvance) {
            alert("The desired advance cannot exceed the maximum advance");
          }
        }
      }

      calculatePrice();
    } else if (name == "custpage_estate_state") {
      calculateMonths();
      console.log("Calc'd number of months...");

    } else if (name == "custpage_specific_bequests") {
      calcEstateTotals();


    } else if (name == 'custpage_pm_assignee') {
      debugger;
      var estateId = nlapiGetFieldValue("custpage_estate");
      var val=nlapiGetFieldValue('custpage_pm_assignee');
      if(val=='undefined')
        val=null;
      nlapiSubmitField('customer', estateId, 'custentity_pm_assignee', val);
      return true;
    } else if (name == "custpage_first_name" || name == "custpage_diligence_assignee" || name == "custpage_middle_initial" || name == "custpage_last_name" || name == "custpage_address" || name == "custpage_city" || name == "custpage_state" || name == "custpage_zip" || name == "custpage_phone" || name == "custpage_email" || name == "custpage_how_did_they_find_us" || name == "custpage_alt_phone") {
      var customerId = nlapiGetFieldValue("custpage_customer_id");

      if (customerId == null || customerId == "") {
        var firstName = nlapiGetFieldValue("custpage_first_name");
        var lastName = nlapiGetFieldValue("custpage_last_name");
        var diligence_assignee = nlapiGetFieldValue("custpage_diligence_assignee");
        if (firstName != null && firstName != "" && lastName != null && lastName != "") {
          var customer = nlapiCreateRecord("customer");
          customer.setFieldValue("subsidiary", "2");
          customer.setFieldValue("isperson", "T");
          customer.setFieldValue("firstname", firstName);
          customer.setFieldValue("middlename", nlapiGetFieldValue("custpage_middle_initial"));
          customer.setFieldValue("lastname", lastName);
          customer.setFieldValue("phone", nlapiGetFieldValue("custpage_phone"));
          //        customer.setFieldValue("custentity_alternate_phone_number", nlapiGetFieldValue("custpage_alt_phone"));
          customer.setFieldValue("altphone", nlapiGetFieldValue("custpage_alt_phone"));
          customer.setFieldValue("email", nlapiGetFieldValue("custpage_email"));
          var leadsource = nlapiGetFieldValue("custpage_how_did_they_find_us");
          if (leadsource == '' || leadsource == null || leadsource == 'undefined')
            leadsource = null;
          customer.setFieldValue("leadsource", leadsource);
          customer.setFieldValue("category", "1");
          if (diligence_assignee != null && diligence_assignee != '' && diligence_assignee != 'undefined')
            customer.setFieldValue("custentity_diligence_assignee", diligence_assignee);

          if (nlapiGetFieldValue("custpage_estate") == null || nlapiGetFieldValue("custpage_estate") == "") {
            var estate = nlapiCreateRecord("customer");
            estate.setFieldValue("subsidiary", "2");
            estate.setFieldValue("isperson", "F");
            estate.setFieldValue("companyname", "[TEMP] " + firstName + " " + lastName);
            estate.setFieldValue("category", "2");
            estateId = nlapiSubmitRecord(estate, true, true);

            nlapiSetFieldValue("custpage_estate", estateId, false, true);
            nlapiSetFieldValue("custpage_decedent", "[TEMP] " + firstName + " " + lastName, false, true);

            customer.setFieldValue("parent", estateId);
          } else
            customer.setFieldValue("parent", nlapiGetFieldValue("custpage_estate"));

          customerId = nlapiSubmitRecord(customer, true, true);

          nlapiSetFieldValue("custpage_customer_id", customerId, false, true);
        }
      } else {
//        if(nlapiGetUser()=='2299863') {
//          alert('has customerId');
//        }
        if (name == "custpage_first_name" || name == "custpage_diligence_assignee" || name == "custpage_middle_initial" || name == "custpage_last_name" || name == "custpage_phone" || name == "custpage_email" || name == "custpage_how_did_they_find_us" || name == "custpage_alt_phone") {
          switch (name) {
//            case "custpage_first_name":
//              nlapiSetFieldValue("custpage_customer_id", customerId, false, true);
//              break;
//            case "custpage_middle_initial":
//              nlapiSetFieldValue("custpage_customer_id", customerId, false, true);
//              break;
//            case "custpage_last_name":
//              nlapiSetFieldValue("custpage_customer_id", customerId, false, true);
//              break;
//            case "custpage_alt_phone":
//              nlapiSetFieldValue("custpage_customer_id", customerId, false, true);
//              break;
            case "custpage_diligence_assignee":
              var diligencerep = nlapiGetFieldValue(name);
              if (diligencerep == '' || diligencerep == 'undefined' || diligencerep == null)
                diligencerep = null;
//              nlapiSetFieldValue("custpage_customer_id", customerId, false, true);
              nlapiLogExecution("debug", "value of diligence", nlapiGetFieldValue('custpage_diligence_assignee'));
              console.log("value of diligence: " + nlapiGetFieldValue(name));
              var todaydate = new Date();
              var date = nlapiDateToString(todaydate);
              var subject = 'Assigned Diligence assignee';
              if (nlapiGetFieldValue('custpage_diligence_assignee')) {
                nlapiSelectNewLineItem('custpage_phonecalls')
                //nlapiSetCurrentLineItemValue("custpage_phonecalls", "custpage_phonecalls_id", phonecallId, false, true);
                nlapiSetCurrentLineItemValue("custpage_phonecalls", "custpage_phonecalls_message", subject, true, true);
                nlapiSetCurrentLineItemValue("custpage_phonecalls", "custpage_phonecalls_title", subject, true, true);
                nlapiSetCurrentLineItemValue("custpage_phonecalls", "custpage_phonecalls_owner", nlapiGetFieldValue('custpage_diligence_assignee'), true, true);
                nlapiSetCurrentLineItemValue("custpage_phonecalls", "custpage_phonecalls_date", date, true, true);
                nlapiCommitLineItem('custpage_phonecalls')
              }
              /*var phonecall = nlapiCreateRecord("phonecall", {
                          recordmode: "dynamic"
                          });
                          phonecall.setFieldValue("company", nlapiGetFieldValue("custpage_estate"));
                          phonecall.setFieldValue("title", subject);
                          //phonecall.setFieldValue("startdate", todaydate);
                          //phonecall.setFieldValue("phone", nlapiGetCurrentLineItemValue("custpage_phonecalls", "custpage_phonecalls_phone_number"));
                          phonecall.setFieldValue("assigned", nlapiGetFieldValue('custpage_diligence_assignee'));
                          phonecall.setFieldValue("message",  subject);
                          var phonecallId = nlapiSubmitRecord(phonecall, true, true);
                          console.log("value of diligence: "+ phonecallId );*/

              break;

//            case "custpage_phone":
//              var phone_sl = nlapiGetFieldValue(name);
//              if (phone_sl == null || phone_sl == '') {
//                //console.log('phone_sl '+phone_sl+'_customerId '+customerId);
//                phone_sl = '';
//                phone_sl = null;
//              }

//              nlapiSubmitField("customer", customerId, "phone", phone_sl);
//            try {
//              var record_cl = nlapiLoadRecord('customer', customerId)
//              record_cl.setFieldValue('phone', phone_sl, false, true);
//              var sl_id = nlapiSubmitRecord(record_cl, true, true);
//
//            } catch (e) {
//              console.log(e);
//            }
              //var record_cl = nlapiLoadRecord('customer', customerId)
              //record_cl.setFieldValue('phone', phone_sl, false, true);
              //var sl_id = nlapiSubmitRecord(record_cl, true,true);

              // console.log('phone_sl '+phone_sl+'_customerId '+customerId+' sl_id'+sl_id);
              ///////// New Change to set marketing category vijay/////////////
              console.log('name' + name);
              console.log('customer id' + customerId);
              if (nlapiGetFieldValue(name)) {
                var filters = [];
                filters.push(new nlobjSearchFilter("custrecord_case_status_customer", null, "is", customerId));
                var cols = [];
                cols.push(new nlobjSearchColumn("custrecord_case_status_status"));
                var exchangeResults = nlapiSearchRecord("customrecord_case_status", null, filters, cols);
                var custid;
                if (exchangeResults && exchangeResults.length == 1) {

                  var cStatus = exchangeResults[0].getValue("custrecord_case_status_status");
                  if (cStatus == 9 || cStatus == 10) {
                    nlapiSubmitField("customer", customerId, "custentity_marketing_categories", 1);
                  }
                }
              }
              break;
            case "custpage_email":
              nlapiSubmitField("customer", customerId, "email", nlapiGetFieldValue(name));

              ///////// New Change to set marketing category vijay/////////////

              if (nlapiGetFieldValue(name)) {
                var filters = [];
                filters.push(new nlobjSearchFilter("custrecord_case_status_customer", null, "is", customerId));
                var cols = [];
                cols.push(new nlobjSearchColumn("custrecord_case_status_status"));
                var exchangeResults = nlapiSearchRecord("customrecord_case_status", null, filters, cols);
//                var custid;
                if (exchangeResults && exchangeResults.length == 1) {

                  var cStatus = exchangeResults[0].getValue("custrecord_case_status_status");
                  if (cStatus == 9 || cStatus == 10) {
                    nlapiSubmitField("customer", customerId, "custentity_marketing_categories", 1);
                  }

                }
              }
              break;
            case "custpage_how_did_they_find_us":
              var leadsource = nlapiGetFieldValue(name);
              var campaignCategory = "";
              if (leadsource != null && leadsource != "" && leadsource != 'undefined' && !leadsource.match('NULL')) {
                campaignCategory = nlapiLookupField("campaign", nlapiGetFieldValue(name), "category");
              } else {
                leadsource = null;
                campaignCategory = null;
              }
              nlapiSubmitField("customer", customerId, ["campaigncategory", "leadsource"], [campaignCategory, leadsource]);
              break;
          }
        } else if (name == "custpage_address" || name == "custpage_city" || name == "custpage_state" || name == "custpage_zip") {
          var addressStreet = nlapiGetFieldValue("custpage_address");
          var addressCity = nlapiGetFieldValue("custpage_city");
          var addressState = nlapiGetFieldText("custpage_state");
          var addressZip = nlapiGetFieldValue("custpage_zip");

          if (addressStreet == null || addressStreet == "" || addressCity == null || addressCity == "" || addressState == null || addressState == "" || addressZip == null || addressZip == "")
            return true;

          var stateObj = mapState(addressState);

          var url = nlapiResolveURL("SUITELET", "customscript_address_update", "customdeploy_address_update");
          url += "&rectype=customer";
          url += "&recid=" + customerId;
          url += "&street=" + addressStreet;
          url += "&city=" + addressCity;
          url += "&state=" + stateObj.abbrev;
          url += "&zip=" + addressZip;
          url += "&name=" + nlapiGetFieldValue("custpage_first_name") + " " + nlapiGetFieldValue("custpage_last_name");

          nlapiRequestURL(url);
        }
      }
    } else if (name == "custpage_decedent" || name == "custpage_case_no" || name == "custpage_estate_state" || name == "custpage_estate_county" || name == "custpage_estate_est_date_distr" || name == "custpage_est_status") {
      var estateId = nlapiGetFieldValue("custpage_estate");

      if (estateId == null || estateId == "") {
        var estate = nlapiCreateRecord("customer");
        estate.setFieldValue("subsidiary", "2");
        estate.setFieldValue("isperson", "F");
        estate.setFieldValue("companyname", nlapiGetFieldValue("custpage_decedent"));
        estate.setFieldValue("custentity1", nlapiGetFieldValue("custpage_case_no"));
        estate.setFieldValue("custentity3", nlapiGetFieldValue("custpage_estate_state"));
        estate.setFieldValue("custentity2", nlapiGetFieldValue("custpage_estate_county"));
        estate.setFieldValue("custentity_est_date_of_distribution", nlapiGetFieldValue("custpage_estate_est_date_distr"));
        estate.setFieldValue("category", "2");
        estate.setFieldValue("custentity_est_status", nlapiGetFieldValue("custpage_est_status"));
        estateId = nlapiSubmitRecord(estate, true, true);

        //Check if customer created, if so, update it with parent
        var customer = nlapiGetFieldValue("custpage_customer_id");
        if (customer != null && customer != "")
          nlapiSubmitField("customer", customer, "parent", estateId);

        nlapiSetFieldValue("custpage_estate", estateId, false, true);
      } else if (estateId != null && estateId != "") {
        switch (name) {
          case "custpage_decedent":
            nlapiSetFieldValue("custpage_estate", estateId, false, true);
            break;
        }
      }

      if(name == "custpage_case_no") {
        debugger;
        casenum=nlapiGetFieldValue("custpage_case_no");
        county=nlapiGetFieldValue("custpage_estate_county");
        if(county!='' && county!=null)
          nlapiSetFieldValue("custpage_casefilelink", getcasefilelink(casenum, county));
      }

      if (name == "custpage_estate_state")
        nlapiSetFieldValue("custpage_jurisdiction_state", nlapiGetFieldValue("custpage_estate_state"), false, true);

      if (name == "custpage_estate_county") {
        nlapiSetFieldValue("custpage_jurisdiction_county", nlapiGetFieldValue("custpage_estate_county"), false, true);

        if (nlapiGetFieldValue("custpage_estate_county") != null && nlapiGetFieldValue("custpage_estate_county") != "")
          county = nlapiLookupField("customrecord173", nlapiGetFieldValue("custpage_estate_county"), ["custrecord_county_pleading_title", "custrecord_county_address_of_court", "custrecord_county_court_phone_number", "custrecord_county_court_name", "custrecord_court_street_address", "custrecord_court_city", "custrecord_court_state", "custrecord_court_zip"]);
        else
          county = null;

        if (county != null && county != "") {
          nlapiSetFieldValue("custpage_jurisdiction_pleading_title", county.custrecord_county_pleading_title, false, true);
          nlapiSetFieldValue("custpage_jurisdiction_court_name", county.custrecord_county_court_name, false, true);
          //nlapiSetFieldValue("custpage_jurisdiction_address_of_court",county.custrecord_county_address_of_court.something,false,true);
          nlapiSetFieldValue("custpage_jurisdiction_court_phone", county.custrecord_county_court_phone_number, false, true);
          nlapiSetFieldValue("custpage_jurisdiction_court_address", county.custrecord_court_street_address, false, true);
          nlapiSetFieldValue("custpage_jurisdiction_court_state", county.custrecord_court_state, false, true);
          nlapiSetFieldValue("custpage_jurisdiction_court_city", county.custrecord_court_city, false, true);
          nlapiSetFieldValue("custpage_jurisdiction_court_zip", county.custrecord_court_zip, false, true);
        }
      }

    } else if (name == "custpage_jurisdiction_court_address" || name == "custpage_jurisdiction_court_city" || name == "custpage_jurisdiction_court_state" || name == "custpage_jurisdiction_court_zip" || name == "custpage_jurisdiction_pleading_title" || name == "custpage_jurisdiction_address_of_court" || name == "custpage_jurisdiction_court_phone" || name == "custpage_jurisdiction_court_name") {
      var county = nlapiGetFieldValue("custpage_jurisdiction_county");

      if (county != null && county != "") {
        switch (name) {
          case "custpage_jurisdiction_court_name":
            nlapiSubmitField("customrecord173", county, "custrecord_county_court_name", nlapiGetFieldValue(name));
            break;
          case "custpage_jurisdiction_pleading_title":
            nlapiSubmitField("customrecord173", county, "custrecord_county_pleading_title", nlapiGetFieldValue(name));
            break;
          case "custpage_jurisdiction_address_of_court":
            nlapiSubmitField("customrecord173", county, "custrecord_county_address_of_court", nlapiGetFieldValue(name));
            break;
          case "custpage_jurisdiction_court_phone":
            nlapiSubmitField("customrecord173", county, "custrecord_county_court_phone_number", nlapiGetFieldValue(name));
            break;
          case "custpage_jurisdiction_court_address":
            nlapiSubmitField("customrecord173", county, "custrecord_court_street_address", nlapiGetFieldValue(name));
            break;
          case "custpage_jurisdiction_court_city":
            nlapiSubmitField("customrecord173", county, "custrecord_court_city", nlapiGetFieldValue(name));
            break;
          case "custpage_jurisdiction_court_state":
            nlapiSubmitField("customrecord173", county, "custrecord_court_state", nlapiGetFieldValue(name));
            break;
          case "custpage_jurisdiction_court_zip":
            nlapiSubmitField("customrecord173", county, "custrecord_court_zip", nlapiGetFieldValue(name));
            break;
        }
      }
    } else if (name == "custpage_jurisdiction_county") {
      var county = nlapiGetFieldValue("custpage_jurisdiction_county");
      nlapiSetFieldValue("custpage_estate_county", county, false, true);

      if (county != null && county != "") {
        county = nlapiLookupField("customrecord173", nlapiGetFieldValue("custpage_jurisdiction_county"), ["custrecord_county_pleading_title", "custrecord_county_address_of_court", "custrecord_county_court_phone_number", "custrecord_county_court_name", "custrecord_court_street_address", "custrecord_court_city", "custrecord_court_state", "custrecord_court_zip"]);

        nlapiSetFieldValue("custpage_jurisdiction_pleading_title", county.custrecord_county_pleading_title, false, true);
        nlapiSetFieldValue("custpage_jurisdiction_court_name", county.custrecord_county_court_name, false, true);
        nlapiSetFieldValue("custpage_jurisdiction_court_phone", county.custrecord_county_court_phone_number, false, true);
        nlapiSetFieldValue("custpage_jurisdiction_court_address", county.custrecord_court_street_address, false, true);
        nlapiSetFieldValue("custpage_jurisdiction_court_state", county.custrecord_court_state, false, true);
        nlapiSetFieldValue("custpage_jurisdiction_court_city", county.custrecord_court_city, false, true);
        nlapiSetFieldValue("custpage_jurisdiction_court_zip", county.custrecord_court_zip, false, true);
      } else {
        nlapiSetFieldValue("custpage_jurisdiction_pleading_title", "", false, true);
        nlapiSetFieldValue("custpage_jurisdiction_court_name", "", false, true);
        nlapiSetFieldValue("custpage_jurisdiction_court_phone", "", false, true);
        nlapiSetFieldValue("custpage_jurisdiction_court_address", "", false, true);
        nlapiSetFieldValue("custpage_jurisdiction_court_state", "", false, true);
        nlapiSetFieldValue("custpage_jurisdiction_court_city", "", false, true);
        nlapiSetFieldValue("custpage_jurisdiction_court_zip", "", false, true);
      }
    } else if (name == "custpage_estate_filing_date") {
      calculateMonths();
      var estateId = nlapiGetFieldValue("custpage_estate");
    } else if (name == 'custpage_attorney_rating') {
      nlapiSubmitField('contact', nlapiGetFieldValue("custpage_attorney_id"), "custentity_attorney_rating", nlapiGetFieldValue(name));
    } else if (name == 'custpage_personal_rep_1_relationship') {
      nlapiSubmitField('contact', nlapiGetFieldValue("custpage_personal_rep_1_id"), "custentity_pr_relationship", nlapiGetFieldValue(name));
    } else if (name == 'custpage_attorney_notes') {
      nlapiSubmitField('contact', nlapiGetFieldValue("custpage_attorney_id"), "custentity_contact_notes", nlapiGetFieldValue(name));
    } else if (name == 'custpage_personal_rep_1_notes') {
      var prnote1=nlapiGetFieldValue(name);
      if(prnote1) {
        nlapiSubmitField('contact', nlapiGetFieldValue("custpage_personal_rep_1_id"), "custentity_contact_notes", prnote1);
        var phonecall=nlapiCreateRecord('phonecall');
        var d=new Date();
        var today=''+(d.getMonth()+1).toString()+'/'+d.getDate()+'/'+d.getFullYear();
        phonecall.setFieldValue("company", nlapiGetFieldValue("custpage_estate"));
        phonecall.setFieldValue("title", "PR Note");
        phonecall.setFieldValue("startdate", today);
        phonecall.setFieldValue("assigned", nlapiGetUser());
        phonecall.setFieldValue("message", prnote1);
        var phonecallId = nlapiSubmitRecord(phonecall, true, true);
      }
    } else if (name == 'custpage_attorney_id') {
      addUpdateContact('attorney', name);
    } else if (name == "custpage_personal_rep_1_id") {
      addUpdateContact("personal", name);
    } else if (name == "custpage_notes") {
      var customerId = nlapiGetFieldValue("custpage_customer_id");

      if (customerId != null && customerId != "") {
        //Create new user note
        var note = nlapiCreateRecord("note");
        note.setFieldValue("entity", customerId);
        note.setFieldValue("note", nlapiGetFieldValue("custpage_notes"));
        var noteId = nlapiSubmitRecord(note, true, true);
        //Refresh files sublist with new values
//            var url = '/app/site/hosting/scriptlet.nl?script=180&deploy=1&r=T&machine=custpage_user_notes&compid=5295340&customer=' + nlapiGetFieldValue("custpage_customer_id") + '&estate=' + nlapiGetFieldValue("custpage_estate");
//            document.getElementById('server_commands').src = url;
////            window.location.reload();
//            reloadpage();
      }
    } else if (type == "custpage_prior_quotes" && name == "custpage_quote_status") {
      console.log("In field changes for quotes sublist, status field");

      var quoteId = nlapiGetLineItemValue("custpage_prior_quotes", "custpage_quote_internalid", line);
      var quoteStatus = nlapiGetLineItemValue("custpage_prior_quotes", "custpage_quote_status", line);

      if (quoteId != null && quoteId != "") {
        console.log("Updating status on quote " + quoteId);

        nlapiSubmitField("estimate", quoteId, "custbody_quote_status", quoteStatus);
      }
    } else if (type == "custpage_prior_quotes" && name == "custpage_quote_preferred") {
      var quoteId = nlapiGetCurrentLineItemValue("custpage_prior_quotes", "custpage_quote_internalid");
      var isPreferred = nlapiGetCurrentLineItemValue("custpage_prior_quotes", "custpage_quote_preferred");

      if (quoteId != null && quoteId != "") {
        console.log("Updating status on quote " + quoteId);

        nlapiSubmitField("estimate", quoteId, "custbody_preferred_quote", isPreferred);

        for (var x = 0; x < nlapiGetLineItemCount("custpage_prior_quotes"); x++) {
          if (nlapiGetLineItemValue("custpage_prior_quotes", "custpage_quote_preferred", x + 1) == "T" && nlapiGetLineItemValue("custpage_prior_quotes", "custpage_quote_internalid", x + 1) != quoteId) {
            nlapiSetLineItemValue("custpage_prior_quotes", "custpage_quote_preferred", x + 1, "F");
            nlapiSubmitField("estimate", nlapiGetLineItemValue("custpage_prior_quotes", "custpage_quote_internalid", x + 1), "custbody_preferred_quote", "F");
          }
        }
      }
    }
    /*else if (name == "custpage_latest_status") {
      try {
      var caseStatus = nlapiGetFieldValue("custpage_latest_status");
      var caseStatusRec = nlapiGetFieldValue("custpage_latest_status_id");

      nlapiSubmitField("customrecord_case_status", caseStatusRec, "custrecord_case_status_status", caseStatus);
      } catch (err) {
      nlapiLogExecution("error", "Error Updating Case Status", "Details: " + err.message);
      }

      }*/
    else if (name == 'custpage_latest_status') {
      try {
        console.log(name)
        var caseNotes = nlapiGetFieldValue("custpage_latest_status_notes");
        var caseStatus = nlapiGetFieldValue("custpage_latest_status");
        var customer = nlapiGetFieldValue("custpage_customer_id");
        if (caseStatus) {
          //Create new case status note
          var caseStatusRec = nlapiCreateRecord("customrecord_case_status");
          if (caseStatus != '' && caseStatus != null)
            caseStatusRec.setFieldValue("custrecord_case_status_status", caseStatus);
          if (caseNotes != '' && caseNotes != '')
            caseStatusRec.setFieldValue("custrecord_case_status_notes", caseNotes);
          caseStatusRec.setFieldValue("custrecord_case_status_customer", customer);
          var caseStatusRecId = nlapiSubmitRecord(caseStatusRec, true, true);
          console.log(caseStatusRecId)
          //Update latest status ID
          nlapiSetFieldValue("custpage_latest_status_id", caseStatusRecId, true, true);
          takeSnapshot({event: 'CASESTATUS', documenttype: 'casestatus', documentid: caseStatusRecId});
        }
      } catch (err) {
        nlapiLogExecution("error", "Error Updating Case Status Notes", "Details: " + err.message);
      } finally {
      }
    } else if (name == "custpage_latest_status_notes") {
      try {
        console.log(name)
        var caseNotes = nlapiGetFieldValue("custpage_latest_status_notes");
        var caseStatus = nlapiGetFieldValue("custpage_latest_status");
        var customer = nlapiGetFieldValue("custpage_customer_id");
        if (caseNotes) {
          //Create new case status note
          var caseStatusRec = nlapiCreateRecord("customrecord_case_status");
          if (caseStatus != '' && caseStatus != null)
            caseStatusRec.setFieldValue("custrecord_case_status_status", caseStatus);
          if (caseNotes != '' && caseNotes != '')
            caseStatusRec.setFieldValue("custrecord_case_status_notes", caseNotes);
          caseStatusRec.setFieldValue("custrecord_case_status_customer", customer);
          var caseStatusRecId = nlapiSubmitRecord(caseStatusRec, true, true);
          console.log(caseStatusRecId)
          //Update latest status ID
          nlapiSetFieldValue("custpage_latest_status_id", caseStatusRecId, true, true);
          takeSnapshot({event: 'CASESTATUS', documenttype: 'casestatus', documentid: caseStatusRecId});
        }
      } catch (err) {
        nlapiLogExecution("error", "Error Updating Case Status Notes", "Details: " + err.message);
      }
    } else if (name == "custpage_sales_rep") {

      var customerId = nlapiGetFieldValue("custpage_customer_id");
      console.log('Enter' + name + '////////' + customerId + '//////' + nlapiGetFieldValue("custpage_sales_rep"));
      if (customerId) {
        var salesrep = nlapiGetFieldValue("custpage_sales_rep");
        if (!salesrep || salesrep == 'undefined')
          salesrep = null;
//      var customerId = nlapiSubmitField("customer", customerId, ["salesrep", "custentity_sales_rep"], [salesrep, salesrep]);
        console.log('submit Enter ' + customerId);

      }
    } else if (name == 'custpage_followup_completed' && type == 'custpage_followup_list') {
      var completed = nlapiGetCurrentLineItemValue("custpage_followup_list", "custpage_followup_completed");
      var followupId = nlapiGetCurrentLineItemValue("custpage_followup_list", "custpage_followup_id");
      var curruser = nlapiGetContext().user;
      if (followupId != null && followupId != "") {
        var dateVal = nlapiDateToString(new Date(), 'datetimetz');
        nlapiSubmitField("customrecord_customer_follow_up", followupId, ["custrecord_followup_completed", "custrecord_complete_date", "custrecord_followup_completedby"], [completed, dateVal, curruser]);
        //nlapiSetCurrentLineItemDateTimeValue("custpage_followup_list", "custpage_followup_completed_date",dateVal);
        nlapiSetCurrentLineItemValue("custpage_followup_list", "custpage_followup_completed_date", dateVal);
        nlapiSetCurrentLineItemValue("custpage_followup_list", "custpage_followup_completedby", curruser);
      }
    } else if (name == 'custpage_followup_completedby' && type == 'custpage_followup_list') {
      var followupId = nlapiGetCurrentLineItemValue("custpage_followup_list", "custpage_followup_id");
      var completedby = nlapiGetCurrentLineItemValue("custpage_followup_list", "custpage_followup_completedby");
      if (followupId != null && followupId != "") {
        nlapiSubmitField("customrecord_customer_follow_up", followupId, ["custrecord_followup_completedby"], [completedby]);
      }
    }
  } catch(e) {
    alert('ERROR: '+e.message+': \n'+JSON.stringify(e));
  }
  return true;
}


function flagNote(noteId, estateId, flagval) {
  var value;
  var origNoteId=nlapiLookupField('customer', estateId, 'custentity_pcl_flag_note');
  if(flagval=='T') {
    nlapiSubmitField('customer', estateId, 'custentity_pcl_flag_note', noteId);
    var lc = nlapiGetLineItemCount('custpage_phonecalls');
    for (var i = 1; i <= lc; i++) {
      var msgid = nlapiGetLineItemValue('custpage_phonecalls', 'custpage_phonecalls_id', i);
      if (msgid == noteId)
        value = 'T';
      else
        value = 'F';
      nlapiSetLineItemValue('custpage_phonecalls', 'custpage_phonecalls_flagmsg', i, value);
    }
  } else { // flagval=='F'
    if(noteId==origNoteId) {
      nlapiSubmitField('customer', estateId, 'custentity_pcl_flag_note', null);
      var lc = nlapiGetLineItemCount('custpage_phonecalls');
      for (var i = 1; i <= lc; i++) {
        var msgid = nlapiGetLineItemValue('custpage_phonecalls', 'custpage_phonecalls_id', i);
        nlapiSetLineItemValue('custpage_phonecalls', 'custpage_phonecalls_flagmsg', i, flagval);
      }
    }
  }
  return true;
}



function attachAssignment(invoiceId) {
  var url = nlapiResolveURL("SUITELET", "customscript_document_uploader", "customdeploy_document_uploader");
  url += "&invoice=" + invoiceId;

  window.open(url, 'docUploadWin', 'dependent=yes,width=500,height=300');
}

function fileUploadCallback() {
  //Refresh files sublist with new values
//    var url = '/app/site/hosting/scriptlet.nl?script=180&deploy=1&r=T&machine=custpage_invoice_list&compid=5295340&customer=' + nlapiGetFieldValue("custpage_customer_id") + '&estate=' + nlapiGetFieldValue("custpage_estate");
//    document.getElementById('server_commands').src = url;
////    window.location.reload();
//    reloadpage();
}

function New_Cust_App_CS_VF(type, name, linenum) {
  if (type == "custpage_properties" && name == "custpage_property_mortgage") {
    try {
      //Ensure mortgage is positive value
      var mortgage = nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_mortgage");

      if (mortgage != null && mortgage != "" && mortgage < 0) {
        alert("Mortgage value must be positive.");
        return false;
      } else {
        return true;
      }
    } catch (err) {
      nlapiLogExecution("error", "Error Checking Mortgage Value to Be Positive", "Details: " + err.message);
      return true;
    }
  } else if (type == "custpage_claims" && name == "custpage_claims_value") {
    try {
      //Ensure claim amount is positive value
      var claim = nlapiGetCurrentLineItemValue("custpage_claims", "custpage_claims_value");

      if (claim != null && claim != "" && claim < 0) {
        alert("Claim value must be positive.");
        return false;
      } else {
        return true;
      }
    } catch (err) {
      nlapiLogExecution("error", "Error Checking Claim Value to Be Positive", "Details: " + err.message);
      return true;
    }
  } else if (name == "custpage_liens_judgments" || name == "custpage_bequest_due") {
    try {
      //Ensure amount is positive value
      var value = nlapiGetFieldValue(name);

      if (value != null && value != "" && value < 0) {
        alert("Value must be positive.");
        nlapiSetFieldValue(name, "", false, true);
        return false;
      } else {
        return true;
      }
    } catch (err) {
      nlapiLogExecution("error", "Error Checking Value to Be Positive", "Details: " + err.message);
      return true;
    }
  } else if (name == "custpage_customer_id") {
    //Verify to see if customer is customer versus estate
    var category = nlapiLookupField("customer", nlapiGetFieldValue(name), "category");

    if (category != "1") {
      alert("You have selected an Estate. Please select a Customer for this field only.");
      return false;
    }
    return true;
  } else if (name == "custpage_estate") {
    //Verify to see if customer is customer versus estate
    var category = nlapiLookupField("customer", nlapiGetFieldValue(name), "category");

    if (category != "2") {
      alert("You have selected a Customer. Please select an Estate for this field only.");
      return false;
    }
    return true;
  } else {
    return true;
  }
  return true;
}

/*
  function calcEstateTotals() {
    calculateMonths();
    var customerId = nlapiGetFieldValue("custpage_customer_id");
    var estateId = nlapiGetFieldValue("custpage_estate");

    var properties = 0.00;
    var assets = 0.00;
    var claims = 0.00;

    var closing = 0.00;

    for (var x = 0; x < nlapiGetLineItemCount("custpage_properties"); x++) {
        properties += parseFloat(nlapiGetLineItemValue("custpage_properties", "custpage_property_total", x + 1));

        closing += (parseFloat(nlapiGetLineItemValue("custpage_properties", "custpage_property_value", x + 1)) * (parseFloat(nlapiGetLineItemValue("custpage_properties", "custpage_property_owned", x + 1)) / 100));
    }

    for (var x = 0; x < nlapiGetLineItemCount("custpage_accounts"); x++) {
        assets += parseFloat(nlapiGetLineItemValue("custpage_accounts", "custpage_accounts_value", x + 1));
    }

    for (var x = 0; x < nlapiGetLineItemCount("custpage_claims"); x++) {
        claims += parseFloat(nlapiGetLineItemValue("custpage_claims", "custpage_claims_value", x + 1));
    }

    nlapiSetFieldValue("custpage_total_property", parseInt(properties), true, true);
    nlapiSetFieldValue("custpage_total_assets", parseInt(assets), true, true);
    nlapiSetFieldValue("custpage_total_claims", parseInt(claims), true, true);

    nlapiSetFieldValue("custpage_closing_costs", parseInt(closing * 0.06), true, true);

    var attorneyFee = (properties + assets) * 0.06;
    if (attorneyFee < 3000)
        attorneyFee = 3000;

    nlapiSetFieldValue("custpage_attorney_fees", parseInt(attorneyFee), true, true);

    var total = parseFloat(properties) + parseFloat(assets) - parseFloat(claims) - parseFloat(nlapiGetFieldValue("custpage_specific_bequests")) - parseFloat(nlapiGetFieldValue("custpage_closing_costs")) - parseFloat(nlapiGetFieldValue("custpage_attorney_fees"));
    nlapiSetFieldValue("custpage_net_equity_value_1", parseInt(total), true, true);

}
*/

function calcEstateTotals() {
  if (!window.hasOwnProperty('values')) {
    window.values = {};
  }
  calculateMonths();
  var customerId = nlapiGetFieldValue("custpage_customer_id");
  var estateId = nlapiGetFieldValue("custpage_estate");

  var properties = 0.00;
  var assets = 0.00;
  var claims = 0.00;

  var closing = 0.00;
  window.values.properties10 = 0.0;

  for (var x = 0; x < nlapiGetLineItemCount("custpage_properties"); x++) {
    var propvalue = parseFloat(nlapiGetLineItemValue("custpage_properties", "custpage_property_value", x + 1));
    var propmort = parseFloat(nlapiGetLineItemValue("custpage_properties", "custpage_property_mortgage", x + 1));
    var propowned = parseFloat(nlapiGetLineItemValue("custpage_properties", "custpage_property_owned", x + 1));
    var proptotal = parseFloat(nlapiGetLineItemValue("custpage_properties", "custpage_property_total", x + 1));
    properties += proptotal;
    window.values.properties10 += (0.9 * propvalue - propmort) * propowned / 100 || 0;

    closing += (parseFloat(nlapiGetLineItemValue("custpage_properties", "custpage_property_value", x + 1)) * (parseFloat(nlapiGetLineItemValue("custpage_properties", "custpage_property_owned", x + 1)) / 100));
  }
  window.values.properties = parseFloat(properties);
  window.values.closing = parseFloat(closing) || 0;

  for (var x = 0; x < nlapiGetLineItemCount("custpage_accounts"); x++) {
    assets += parseFloat(nlapiGetLineItemValue("custpage_accounts", "custpage_accounts_value", x + 1));
  }
  window.values.assets = parseFloat(assets) || 0;

  for (var x = 0; x < nlapiGetLineItemCount("custpage_claims"); x++) {
    claims += parseFloat(nlapiGetLineItemValue("custpage_claims", "custpage_claims_value", x + 1));
  }
  window.values.claims = parseFloat(claims) || 0;

  nlapiSetFieldValue("custpage_total_property", parseInt(properties), true, true);
  nlapiSetFieldValue("custpage_total_assets", parseInt(assets), true, true);
  nlapiSetFieldValue("custpage_total_claims", parseInt(claims), true, true);

  nlapiSetFieldValue("custpage_closing_costs", parseInt(closing * 0.06), true, true);

  var attorneyFee = (properties + assets) * 0.06;
  if (attorneyFee < 3000)
    attorneyFee = 3000;

  nlapiSetFieldValue("custpage_attorney_fees", parseInt(attorneyFee), true, true);

  var total = parseFloat(properties) + parseFloat(assets) - parseFloat(claims) - parseFloat(nlapiGetFieldValue("custpage_specific_bequests")) - parseFloat(nlapiGetFieldValue("custpage_closing_costs")) - parseFloat(nlapiGetFieldValue("custpage_attorney_fees"));
  nlapiSetFieldValue("custpage_net_equity_value_1", parseInt(total), true, true);
}

function New_Cust_App_CS_Recalc(type) {
  if (type == "custpage_properties" || type == "custpage_accounts" || type == "custpage_claims") {
    try {
      calcEstateTotals();
      calculateMonths();
    } catch (err) {
      nlapiLogExecution("error", "Error Calculating Totals", "Details: " + err.message);
      console.log("Error Calculating Totals: " + err.message);
    }
  } else if (type == "custpage_other_assignments") {
    calcTotalAssignments();
  } else if (type == "custpage_leins_judgements_list") {
    calcTotalLeins();
  }
  return true;
}

function calcTotalAssignments() {
  var totalAssignments = 0.00;

  for (var x = 0; x < nlapiGetLineItemCount("custpage_other_assignments"); x++) {
    totalAssignments += parseFloat(nlapiGetLineItemValue("custpage_other_assignments", "custpage_other_assignment", x + 1));
  }

  nlapiSetFieldValue("custpage_existing_agreements", parseInt(totalAssignments), true, true);
//*
  var customerId = nlapiGetFieldValue("custpage_customer_id");
  if (customerId != null && customerId != '') {
    var totalopeninvoices = 0.0;
    var invoiceSearch = nlapiSearchRecord("invoice", null,
        [
          ["type", "anyof", "CustInvc"],
          "AND",
          ["status", "anyof", "CustInvc:A"],
          "AND",
          ["mainline", "is", "T"],
          "AND",
          ["customer.internalid", "anyof", customerId],
        ],
        [
          new nlobjSearchColumn("amountremaining")
        ]
    );
    if (invoiceSearch) {
      invoiceSearch.forEach(function (result) {
        totalopeninvoices += parseFloat(result.rawValues[0].value);
        return true;
      });
    }
    nlapiSetFieldValue("custpage_invoices_total_assignments", totalopeninvoices);
  }
//*/
}

function calcTotalLeins() {
  var totalLeins = 0.00;

  for (var x = 0; x < nlapiGetLineItemCount("custpage_leins_judgements_list"); x++) {
    totalLeins += parseFloat(nlapiGetLineItemValue("custpage_leins_judgements_list", "custpage_lein_judgement_amount", x + 1));
  }

  nlapiSetFieldValue("custpage_liens_judgments", parseInt(totalLeins), true, true);
}

function New_Cust_App_CS_LI(type) {
  try {
    var completed = nlapiGetCurrentLineItemValue(type, "custpage_followup_completed");
    if (completed == 'T') {
      nlapiDisableLineItemField(type, "custpage_followup_completed", true);
    } else {
      nlapiDisableLineItemField(type, "custpage_followup_completed", false);
    }
    if (completed == 'T') {
      nlapiDisableLineItemField(type, "custpage_followup_completedby", true);
    } else {
      nlapiDisableLineItemField(type, "custpage_followup_completedby", false);
    }
    if (type != "custpage_other_assignments") {
      return;
    }
    var companyname = nlapiGetCurrentLineItemValue(type, "custpage_other_company");

    if (companyname.search("Probate Advance #") != -1) {
      nlapiDisableLineItemField(type, "custpage_other_company", true);
      nlapiDisableLineItemField(type, "custpage_other_date", true);
      nlapiDisableLineItemField(type, "custpage_other_assignment", true);
      //nlapiDisableLineItemField(type, "custpage_other_priority", true);
      //jQuery('#custpage_other_assignments_addedit').prop('disabled', true);
      //custpage_other_assignments_machine.clearline(true);
    } else {
      nlapiDisableLineItemField(type, "custpage_other_company", false);
      nlapiDisableLineItemField(type, "custpage_other_date", false);
      nlapiDisableLineItemField(type, "custpage_other_assignment", false);
      //nlapiDisableLineItemField(type, "custpage_other_priority", false);
      //jQuery('#custpage_other_assignments_addedit').prop('disabled', false);
    }
  } catch (err) {
    nlapiLogExecution("error", "Error Executing Validate Line (Sublist ID: " + type + ")", "Details: " + err.message);
  }
  return true;
}

function New_Cust_App_CS_VL(type) {
  try {
    if (type == "custpage_properties") {
      console.log("In properties sublist validate line function...");

      var recordId = nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_id");

      if (recordId != null && recordId != "") {
        console.log("Line has a record already, updating");

        var fields = ["name", "custrecord_property_value", "custrecord_property_mortgage", "custrecord_property_percent_owned", "custrecord_property_total", "custrecord_event_type_new"];
        var data = [];
        data.push(nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_address"));
        data.push(nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_value"));
        data.push(nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_mortgage"));
        data.push(nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_owned"));
        data.push(nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_total"));
        data.push(nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_eventtype"));

        nlapiSubmitField("customrecord_property", recordId, fields, data);
      } else {
        console.log("Creating new record");

        var property = nlapiCreateRecord("customrecord_property");
        property.setFieldValue("name", nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_address"));
        property.setFieldValue("custrecord_property_value", nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_value"));
        property.setFieldValue("custrecord_property_mortgage", nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_mortgage"));
        property.setFieldValue("custrecord_property_percent_owned", nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_owned"));
        property.setFieldValue("custrecord_property_total", nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_total"));
        property.setFieldValue("custrecord_property_estate", nlapiGetFieldValue("custpage_estate"));
        property.setFieldValue("custrecord_event_type_new", nlapiGetCurrentLineItemValue("custpage_properties", "custpage_property_eventtype"));
        var propertyId = nlapiSubmitRecord(property, true, true);

        nlapiSetCurrentLineItemValue("custpage_properties", "custpage_property_id", propertyId, false, true);
      }
    } else if (type == "custpage_accounts") {
      var recordId = nlapiGetCurrentLineItemValue("custpage_accounts", "custpage_accounts_id");

      if (recordId != null && recordId != "") {
        var fields = ["name", "custrecord_asset_date", "custrecord_asset_value"];
        var data = [];
        data.push(nlapiGetCurrentLineItemValue("custpage_accounts", "custpage_accounts_name"));
        data.push(nlapiGetCurrentLineItemValue("custpage_accounts", "custpage_accounts_date"));
        data.push(nlapiGetCurrentLineItemValue("custpage_accounts", "custpage_accounts_value"));

        nlapiSubmitField("customrecord_asset", recordId, fields, data);
      } else {
        var account = nlapiCreateRecord("customrecord_asset");
        account.setFieldValue("name", nlapiGetCurrentLineItemValue("custpage_accounts", "custpage_accounts_name"));
        account.setFieldValue("custrecord_asset_date", nlapiGetCurrentLineItemValue("custpage_accounts", "custpage_accounts_date"));
        account.setFieldValue("custrecord_asset_value", nlapiGetCurrentLineItemValue("custpage_accounts", "custpage_accounts_value"));
        account.setFieldValue("custrecord_asset_estate", nlapiGetFieldValue("custpage_estate"));
        var accountId = nlapiSubmitRecord(account, true, true);

        nlapiSetCurrentLineItemValue("custpage_accounts", "custpage_accounts_id", accountId, false, true);
      }
    } else if (type == "custpage_claims") {
      var recordId = nlapiGetCurrentLineItemValue("custpage_claims", "custpage_claim_id");

      if (recordId != null && recordId != "") {
        var fields = ["name", "custrecord_claim_date", "custrecord_claim_value"];
        var data = [];
        data.push(nlapiGetCurrentLineItemValue("custpage_claims", "custpage_claims_name"));
        data.push(nlapiGetCurrentLineItemValue("custpage_claims", "custpage_claims_date"));
        data.push(nlapiGetCurrentLineItemValue("custpage_claims", "custpage_claims_value"));

        nlapiSubmitField("customrecord_claim", recordId, fields, data);
      } else {
        var claim = nlapiCreateRecord("customrecord_claim");
        claim.setFieldValue("name", nlapiGetCurrentLineItemValue("custpage_claims", "custpage_claims_name"));
        claim.setFieldValue("custrecord_claim_date", nlapiGetCurrentLineItemValue("custpage_claims", "custpage_claims_date"));
        claim.setFieldValue("custrecord_claim_value", nlapiGetCurrentLineItemValue("custpage_claims", "custpage_claims_value"));
        claim.setFieldValue("custrecord_claim_estate", nlapiGetFieldValue("custpage_estate"));
        var claimId = nlapiSubmitRecord(claim, true, true);

        nlapiSetCurrentLineItemValue("custpage_claims", "custpage_claim_id", claimId, false, true);
      }
    } else if (type == "custpage_other_assignments") {
      var recordId = nlapiGetCurrentLineItemValue("custpage_other_assignments", "custpage_assignment_id");

      console.log("RecordId = " + recordId);
      if (recordId != null && recordId != "") {
        var fields = ["name", "custrecord_existing_assignment_date", "custrecord_existing_assignment_amount", "custrecord_existing_assignment_priority"];
        var data = [];
        data.push(nlapiGetCurrentLineItemValue("custpage_other_assignments", "custpage_other_company"));
        data.push(nlapiGetCurrentLineItemValue("custpage_other_assignments", "custpage_other_date"));
        data.push(nlapiGetCurrentLineItemValue("custpage_other_assignments", "custpage_other_assignment"));
        data.push(nlapiGetCurrentLineItemValue("custpage_other_assignments", "custpage_other_priority"));
        nlapiSubmitField("customrecord_existing_assignment", recordId, fields, data);
      } else {
        var assignment = nlapiCreateRecord("customrecord_existing_assignment");
        assignment.setFieldValue("name", nlapiGetCurrentLineItemValue("custpage_other_assignments", "custpage_other_company"));
        assignment.setFieldValue("custrecord_existing_assignment_date", nlapiGetCurrentLineItemValue("custpage_other_assignments", "custpage_other_date"));
        assignment.setFieldValue("custrecord_existing_assignment_amount", nlapiGetCurrentLineItemValue("custpage_other_assignments", "custpage_other_assignment"));
        assignment.setFieldValue("custrecord_existing_assignment_estate", nlapiGetFieldValue("custpage_estate"));
        assignment.setFieldValue("custrecord_existing_assignment_customer", nlapiGetFieldValue("custpage_customer_id"));
        assignment.setFieldValue("custrecord_existing_assignment_priority", nlapiGetCurrentLineItemValue("custpage_other_assignments", "custpage_other_priority"));
        console.log("Periority = " + nlapiGetCurrentLineItemValue("custpage_other_assignments", "custpage_other_priority"));
        var assignmentId = nlapiSubmitRecord(assignment, true, true);

        nlapiSetCurrentLineItemValue("custpage_other_assignments", "custpage_assignment_id", assignmentId, false, true);
      }
    } else if (type == "custpage_leins_judgements_list") {
      var recordId = nlapiGetCurrentLineItemValue("custpage_leins_judgements_list", "custpage_lein_id");

      if (recordId != null && recordId != "") {
        var fields = ["name", "custrecord_lein_judgement_date", "custrecord_lein_judgement_amount"];
        var data = [];
        data.push(nlapiGetCurrentLineItemValue("custpage_leins_judgements_list", "custpage_lein_judgement_name"));
        data.push(nlapiGetCurrentLineItemValue("custpage_leins_judgements_list", "custpage_lein_judgement_date"));
        data.push(nlapiGetCurrentLineItemValue("custpage_leins_judgements_list", "custpage_lein_judgement_amount"));

        nlapiSubmitField("customrecord_lein_judgement", recordId, fields, data);
      } else {
        var lein = nlapiCreateRecord("customrecord_lein_judgement");
        lein.setFieldValue("name", nlapiGetCurrentLineItemValue("custpage_leins_judgements_list", "custpage_lein_judgement_name"));
        lein.setFieldValue("custrecord_lein_judgement_date", nlapiGetCurrentLineItemValue("custpage_leins_judgements_list", "custpage_lein_judgement_date"));
        lein.setFieldValue("custrecord_lein_judgement_amount", nlapiGetCurrentLineItemValue("custpage_leins_judgements_list", "custpage_lein_judgement_amount"));
        lein.setFieldValue("custrecord_lein_judgement_estate", nlapiGetFieldValue("custpage_estate"));
        lein.setFieldValue("custrecord_lein_judgement_customer", nlapiGetFieldValue("custpage_customer_id"));
        var leinId = nlapiSubmitRecord(lein, true, true);

        nlapiSetCurrentLineItemValue("custpage_leins_judgements_list", "custpage_lein_id", leinId, false, true);
      }
    } else if (type == "custpage_case_status_list") {
      var caseStatusId = nlapiGetCurrentLineItemValue("custpage_case_status_list", "custpage_case_status_id");
      var caseStatus = nlapiGetCurrentLineItemValue("custpage_case_status_list", "custpage_case_status_status");
      var caseStatusNotes = nlapiGetCurrentLineItemValue("custpage_case_status_list", "custpage_case_status_notes");

      if (caseStatusId == null || caseStatusId == "") {
        var statusRec = nlapiCreateRecord("customrecord_case_status");
        statusRec.setFieldValue("custrecord_case_status_status", caseStatus);
        statusRec.setFieldValue("custrecord_case_status_notes", caseStatusNotes);
        statusRec.setFieldValue("custrecord_case_status_customer", nlapiGetFieldValue("custpage_customer_id"));
        var statusRecId = nlapiSubmitRecord(statusRec, true, true);

        var timestamp = nlapiLookupField("customrecord_case_status", statusRecId, "created");
        var user = nlapiLookupField("customrecord_case_status", statusRecId, "owner", true);

        nlapiSetCurrentLineItemValue("custpage_case_status_list", "custpage_case_status_id", statusRecId, false, true);
        nlapiSetCurrentLineItemValue("custpage_case_status_list", "custpage_case_status_user", user, false, true);
        nlapiSetCurrentLineItemValue("custpage_case_status_list", "custpage_case_status_timestamp", timestamp, false, true);

        nlapiSetFieldValue("custpage_latest_status", caseStatus, false, true);
        nlapiSetFieldValue("custpage_latest_status_notes", caseStatusNotes, false, true);

      } else {
//        nlapiSubmitField('customrecord_case_status', caseStatusId, ['custrecord_case_status_status', 'custrecord_case_status_notes'], [caseStatus, caseStatusNotes]);
      }
      takeSnapshot({event: 'CASESTATUS', documenttype: 'casestatus', documentid: statusRecId});
    } else if (type == "custpage_contacts") {
      var recordId = nlapiGetCurrentLineItemValue("custpage_contacts", "custpage_contacts_id");

      if (recordId != null && recordId != "") {
        var fields = ["name", "jobtitle", "email", "phone"];

        var data = [];
        data.push(nlapiGetCurrentLineItemValue("custpage_contacts", "custpage_contacts_name"));
        data.push(nlapiGetCurrentLineItemValue("custpage_contacts", "custpage_contacts_job_title"));
        data.push(nlapiGetCurrentLineItemValue("custpage_contacts", "custpage_contacts_email"));
        data.push(nlapiGetCurrentLineItemValue("custpage_contacts", "custpage_contacts_phone"));

        nlapiSubmitField("contact", recordId, fields, data);
      } else {
        var contact = nlapiCreateRecord("contact", {
          recordmode: "dynamic"
        });
        contact.setFieldValue("company", nlapiGetFieldValue("custpage_estate"));
        contact.setFieldValue("entityid", nlapiGetCurrentLineItemValue("custpage_contacts", "custpage_contacts_name"));
        contact.setFieldValue("jobtitle", nlapiGetCurrentLineItemValue("custpage_contacts", "custpage_contacts_job_title"));
        contact.setFieldValue("email", nlapiGetCurrentLineItemValue("custpage_contacts", "custpage_contacts_email"));
        contact.setFieldValue("phone", nlapiGetCurrentLineItemValue("custpage_contacts", "custpage_contacts_phone"));
        contact.setFieldValue("contactrole", nlapiGetCurrentLineItemValue("custpage_contacts", "custpage_contacts_role"));
        var contactId = nlapiSubmitRecord(contact, true, true);

        nlapiSetCurrentLineItemValue("custpage_contacts", "custpage_contacts_id", contactId, false, true);
      }
    } else if (type == "custpage_phonecalls") {
      var recordId = nlapiGetCurrentLineItemValue("custpage_phonecalls", "custpage_phonecalls_id");

      if (recordId != null && recordId != "") {
//        var fields = ["title", "startdate", "phone", "assigned", "message"];
//
//        var data = [];
//        data.push(nlapiGetCurrentLineItemValue("custpage_phonecalls", "custpage_phonecalls_title"));
//        data.push(nlapiGetCurrentLineItemValue("custpage_phonecalls", "custpage_phonecalls_date"));
//        data.push(nlapiGetCurrentLineItemValue("custpage_phonecalls", "custpage_phonecalls_phone_number"));
//        data.push(nlapiGetCurrentLineItemValue("custpage_phonecalls", "custpage_phonecalls_owner"));
//        data.push(nlapiGetCurrentLineItemValue("custpage_phonecalls", "custpage_phonecalls_message"));
//
//        nlapiSubmitField("phonecall", recordId, fields, data);
        var phonecall = nlapiLoadRecord("phonecall", recordId);
        phonecall.setFieldValue("title", nlapiGetCurrentLineItemValue("custpage_phonecalls", "custpage_phonecalls_title"));
        phonecall.setFieldValue("startdate", nlapiGetCurrentLineItemValue("custpage_phonecalls", "custpage_phonecalls_date"));
        phonecall.setFieldValue("phone", nlapiGetCurrentLineItemValue("custpage_phonecalls", "custpage_phonecalls_phone_number"));
        phonecall.setFieldValue("assigned", nlapiGetCurrentLineItemValue("custpage_phonecalls", "custpage_phonecalls_owner"));
        phonecall.setFieldValue("message", nlapiGetCurrentLineItemValue("custpage_phonecalls", "custpage_phonecalls_message"));
        var phonecallId = nlapiSubmitRecord(phonecall, true, true);
      } else {
        var phonecall = nlapiCreateRecord("phonecall", {
          recordmode: "dynamic"
        });
        phonecall.setFieldValue("company", nlapiGetFieldValue("custpage_estate"));
        phonecall.setFieldValue("title", nlapiGetCurrentLineItemValue("custpage_phonecalls", "custpage_phonecalls_title"));
        phonecall.setFieldValue("startdate", nlapiGetCurrentLineItemValue("custpage_phonecalls", "custpage_phonecalls_date"));
        phonecall.setFieldValue("phone", nlapiGetCurrentLineItemValue("custpage_phonecalls", "custpage_phonecalls_phone_number"));
        phonecall.setFieldValue("assigned", nlapiGetCurrentLineItemValue("custpage_phonecalls", "custpage_phonecalls_owner"));
        phonecall.setFieldValue("message", nlapiGetCurrentLineItemValue("custpage_phonecalls", "custpage_phonecalls_message"));
        var phonecallId = nlapiSubmitRecord(phonecall, true, true);

        nlapiSetCurrentLineItemValue("custpage_phonecalls", "custpage_phonecalls_id", phonecallId, false, true);

        //Update field for latest phone call
        var lastCallStr = nlapiGetCurrentLineItemValue("custpage_phonecalls", "custpage_phonecalls_date") + " " + nlapiGetCurrentLineItemValue("custpage_phonecalls", "custpage_phonecalls_title");
        nlapiSetFieldValue("custpage_estate_next_phonecall", lastCallStr, true, true);
      }
////////////
      var flagval = nlapiGetCurrentLineItemValue('custpage_phonecalls', 'custpage_phonecalls_flagmsg');
      var msgid = nlapiGetCurrentLineItemValue('custpage_phonecalls', 'custpage_phonecalls_id');
//    var customerId = nlapiGetFieldValue("custpage_customer_id");
      var estateId = nlapiGetFieldValue("custpage_estate");
      flagNote(msgid, estateId, flagval);
////////////

    } else if (type == "custpage_tasks") {
      var recordId = nlapiGetCurrentLineItemValue("custpage_tasks", "custpage_tasks_id");

      if (recordId != null && recordId != "") {
        var fields = ["title", "startdate", "priority", "duedate"];

        var data = [];
        data.push(nlapiGetCurrentLineItemValue("custpage_tasks", "custpage_tasks_title"));
        data.push(nlapiGetCurrentLineItemValue("custpage_tasks", "custpage_tasks_start_date"));
        data.push(nlapiGetCurrentLineItemValue("custpage_tasks", "custpage_tasks_priority"));
        data.push(nlapiGetCurrentLineItemValue("custpage_tasks", "custpage_tasks_due_date"));

        nlapiSubmitField("task", recordId, fields, data);
      } else {
        var task = nlapiCreateRecord("task", {
          recordmode: "dynamic"
        });
        task.setFieldValue("company", nlapiGetFieldValue("custpage_estate"));
        task.setFieldValue("title", nlapiGetCurrentLineItemValue("custpage_tasks", "custpage_tasks_title"));
        task.setFieldValue("startdate", nlapiGetCurrentLineItemValue("custpage_tasks", "custpage_tasks_start_date"));
        task.setFieldValue("priority", nlapiGetCurrentLineItemValue("custpage_tasks", "custpage_tasks_priority"));
        task.setFieldValue("duedate", nlapiGetCurrentLineItemValue("custpage_tasks", "custpage_tasks_due_date"));
        var taskId = nlapiSubmitRecord(task, true, true);

        nlapiSetCurrentLineItemValue("custpage_tasks", "custpage_tasks_id", taskId, false, true);
      }
    } else if (type == "custpage_events") {
      var recordId = nlapiGetCurrentLineItemValue("custpage_events", "custpage_events_id");

      if (recordId != null && recordId != "") {
        var fields = ["title", "startdate", "location", "alldayevent", "starttime", "endtime"];

        var data = [];
        data.push(nlapiGetCurrentLineItemValue("custpage_events", "custpage_events_title"));
        data.push(nlapiGetCurrentLineItemValue("custpage_events", "custpage_events_date"));
        //data.push(nlapiGetCurrentLineItemValue("custpage_events","custpage_events_location"));
        //data.push(nlapiGetCurrentLineItemValue("custpage_events","custpage_events_all_day"));
        //data.push(nlapiGetCurrentLineItemValue("custpage_events","custpage_events_start_time"));
        //data.push(nlapiGetCurrentLineItemValue("custpage_events","custpage_events_end_time"));

        nlapiSubmitField("calendarevent", recordId, fields, data);
      } else {
        var event = nlapiCreateRecord("calendarevent", {
          recordmode: "dynamic"
        });
        event.setFieldValue("company", nlapiGetFieldValue("custpage_estate"));
        event.setFieldValue("title", nlapiGetCurrentLineItemValue("custpage_events", "custpage_events_title"));
        event.setFieldValue("startdate", nlapiGetCurrentLineItemValue("custpage_events", "custpage_events_date"));
        //event.setFieldValue("location",nlapiGetCurrentLineItemValue("custpage_events","custpage_events_location"));
        //event.setFieldValue("alldayevent",nlapiGetCurrentLineItemValue("custpage_events","custpage_events_all_day"));
        //event.setFieldValue("starttime",nlapiGetCurrentLineItemValue("custpage_events","custpage_events_start_time"));
        //event.setFieldValue("endtime",nlapiGetCurrentLineItemValue("custpage_events","custpage_events_end_time"));
        var eventId = nlapiSubmitRecord(event, true, true);

        nlapiSetCurrentLineItemValue("custpage_events", "custpage_events_id", eventId, false, true);

        //Update field for latest event
        //        var lastEventStr = nlapiGetCurrentLineItemValue("custpage_events", "custpage_events_date") + " " + nlapiGetCurrentLineItemValue("custpage_events", "custpage_events_title");
        //        nlapiSetFieldValue("custpage_estate_next_event", lastEventStr, true, true);
        // added by RM on 8/15/2023 to fix the Next Event field
        setnextevent();
      }
    }
  } catch (err) {
    nlapiLogExecution("error", "Error Executing Validate Line (Sublist ID: " + type + ")", "Details: " + err.message);
  }

  return true;
}

function calculateMaxAdvance() {
  var customerId = nlapiGetFieldValue("custpage_customer_id");
  var estateId = nlapiGetFieldValue("custpage_estate");
  var netEquity = nlapiGetFieldValue("custpage_net_equity_value");
  var percentDue = nlapiGetFieldValue("custpage_percent_equity_due");

  var residual = netEquity * (parseFloat(percentDue) / 100);
  nlapiSetFieldValue("custpage_residue_equity_due", parseInt(residual) || 0, true, true);

  var bequest = nlapiGetFieldValue("custpage_bequest_due");

  var totalDueFromEstate = parseFloat(residual) + parseFloat(bequest);
  nlapiSetFieldValue("custpage_total_due", parseInt(totalDueFromEstate) || 0, true, true);

  var liens = nlapiGetFieldValue("custpage_liens_judgments");
  var assignments = nlapiGetFieldValue("custpage_existing_agreements");
  var netDue = totalDueFromEstate - parseFloat(liens) - parseFloat(assignments);
  nlapiSetFieldValue("custpage_net_due", parseInt(netDue) || 0, true, true);

  var advToCustRatio = nlapiGetFieldValue("custpage_adv_to_val_ratio");
  var maxAdvance = netDue * (parseFloat(advToCustRatio) / 100);
  nlapiSetFieldValue("custpage_max_advance", parseInt(maxAdvance) || 0, true, true);
  calculateSensitivity();
}


function calculateSensitivity() {
  var val = window.values;
  var properties = val.properties;
  var properties10 = val.properties10;
  var assets = val.assets;
  var assets10 = assets * 0.9;
  var claims = val.claims;
  var closing = val.closing * 0.06;
  var closing10 = val.closing * 0.06 * 0.9;
  var af = (properties + assets) * 0.06;
  var af10 = (properties10 + assets10) * 0.06;
  var attyfee = af > 3000 ? af : 3000;
  var attyfee10 = af10 > 3000 ? af10 : 3000;
  var bequesttoheirs = parseFloat(nlapiGetFieldValue("custpage_specific_bequests"));
  var totalassignments = parseFloat(nlapiGetFieldValue("custpage_existing_agreements"));
  var totalliens = parseFloat(nlapiGetFieldValue("custpage_liens_judgments"));
  var percentdue = parseFloat(nlapiGetFieldValue("custpage_percent_equity_due")) / 100;
  var bequesttocust = parseFloat(nlapiGetFieldValue("custpage_bequest_due"));
  var netdue = parseFloat(nlapiGetFieldValue("custpage_net_due"));

  var estatenetvalue10 = properties10 + assets10 - closing10 - attyfee10 - claims - bequesttoheirs;
  var residue10 = estatenetvalue10 * percentdue;
  var totaldue10 = residue10 + bequesttocust;
  var netdue10 = Math.round(totaldue10 - totalassignments - totalliens);
  var sens = (netdue10 - netdue) / netdue;
  var roundedsens = Math.round(1000 * sens) / 10
  nlapiSetFieldValue("custpage_sensitivity_to_10percent", roundedsens + "% ($" + netdue10 + ")");
}

function calculatePrice() {
  var priceLevel = nlapiGetFieldValue("custpage_price_level");
  var numMonths = nlapiGetFieldValue("custpage_months_remaining");
  var advance = parseFloat(nlapiGetFieldValue("custpage_desired_advance"));
  if (priceLevel == 6) {
    nlapiSetFieldValue("custpage_early_rebate_1", "", false, true);
    nlapiSetFieldValue("custpage_early_rebate_2", "", false, true);
    nlapiSetFieldValue("custpage_early_rebate_3", "", false, true);
    nlapiSetFieldValue("custpage_assignment_size", 9900);
    nlapiSetFieldValue("custpage_early_rebate_1_amt", "", false, true);
    nlapiSetFieldValue("custpage_early_rebate_2_amt", "", false, true);
    nlapiSetFieldValue("custpage_early_rebate_3_amt", "", false, true);
  } else if (priceLevel == 5) { //LEVEL 5 Starting
    var assignment_size = advance * 2;
    nlapiSetFieldValue("custpage_assignment_size", assignment_size, true, true);
    nlapiSetFieldValue("custpage_early_rebate_1", 3, false, true);
    nlapiSetFieldValue("custpage_early_rebate_2", 6, false, true);
    nlapiSetFieldValue("custpage_early_rebate_3", 9, false, true);
    var rebate_1_amt;
    var rebate_2_amt;
    var rebate_3_amt;
    var amt1 = ((advance * (1 + 0.35)) < (advance + 3000)) ? (advance + 3000) : (advance * (1 + 0.35));
    var amt2 = ((advance * (1 + 0.50)) < (advance + 6000)) ? (advance + 6000) : (advance * (1 + 0.50));
    var amt3 = ((advance * (1 + 0.75)) < (advance + 9000)) ? (advance + 9000) : (advance * (1 + 0.75));
    var rebate_1_amt = (amt1 > assignment_size) ? assignment_size : amt1;
    var rebate_2_amt = (amt2 > assignment_size) ? assignment_size : amt2;
    var rebate_3_amt = (amt3 > assignment_size) ? assignment_size : amt3;
    console.log('rebate_1_amt' + rebate_1_amt);
    if (rebate_1_amt)
      nlapiSetFieldValue("custpage_early_rebate_1_amt", rebate_1_amt, false, true);
    if (rebate_2_amt)
      nlapiSetFieldValue("custpage_early_rebate_2_amt", rebate_2_amt, false, true);
    if (rebate_3_amt)
      nlapiSetFieldValue("custpage_early_rebate_3_amt", rebate_3_amt, false, true);

  } else { //Level 5 Ending
    if (priceLevel != null && priceLevel != "" && numMonths != null && numMonths != "" && advance != null && advance != "") {
      var priceStructure = nlapiLookupField("customrecord_price_option", priceLevel, ["custrecord_fee_minimum", "custrecord_fee_percent", "custrecord_fee_return"]);

      var fee = advance * (parseFloat(priceStructure.custrecord_fee_percent) / 100);
      if (fee < parseFloat(priceStructure.custrecord_fee_minimum))
        fee = priceStructure.custrecord_fee_minimum;
      fee = parseFloat(fee);

      nlapiSetFieldValue("custpage_calculated_fee", fee, true, true);

      console.log("Fee = " + fee);

      var highAdvance = advance * 2.5;
      console.log("Advance x 2.5 = " + highAdvance);

      var rateOfReturn = parseFloat(priceStructure.custrecord_fee_return);
      console.log("Return = " + rateOfReturn);
      nlapiSetFieldValue("custpage_rate_of_return", rateOfReturn, true, true);

      var futureValue = FV(rateOfReturn, (numMonths / 12), 0, (advance + fee), 0) * -1;
      console.log("Future Value = " + futureValue);

      nlapiSetFieldValue("custpage_assignment_size", Math.ceil(futureValue / 100) * 100, true, true);

      var rebateAdvance = advance + 3000;

      var rebateOption1Months = parseInt(nlapiGetFieldValue("custpage_early_rebate_1"));
      var rebateOption2Months = parseInt(nlapiGetFieldValue("custpage_early_rebate_2"));
      var rebateOption3Months = parseInt(nlapiGetFieldValue("custpage_early_rebate_3"));

      if (rebateOption2Months == null || rebateOption2Months == "" || isNaN(rebateOption2Months))
        rebateOption2Months = 0;

      console.log("Rebate 2 Months: " + rebateOption2Months);

      var monthsBetweenRebates = rebateOption2Months - rebateOption1Months;

      console.log("monthsBetweenRebates (1): " + monthsBetweenRebates);

      if (monthsBetweenRebates < 0) {
        monthsBetweenRebates = 1;
      } else {
        monthsBetweenRebates = monthsBetweenRebates / 3 + 1;
      }

      console.log("monthsBetweenRebates (2): " + monthsBetweenRebates);

      if (nlapiGetFieldValue("custpage_early_rebate_1") != null && nlapiGetFieldValue("custpage_early_rebate_1") != "") {
        var rebateOption1 = FV((rateOfReturn + 0.025 * (monthsBetweenRebates)), (rebateOption1Months / 12), 0, (advance + fee), 0) * -1;
        if (rebateOption1 < rebateAdvance)
          rebateOption1 = rebateAdvance;
      }

      if (nlapiGetFieldValue("custpage_early_rebate_2") != null && nlapiGetFieldValue("custpage_early_rebate_2") != "") {
        var rebateOption2 = FV((rateOfReturn + 0.025), (rebateOption2Months / 12), 0, (advance + fee), 0) * -1;
        if (rebateOption2 < rebateAdvance)
          rebateOption2 = rebateAdvance;
      }

      if (nlapiGetFieldValue("custpage_early_rebate_3") != null && nlapiGetFieldValue("custpage_early_rebate_3") != "") {
        var rebateOption3 = FV((rateOfReturn + 0.025), (rebateOption3Months / 12), 0, (advance + fee), 0) * -1;
        if (rebateOption3 < rebateAdvance)
          rebateOption3 = rebateAdvance;
      }

      if (nlapiGetFieldValue("custpage_early_rebate_1") != null && nlapiGetFieldValue("custpage_early_rebate_1") != "")
        nlapiSetFieldValue("custpage_early_rebate_1_amt", Math.ceil(rebateOption1 / 100) * 100, true, true);
      if (nlapiGetFieldValue("custpage_early_rebate_2") != null && nlapiGetFieldValue("custpage_early_rebate_2") != "")
        nlapiSetFieldValue("custpage_early_rebate_2_amt", Math.ceil(rebateOption2 / 100) * 100, true, true);
      if (nlapiGetFieldValue("custpage_early_rebate_3") != null && nlapiGetFieldValue("custpage_early_rebate_3") != "")
        nlapiSetFieldValue("custpage_early_rebate_3_amt", Math.ceil(rebateOption3 / 100) * 100, true, true);
    }
  }
}

function calculateMonths() {
  var estateState = nlapiGetFieldValue("custpage_estate_state");
  var totalProperty = parseFloat(nlapiGetFieldValue("custpage_total_property"));
  var totalAssets = parseFloat(nlapiGetFieldValue("custpage_total_assets"));

  var numMonths = 0;
  if (totalProperty > totalAssets)
    numMonths = 12;

  if (estateState != null && estateState != "") {
    var stateMonths = nlapiLookupField("classification", estateState, "custrecord_state_months_estimate");
    if (stateMonths != null && stateMonths != "")
      numMonths += parseInt(stateMonths);
  }

  //Check filing date, if filing date is not empty factor that into consideration
  var filingDate = nlapiGetFieldValue("custpage_estate_filing_date");
  if (filingDate != null && filingDate != '') {
    var today = new Date();
    filingDate = nlapiStringToDate(filingDate);

    var monthsBetween = monthDiff(filingDate, today);

    numMonths = numMonths - monthsBetween;
  }

  //Ensure min # of months is at least 18
  if (numMonths < 18)
    numMonths = 18;

  nlapiSetFieldValue("custpage_months_remaining", numMonths, true, true);
}

function createQuote() {
  //Create quote
  try {
    //alert("Preparing to create quote");

    var filters = [];
    filters.push(new nlobjSearchFilter("entity", null, "is", nlapiGetFieldValue("custpage_customer_id")));
    filters.push(new nlobjSearchFilter("mainline", null, "is", "T"));
    //filters.push(new nlobjSearchFilter("custbody_preferred_quote",null, "is", "T"));
    var cols = [];
    cols.push(new nlobjSearchColumn("trandate"));
    cols.push(new nlobjSearchColumn("tranid"));
    cols.push(new nlobjSearchColumn("custbody_preferred_quote"));
    var results = nlapiSearchRecord("estimate", null, filters, cols);
    if (results) {
      for (var x = 0; x < results.length; x++) {
        var estimateId = results[x].id;
        if (results[x].getValue("custbody_preferred_quote") == 'T') {
          nlapiSubmitField("estimate", estimateId, "custbody_preferred_quote", 'F');
        }
      }
    }

    var quote = nlapiCreateRecord("estimate", {
      recordmode: "dynamic"
    });
    console.log("Created estimate object...");

    quote.setFieldValue("entity", nlapiGetFieldValue("custpage_customer_id"));
    console.log("Set customer");

    var assignment = parseFloat(nlapiGetFieldValue("custpage_assignment_size"));

    var linecount = nlapiGetLineItemCount('custpage_prior_quotes');
    //if(linecount==0)
    quote.setFieldValue("custbody_preferred_quote", 'T');
    if (nlapiGetFieldValue("custpage_early_rebate_1_amt") != null && nlapiGetFieldValue("custpage_early_rebate_1_amt") != "")
      quote.setFieldValue("custbody_rebate_1_amount", assignment - parseFloat(nlapiGetFieldValue("custpage_early_rebate_1_amt")));
    if (nlapiGetFieldValue("custpage_early_rebate_2_amt") != null && nlapiGetFieldValue("custpage_early_rebate_2_amt") != "")
      quote.setFieldValue("custbody_rebate_2_amount", assignment - parseFloat(nlapiGetFieldValue("custpage_early_rebate_2_amt")));
    if (nlapiGetFieldValue("custpage_early_rebate_3_amt") != null && nlapiGetFieldValue("custpage_early_rebate_3_amt") != "")
      quote.setFieldValue("custbody_rebate_3_amount", assignment - parseFloat(nlapiGetFieldValue("custpage_early_rebate_3_amt")));

    console.log("Set rebate amount fields in header");

    if (nlapiGetFieldValue("custpage_early_rebate_1_amt") != null && nlapiGetFieldValue("custpage_early_rebate_1_amt") != "")
      quote.setFieldValue("custbody_option_1_pricing", nlapiGetFieldValue("custpage_early_rebate_1_amt"));
    if (nlapiGetFieldValue("custpage_early_rebate_2_amt") != null && nlapiGetFieldValue("custpage_early_rebate_2_amt") != "")
      quote.setFieldValue("custbody_option_2_pricing", nlapiGetFieldValue("custpage_early_rebate_2_amt"));
    if (nlapiGetFieldValue("custpage_early_rebate_3_amt") != null && nlapiGetFieldValue("custpage_early_rebate_3_amt") != "")
      quote.setFieldValue("custbody_option_3_pricing", nlapiGetFieldValue("custpage_early_rebate_3_amt"));

    console.log("Set option amount fields in header");

    if (nlapiGetFieldValue("custpage_early_rebate_1") != null && nlapiGetFieldValue("custpage_early_rebate_1") != "")
      quote.setFieldValue("custbody_rebate_1_month", convertMonths(nlapiGetFieldValue("custpage_early_rebate_1")));
    if (nlapiGetFieldValue("custpage_early_rebate_2") != null && nlapiGetFieldValue("custpage_early_rebate_2") != "")
      quote.setFieldValue("custbody_rebate_2_month", convertMonths(nlapiGetFieldValue("custpage_early_rebate_2")));
    if (nlapiGetFieldValue("custpage_early_rebate_1") != null && nlapiGetFieldValue("custpage_early_rebate_3") != "")
      quote.setFieldValue("custbody_rebate_3_month", convertMonths(nlapiGetFieldValue("custpage_early_rebate_3")));

    console.log("Set rebate month fields in header");

    quote.selectNewLineItem("item");
    quote.setCurrentLineItemValue("item", "item", "7"); //Cash Advanced to Client
    quote.setCurrentLineItemValue("item", "rate", nlapiGetFieldValue("custpage_desired_advance"));
    quote.setCurrentLineItemValue("item", "amount", nlapiGetFieldValue("custpage_desired_advance"));
    quote.commitLineItem("item");
    console.log("Set line item #1 - cash advanced to client");

    //quote.selectNewLineItem("item");
    //quote.setCurrentLineItemValue("item","item","5"); //Fixed Fee
    //quote.setCurrentLineItemValue("item","rate",nlapiGetFieldValue("custpage_calculated_fee"));
    //quote.setCurrentLineItemValue("item","amount",nlapiGetFieldValue("custpage_calculated_fee"));
    //quote.commitLineItem("item");
    //console.log("Set line item #2 - fixed fee");

    //var deferredRevenue = assignment - 1500 - parseFloat(nlapiGetFieldValue("custpage_desired_advance"));
    var deferredRevenue = assignment - parseFloat(nlapiGetFieldValue("custpage_desired_advance"));
    nlapiLogExecution("debug", "Deferred Revenue", deferredRevenue);

    quote.selectNewLineItem("item");
    quote.setCurrentLineItemValue("item", "item", "6"); //Deferred Revenue
    quote.setCurrentLineItemValue("item", "rate", deferredRevenue);
    quote.setCurrentLineItemValue("item", "amount", deferredRevenue);
    quote.commitLineItem("item");
    console.log("Set line item #3 - deferred revenue");

    quote.setFieldValue("custbody_county", nlapiGetFieldValue("custpage_estate_county"));

    quote.setFieldValue("custbody_heir_first_name", nlapiGetFieldValue("custpage_first_name"));
    quote.setFieldValue("custbody_heir_last_name", nlapiGetFieldValue("custpage_last_name"));

    quote.setFieldValue("custbody_assignment_size", nlapiGetFieldValue("custpage_assignment_size"));
    quote.setFieldValue("custbody_advance_size", nlapiGetFieldValue("custpage_desired_advance"));

    quote.setFieldValue("custbody_decedent_name", nlapiGetFieldValue("custpage_decedent"));
    quote.setFieldValue("custbody_bill_address_1", nlapiGetFieldValue("custpage_address"));
    quote.setFieldValue("custbody_bill_city", nlapiGetFieldValue("custpage_city"));
    quote.setFieldValue("custbody_bill_state", nlapiGetFieldText("custpage_state"));
    quote.setFieldValue("custbody_bill_zip_code", nlapiGetFieldValue("custpage_zip"));

    quote.setFieldValue("custbody_case_no", nlapiGetFieldValue("custpage_case_no"));

    quote.setFieldValue("custbody_attorney", nlapiGetFieldValue("custpage_attorney_id"));
    quote.setFieldValue("custbody_personal_rep", nlapiGetFieldValue("custpage_personal_rep_1_id"));

    quote.setFieldValue("custbody_state_of_case", nlapiGetFieldValue("custpage_estate_state"));

    console.log("Set other body fields");

    var repFound = false;

    //Clear sales team sublist
    for (var x = 0; x < quote.getLineItemCount("salesteam"); x++) {
      console.log("Removing line item " + (x + 1));
      quote.removeLineItem("salesteam", x + 1);
      x--;
    }

    console.log("Sales Team Line Count: " + quote.getLineItemCount("salesteam"));

    //Add sales rep as current user
    quote.selectNewLineItem("salesteam");
    quote.setCurrentLineItemValue("salesteam", "employee", nlapiGetUser());
    quote.setCurrentLineItemValue("salesteam", "salesrole", "-2"); //Sales Role = Sales Rep
    quote.setCurrentLineItemValue("salesteam", "isprimary", "T");
    quote.setCurrentLineItemValue("salesteam", "contribution", "100%");
    quote.commitLineItem("salesteam");

    /*
        for(var x=0; x < quote.getLineItemCount("salesteam"); x++){
        if(quote.getLineItemValue("salesteam","employee",x+1)==nlapiGetUser()){
        repFound = true;
        break;
        }
        }

        if(!repFound){
        //Add sales rep as current user
        quote.selectNewLineItem("salesteam");
        quote.setCurrentLineItemValue("salesteam","employee",nlapiGetUser());
        quote.setCurrentLineItemValue("salesteam","salesrole","-2"); //Sales Role = Sales Rep
        quote.setCurrentLineItemValue("salesteam","isprimary","T");
        quote.commitLineItem("salesteam");
        }
         */

    console.log("Set sales rep/sales team");

    //Build text area for attorney and personal rep
    var attorneyStr = "";
    attorneyStr += nlapiGetFieldValue("custpage_attorney_name") + "\n";
    attorneyStr += nlapiGetFieldValue("custpage_firm_name") + "\n";
    attorneyStr += nlapiGetFieldValue("custpage_attorney_address") + "\n";
    attorneyStr += nlapiGetFieldValue("custpage_attorney_city") + " " + nlapiGetFieldText("custpage_attorney_state") + " " + nlapiGetFieldValue("custpage_attorney_zip");

    quote.setFieldValue("custbody_attorney_name_address", attorneyStr);

    var personalRepStr = "";
    personalRepStr += nlapiGetFieldValue("custpage_personal_rep_1") + "\n";
    personalRepStr += nlapiGetFieldValue("custpage_personal_rep_1_address") + "\n";
    personalRepStr += nlapiGetFieldValue("custpage_personal_rep_1_city") + " " + nlapiGetFieldText("custpage_personal_rep_1_state") + " " + nlapiGetFieldValue("custpage_personal_rep_1_zip");

    quote.setFieldValue("custbody_personal_rep_name_address", personalRepStr);

    var quoteId = nlapiSubmitRecord(quote, true, true);
    try {
      takeSnapshot({event: 'QUOTE', documenttype: 'quote', documentid: quoteId});
    } catch (e) {
      alert("error handled gracefully. Please notify IT with what you were doing, along with this message: " + e.message);
      console.log(JSON.stringify(e));
    }

    //Refresh quote sublist with new values
//        var url = '/app/site/hosting/scriptlet.nl?script=180&deploy=1&r=T&machine=custpage_prior_quotes&compid=5295340&customer=' + nlapiGetFieldValue("custpage_customer_id") + '&estate=' + nlapiGetFieldValue("custpage_estate");
//        document.getElementById('server_commands').src = url;
////        window.location.reload();
//    reloadpage();
//    saveall();
    savebuttonclick();
  } catch (err) {
    console.log("Error Generating Quote: " + err.message);
    alert("Error creating quote - " + err.message);
  }
}

function sendQuoteDocuSign(quote) {
  try {
    var url = nlapiResolveURL("SUITELET", "customscript_gen_docusign_estimate", "customdeploy_gen_docusign_estimate");
    url += "&quote=" + quote;

    window.open(url, 'docusignWin', 'dependent=yes,width=200,height=200');
  } catch (err) {
    console.log("Error Sending Quote via DocuSign: " + err.message);
    alert("Error Sending Quote via DocuSign: " + err.message);
  }
}

function mailMerge(quote) {
  try {
    var url = nlapiResolveURL("SUITELET", "customscript_mail_merge_csv", "customdeploy_mail_merge_csv");
    url += "&quote=" + quote;

    window.open(url, 'mailMergeWin', 'dependent=yes,width=200,height=200');
  } catch (err) {
    console.log("Error Constructing Mail Merge CSV: " + err.message);
    alert("Error Constructing Mail Merge CSV: " + err.message);
  }
}

function createInvoice(quote) {
  try {
    var invoice = nlapiTransformRecord("estimate", quote, "invoice", {
      recordmode: "dynamic"
    });
    //invoice.setFieldValue("entity",nlapiGetFieldValue("custpage_estate"));
    //console.log("Updated customer to estate");


    //Populate dates
    var today = new Date();

    var option1Months = invoice.getFieldValue("custbody_rebate_1_month");
    console.log("Rebate Month 1: " + option1Months);

    if (option1Months != null && option1Months != "") {
      option1Months = convertDropdownMonths(option1Months);
      nlapiSetFieldValue("custbody_date_of_option_1_pricing", nlapiDateToString(nlapiAddMonths(today, option1Months), "date"));
    }

    var option2Months = invoice.getFieldValue("custbody_rebate_2_month");
    console.log("Rebate Month 2: " + option2Months);

    if (option2Months != null && option2Months != "") {
      option2Months = convertDropdownMonths(option2Months);
      nlapiSetFieldValue("custbody_date_of_option_2_pricing", nlapiDateToString(nlapiAddMonths(today, option2Months), "date"));
    }

    var option3Months = invoice.getFieldValue("custbody_rebate_3_month");
    console.log("Rebate Month 3: " + option3Months);

    if (option3Months != null && option3Months != "") {
      option3Months = convertDropdownMonths(option3Months);
      nlapiSetFieldValue("custbody_date_of_option_3_pricing", nlapiDateToString(nlapiAddMonths(today, option3Months), "date"));
    }

    console.log("# Line Items: " + invoice.getLineItemCount("item"));

    //var estFields = nlapiLookupField("estimate",quote,["custbody_heir_first_name","custbody_heir_last_name","",""]);

    var totalduefromestate = nlapiGetFieldValue('custpage_total_due');
    invoice.setFieldValue('custbody_totaldueatcreation', totalduefromestate);
    try {
      var estateId = nlapiGetFieldValue("custpage_estate");
      invoice.setFieldValue('custbody_invoice_estate', estateId);
    } catch (e) {
      console.log(JSON.stringify(e));
    }

    var invoiceId = nlapiSubmitRecord(invoice, true, true);
    console.log('invoiceId', invoiceId);
//        var invoicenumber=nlapiSubmitField('invoice', invoiceId, totalduefromestate);
//        console.log('updated invoice '+invoicenumber);
    try {
      takeSnapshot({event: 'INVOICE', documenttype: 'invoice', documentid: invoiceId});
    } catch (e) {
      alert("error handled gracefully. Please notify IT with what you were doing, along with this message: " + e.message);
      console.log(JSON.stringify(e));
    }

    //Refresh invoice sublist with new values
//        var url = '/app/site/hosting/scriptlet.nl?script=180&deploy=1&r=T&machine=custpage_invoice_list&compid=5295340&customer=' + nlapiGetFieldValue("custpage_customer_id") + '&estate=' + nlapiGetFieldValue("custpage_estate");
//        document.getElementById('server_commands').src = url;
////        window.location.reload();
    reloadpage();
  } catch (err) {
    console.log("Error Generating Invoice: " + err.message);
    alert("Error creating invoice - " + err.message);
  }

}

function addUpdateContact(type, fldChanged) {
  if (type == "attorney") {
    console.log("Type: " + type + " | Field: " + fldChanged);

    var attorneyId = nlapiGetFieldValue("custpage_attorney_id");

    var found = false;
    var estate = nlapiGetFieldValue('custpage_estate');

    var filters = [];
    filters.push(new nlobjSearchFilter('internalid', 'company', 'anyof', estate));
    filters.push(new nlobjSearchFilter('role', null, 'anyof', '1'));
    var columns = [];
    columns.push(new nlobjSearchColumn('entityid'));
    columns.push(new nlobjSearchColumn('altname', 'company'));
    var rs = nlapiSearchRecord("contact", null, filters, columns);
    if (rs && rs.length > 0) {
      rs.forEach(function (contact) {
        console.log(contact.id);
        if (contact.id != attorneyId) {
          nlapiDetachRecord('contact', contact.id, 'customer', estate);
        } else {
          found = true;
        }
      });
    } else {
      console.log('no results found');
    }
    if (attorneyId != null && attorneyId != '' && !found) {
      nlapiAttachRecord('contact', attorneyId, 'customer', estate, {role: 1});
    }
    if (attorneyId != null && attorneyId != "") {
      var atty = nlapiLoadRecord('contact', attorneyId);
      nlapiSetFieldValue("custpage_attorney_name", atty.getFieldValue("entityid"));
      nlapiSetFieldValue("custpage_firm_name", atty.getFieldValue("custentity_law_firm"));
      nlapiSetFieldValue("custpage_attorney_address", atty.getFieldValue("billaddr1"));
      nlapiSetFieldValue("custpage_attorney_city", atty.getFieldValue("billcity"));
      nlapiSetFieldValue("custpage_attorney_state", mapStateAbbrev(atty.getFieldValue("billstate")));
      nlapiSetFieldValue("custpage_attorney_zip", atty.getFieldValue("billzip"));
      nlapiSetFieldValue("custpage_attorney_phone", atty.getFieldValue("phone"));
      nlapiSetFieldValue("custpage_attorney_email", atty.getFieldValue("email"));
    } else {
      nlapiSetFieldValue("custpage_attorney_name", '');
      nlapiSetFieldValue("custpage_firm_name", '');
      nlapiSetFieldValue("custpage_attorney_address", '');
      nlapiSetFieldValue("custpage_attorney_city", '');
      nlapiSetFieldValue("custpage_attorney_state", '');
      nlapiSetFieldValue("custpage_attorney_zip", '');
      nlapiSetFieldValue("custpage_attorney_phone", '');
      nlapiSetFieldValue("custpage_attorney_email", '');
    }
    reloadpage();

  } else if (type == "personal") {
    console.log("Type: " + type + " | Field: " + fldChanged);

    var personalrepId = nlapiGetFieldValue("custpage_personal_rep_1_id");

    var found = false;
    var estate = nlapiGetFieldValue('custpage_estate');

    var filters = [];
    filters.push(new nlobjSearchFilter('internalid', 'company', 'anyof', estate));
    filters.push(new nlobjSearchFilter('role', null, 'anyof', '-10'));
    var columns = [];
    columns.push(new nlobjSearchColumn('entityid'));
    columns.push(new nlobjSearchColumn('altname', 'company'));
    var rs = nlapiSearchRecord("contact", null, filters, columns);
    if (rs && rs.length > 0) {
      rs.forEach(function (contact) {
        console.log(contact.id);
        if (contact.id != personalrepId) {
          nlapiDetachRecord('contact', contact.id, 'customer', estate);
        } else {
          found = true;
        }
      });
    } else {
      console.log('no results found');
    }
    if (personalrepId != null && personalrepId != '' && !found) {
      var contact=nlapiLoadRecord('contact', personalrepId);
      nlapiSubmitRecord(contact);
      nlapiAttachRecord('contact', personalrepId, 'customer', estate, {role: "-10"});
    }
    if (personalrepId != null && personalrepId != "") {
      var prep = nlapiLoadRecord('contact', personalrepId);
      nlapiSetFieldValue("custpage_personal_rep_1", prep.getFieldValue("entityid"));
      nlapiSetFieldValue("custpage_personal_rep_1_address", prep.getFieldValue("billaddr1"));
      nlapiSetFieldValue("custpage_personal_rep_1_city", prep.getFieldValue("billcity"));
      nlapiSetFieldValue("custpage_personal_rep_1_state", mapStateAbbrev(prep.getFieldValue("billstate")));
      nlapiSetFieldValue("custpage_personal_rep_1_zip", prep.getFieldValue("billzip"));
      nlapiSetFieldValue("custpage_personal_rep_1_phone", prep.getFieldValue("phone"));
      nlapiSetFieldValue("custpage_personal_rep_1_email", prep.getFieldValue("email"));
    } else {
      nlapiSetFieldValue("custpage_personal_rep_1", '');
      nlapiSetFieldValue("custpage_personal_rep_1_address", '');
      nlapiSetFieldValue("custpage_personal_rep_1_city", '');
      nlapiSetFieldValue("custpage_personal_rep_1_state", '');
      nlapiSetFieldValue("custpage_personal_rep_1_zip", '');
      nlapiSetFieldValue("custpage_personal_rep_1_phone", '');
      nlapiSetFieldValue("custpage_personal_rep_1_email", '');
    }
    reloadpage();

  }
  //Refresh relationships/contact sublist with new values
//    var url = '/app/site/hosting/scriptlet.nl?script=180&deploy=1&r=T&machine=custpage_contacts&compid=5295340&customer=' + nlapiGetFieldValue("custpage_customer_id") + '&estate=' + nlapiGetFieldValue("custpage_estate");
//    document.getElementById('server_commands').src = url;
////    window.location.reload();
//    reloadpage();
}

function FV(rate, nper, pmt, pv, type) {
  var pow = Math.pow(1 + rate, nper),
      fv;

  if (rate) {
    fv = (pmt * (1 + rate * type) * (1 - pow) / rate) - pv * pow;
  } else {
    fv = -1 * (pv + pmt * nper);
  }

  return fv.toFixed(2);
}

function monthDiff(d1, d2) {
  var months;
  months = (d2.getFullYear() - d1.getFullYear()) * 12;
  months -= d1.getMonth() + 1;
  months += d2.getMonth();
  return months <= 0 ? 0 : months;
}

function mapStateAbbrev(stateAbbrev) {
  var classId = "";

  switch (stateAbbrev) {
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

function mapState(fullName) {
  var country = "";
  var stateAbbrev = "";

  switch (fullName) {
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

function updateCaseStatus() {
  var caseStatus = nlapiGetFieldValue("custpage_update_case_status");
  var caseStatusNotes = nlapiGetFieldValue("custpage_update_case_status_notes");

  if (caseStatus == null || caseStatus == "") {
    alert("Please select a Case Status before updating.");
    return true;
  }

  var statusRec = nlapiCreateRecord("customrecord_case_status");
  statusRec.setFieldValue("custrecord_case_status_status", caseStatus);
  statusRec.setFieldValue("custrecord_case_status_notes", caseStatusNotes);
  statusRec.setFieldValue("custrecord_case_status_customer", nlapiGetFieldValue("custpage_customer_id"));
  var statusRecId = nlapiSubmitRecord(statusRec, true, true);
  takeSnapshot({event: 'CASESTATUS', documenttype: 'casestatus', documentid: statusRecId});

  nlapiSetFieldValue("custpage_latest_status", caseStatus, false, true);
  nlapiSetFieldValue("custpage_latest_status_notes", caseStatusNotes, false, true);

  nlapiSetFieldValue("custpage_update_case_status", "", false, true);
  nlapiSetFieldValue("custpage_update_case_status_notes", "", false, true);

//    var url = '/app/site/hosting/scriptlet.nl?script=180&deploy=1&r=T&machine=custpage_case_status_list&compid=5295340&customer=' + nlapiGetFieldValue("custpage_customer_id") + '&estate=' + nlapiGetFieldValue("custpage_estate");
//    document.getElementById('server_commands').src = url;
////    window.location.reload();
//    reloadpage();
}

function convertMonths(suiteletValue) {
  var netsuiteId = "";

  switch (suiteletValue) {
    case "3":
      netsuiteId = "1";
      break;
    case "6":
      netsuiteId = "2";
      break;
    case "9":
      netsuiteId = "3";
      break;
    case "12":
      netsuiteId = "4";
      break;
    case "18":
      netsuiteId = "5";
      break;
    case "24":
      netsuiteId = "6";
      break;
  }

  return netsuiteId;
}

function convertDropdownMonths(fieldValue) {
  var numMonths = null;

  switch (fieldValue) {
    case "1":
      numMonths = 3;
      break;
    case "2":
      numMonths = 6;
      break;
    case "3":
      numMonths = 9;
      break;
    case "4":
      numMonths = 12;
      break;
    case "5":
      numMonths = 18;
      break;
    case "6":
      numMonths = 24;
      break;
  }

  return numMonths;
}

function searchTransactions(customerid) {

  var transactionSearch = nlapiSearchRecord("transaction", null,
      [
        ["type", "anyof", "CustPymt", "CashRfnd", "CashSale", "CustCred", "CustDep", "CustRfnd", "CustInvc", "SalesOrd", "Estimate"],
        "AND",
        ["name", "anyof", customerid]
      ],
      [
        new nlobjSearchColumn("internalid"),
      ]);

  return transactionSearch && transactionSearch.length > 0;

}

function searchChildRecords(estateId, childCustId) {
  if (estateId) {

    var filters = [];
    filters.push(new nlobjSearchFilter("parent", null, "anyof", estateId));

    var cols = [];
    cols.push(new nlobjSearchColumn("internalid"));

    var results = nlapiSearchRecord("customer", null, filters, cols);
    if (results) {
      var ids = [];
      for (var x = 0; x < results.length; x++) {
        var customerid = results[x].getId();
        if (childCustId) {
          if (childCustId != customerid) {
            ids.push(customerid);
          }
        } else {
          ids.push(customerid);
        }

      }
      nlapiLogExecution('DEBUG', 'Child Records', 'Child ids--' + JSON.stringify(ids));
      return ids;
    } else {
      return [];
    }
  } else {
    return [];
  }
}

function DeleteCustomer() {
  try {

    // alert("In Customer Delete");

    var customerid = nlapiGetFieldValue("custpage_customer_id");
    if (customerid) {
      //check if the customer has a parent ...
      var customerObj = nlapiLoadRecord("customer", customerid);
      var estateId = customerObj.getFieldValue("parent");
      //alert("customerObj--"+customerObj);
      // alert("estateId--"+estateId);


      var estateObj = nlapiLoadRecord("customer", estateId);
      var isEstateInactive = estateObj.getFieldValue("isinactive");

      if (isEstateInactive == 'T') {

        var hasTransactions = searchTransactions(customerid);
        nlapiLogExecution("debug", "In delete Customer has transactions --" + hasTransactions);
        if (hasTransactions) {
          // Throw error as there is a related transactions....
          // Throw error as there is a related transactions....
          // alert(" Customer  can not be inactivated--");
          var url = nlapiResolveURL("SUITELET", "customscript_new_customer_application", "customdeploy_new_customer_application");
          url += "&exceptionflag=T&message=LinkedTransaction";
          window.onbeforeunload = null;
          window.location.href = url;

        } else {
          // alert("point 1 Customer is inactivated--");
          customerObj.setFieldValue("isinactive", 'T');
          customerObj.setFieldValue('custentity_date_inactivted', new Date());
          var estateRecSaved = nlapiSubmitRecord(customerObj, true, true);
          var url = nlapiResolveURL("SUITELET", "customscript_new_customer_application", "customdeploy_new_customer_application");
          url += "&exceptionflag=T&message=Deleted";
          window.onbeforeunload = null;
          window.location.href = url;
        }
      } else {
        //chec if the customer has any other child customers...
        var customerlist = searchChildRecords(estateId);
        customerlist.push(estateId);
        if (customerlist && customerlist.length > 0) {

          var hasTransactions = searchTransactions(customerlist);
          nlapiLogExecution("debug", "In delete Customer has transactions --" + hasTransactions);
          if (hasTransactions) {
            // Throw error as there is a related transactions....
            // alert(" Customer has transactions canbe to be deleted --");
            // Throw error as there is a related transactions....
            var url = nlapiResolveURL("SUITELET", "customscript_new_customer_application", "customdeploy_new_customer_application");
            url += "&exceptionflag=T&message=LinkedTransaction";
            window.onbeforeunload = null;
            window.location.href = url;

          } else {
            if (customerlist && customerlist.length > 0) {
              for (var itr = 0; itr < customerlist.length; itr++) {
                // alert('Child Getsing Deleted'+customerlist[itr]);
                var loadCustomer = nlapiLoadRecord('customer', customerlist[itr]);
                loadCustomer.setFieldValue('isinactive', 'T');
                loadCustomer.setFieldValue('custentity_date_inactivted', new Date());
                var customeridsub = nlapiSubmitRecord(loadCustomer);
                nlapiLogExecution("debug", "Custimer Inactivated --" + customeridsub);
              }
            }
            // alert(" custRecSaved --"+custRecSaved);
            // Throw error as there is a related transactions....
            var url = nlapiResolveURL("SUITELET", "customscript_new_customer_application", "customdeploy_new_customer_application");
            url += "&succesflag=T&message=Deleted";
            window.onbeforeunload = null;
            window.location.href = url;

          }
        } else {

          var list = [customerid, estateId];
          var hasTransactions = searchTransactions(list);
          nlapiLogExecution("debug", "In delete Customer has transactions --" + hasTransactions);
          //alert("hasTransactionsn--"+hasTransactions);
          if (hasTransactions) {

            // alert("customer has linked transacion--");
            // Throw error as there is a related transactions....
            var url = nlapiResolveURL("SUITELET", "customscript_new_customer_application", "customdeploy_new_customer_application");
            url += "&exceptionflag=T&message=LinkedTransaction";
            window.onbeforeunload = null;
            window.location.href = url;

          } else {
            customerObj.setFieldValue("isinactive", 'T');
            customerObj.setFieldValue('custentity_date_inactivted', new Date());
            estateObj.setFieldValue("isinactive", 'T');
            estateObj.setFieldValue('custentity_date_inactivted', new Date());

            var estateRecSaved = nlapiSubmitRecord(estateObj, true, true);
            var customerRecordsaved = nlapiSubmitRecord(customerObj, true, true);

            // alert("estateRecSaved--"+estateRecSaved);
            // alert("customerRecordsaved--"+customerRecordsaved);


            // Throw error as there is a related transactions....
            var url = nlapiResolveURL("SUITELET", "customscript_new_customer_application", "customdeploy_new_customer_application");
            url += "&succesflag=T&message=Deleted";
            window.onbeforeunload = null;
            window.location.href = url;

          }
        }
      }
    }
  } catch (e) {

    // alert("Exceptio in Customer--"+e.message);

    var url = nlapiResolveURL("SUITELET", "customscript_new_customer_application", "customdeploy_new_customer_application");
    url += "&exceptionflag=T&message=" + e.message;
    window.onbeforeunload = null;
    window.location.href = url;
  }
}

function Customerreminder() {
  var url = nlapiResolveURL("SUITELET", "customscript_sl_customer_reminders", "customdeploy_sl_customer_reminders");
  url += "&customer=" + nlapiGetFieldValue("custpage_customer_id");
  url += "&phone=" + nlapiGetFieldValue("custpage_phone");
  url += "&emailId=" + nlapiGetFieldValue("custpage_email");

  window.open(url, 'docUploadWin', 'dependent=yes,width=1500%,height=1500%');
  //'dependent=yes,width=500,height=300'
}

function Conversations() {
  var userid=nlapiGetUser();
  var url = nlapiResolveURL("SUITELET", "customscript_mmsdf_sl_conversations_ui", "customdeploy_mmsdf_sl_conversations_ui");
  url += "&recordId=" + nlapiGetFieldValue("custpage_customer_id") + "&recordType=customer&smsSender=1162&view=conversations"; //1090342";
  window.open(url, 'docUploadWin', 'dependent=yes,width=1500%,height=1500%');
  //'dependent=yes,width=500,height=300'
}

function DeleteEstate() {
  try {

    var estateid = nlapiGetFieldValue("custpage_estate");
    if (estateid) {

      //chec if the customer has any other child customers...
      var customerlist = searchChildRecords(estateid);
      customerlist.push(estateid);
      if (customerlist && customerlist.length > 0) {

        var hasTransactions = searchTransactions(customerlist);
        nlapiLogExecution("debug", "In delete Customer has transactions --" + hasTransactions);
        if (hasTransactions) {

          // Throw error as there is a related transactions....
          var url = nlapiResolveURL("SUITELET", "customscript_new_customer_application", "customdeploy_new_customer_application");
          url += "&exceptionflag=T&message=LinkedTransaction";
          window.onbeforeunload = null;
          window.location.href = url;

        } else {
          // Throw error as there is a related transactions....
          if (customerlist && customerlist.length > 0) {
            for (var itr = 0; itr < customerlist.length; itr++) {
              // alert('Child Getsing Deleted'+customerlist[itr]);
              var loadCustomer = nlapiLoadRecord('customer', customerlist[itr]);
              loadCustomer.setFieldValue('isinactive', 'T');
              loadCustomer.setFieldValue('custentity_date_inactivted', new Date());
              var customeridsub = nlapiSubmitRecord(loadCustomer);
              nlapiLogExecution("debug", "Custimer Inactivated --" + customeridsub);
            }
          }

          // Throw error as there is a related transactions....
          var url = nlapiResolveURL("SUITELET", "customscript_new_customer_application", "customdeploy_new_customer_application");
          url += "&succesflag=T&message=Deleted";
          window.onbeforeunload = null;
          window.location.href = url;

        }
      }
    }
  } catch (e) {
    var url = nlapiResolveURL("SUITELET", "customscript_new_customer_application", "customdeploy_new_customer_application");
    url += "&exceptionflag=T&message=" + e.message;
    window.onbeforeunload = null;
    window.location.href = url;
  }
}

function redirecttoSuitelet() {

  var url = nlapiResolveURL("SUITELET", "customscript_new_customer_application", "customdeploy_new_customer_application");
  url += "&customer=" + nlapiGetFieldValue("custpage_customer_id");
  url += "&estate=" + nlapiGetFieldValue("custpage_estate");

  window.onbeforeunload = null;
  window.location.href = url;

}

function New_Cust_App_CS_VD(type) {
  try {
    var sublistId = type;

    var recordInternalId = null;
    var recordType = null;

    switch (sublistId) {
      case "custpage_properties":
        recordInternalId = "custpage_property_id";
        recordType = "customrecord_property";
        break;
      case "custpage_accounts":
        recordInternalId = "custpage_accounts_id";
        recordType = "customrecord_asset";
        break;
      case "custpage_claims":
        recordInternalId = "custpage_claim_id";
        recordType = "customrecord_claim";
        break;
      case "custpage_other_assignments":
        recordInternalId = "custpage_assignment_id";
        recordType = "customrecord_existing_assignment";
        break;
      case "custpage_leins_judgements_list":
        recordInternalId = "custpage_lein_id";
        recordType = "customrecord_lein_judgement";
        break;
      case "custpage_phonecalls":
        recordInternalId = "custpage_phonecalls_id";
        recordType = "phonecall";
        break;
      case "custpage_events":
        recordInternalId = "custpage_events_id";
        recordType = "calendarevent";
        break;
      case "custpage_user_notes":
        recordInternalId = "custpage_user_notes_internalid";
        recordType = "note";
        break;
//      case "custpage_case_status_list":
//        recordInternalId = "custpage_case_status_id";
//        recordType = "customrecord_case_status";
    }

    if (recordType != null && recordInternalId != null)
      nlapiDeleteRecord(recordType, nlapiGetCurrentLineItemValue(type, recordInternalId));

    return true;
  } catch (err) {
    console.log("Error in Validate Delete Function (sublistid: " + type + ") - " + err.message);
    return true;
  }
}

//function onAutoSoIfBtnClick(custId) {
//  var soUrl = nlapiResolveURL("SUITELET", "customscript_auto_so_and_fulfillment", "customdeploy_auto_so_and_fulfillment") + '&custpage_customer=' + custId;
//
//  window.location.href = soUrl;
//}

function setnextevent() {
  //    if(user=nlapiGetContext().getUser()==2299863) {
  var lc = nlapiGetLineItemCount('custpage_events');
  next = -1;
  todaydate = new Date();
  for (i = 1; i <= lc; i++) {
    d = new Date(nlapiGetLineItemValue('custpage_events', 'custpage_events_date', i))
    if (d >= todaydate) {
      if (next == -1) {
        next = i;
      } else {
        if (d <= new Date(nlapiGetLineItemValue('custpage_events', 'custpage_events_date', next))) {
          next = i;
        }
      }
    }
  }
  var nextEventDate = nlapiGetLineItemValue("custpage_events", "custpage_events_date", next);
  var nextEventTitle = nlapiGetLineItemValue("custpage_events", "custpage_events_title", next);
  var nextEventStr;
  if (next == -1) { //nextEventDate==null || nextEventTitle==null) {
    nextEventStr = 'No upcoming events';
  } else {
    nextEventStr = nextEventDate + " " + nextEventTitle;
  }
  //    alert(next + ' ' + nextEventStr);
  nlapiSetFieldValue("custpage_estate_next_event", nextEventStr, true, true);
  //  }
  return true;
}

function takeSnapshot(options) { //takeSnapshot({event:'INVOICE', documenttype:'invoice', documentid:invoiceId});
  console.log('begin snapshot...');
  if (!!options && !!options.event)
    var snapshotevent = options.event;
  else
    var snapshotevent = 'TEST';
  var ssrec = nlapiCreateRecord('customrecord_custdata');
  console.log('setting snapshot date');
  var d = new Date();
  var snapshotdate = (d.getMonth() + 1).toString().padStart(2, '0') + '/' + d.getDate().toString().padStart(2, '0') + '/' + d.getFullYear();
  ssrec.setFieldValue('custrecord_custdata_snapshotdate', snapshotdate);
  console.log('setting event type');
  ssrec.setFieldValue('custrecord_custdata_eventtype', snapshotevent);

  console.log('processing normal fields...');
  ssrec.setFieldValue('custrecord_custdata_cust', nlapiGetFieldValue('custpage_customer_id'));
  ssrec.setFieldValue('custrecord_custdata_cust_firstname', nlapiGetFieldValue('custpage_first_name'));
  ssrec.setFieldValue('custrecord_custdata_cust_lastname', nlapiGetFieldValue('custpage_last_name'));
  ssrec.setFieldValue('custrecord_custdata_cust_middlename', nlapiGetFieldValue('custpage_middle_initial'));
  ssrec.setFieldValue('custrecord_custdata_cust_addr', nlapiGetFieldValue('custpage_address'));
  ssrec.setFieldValue('custrecord_custdata_cust_city', nlapiGetFieldValue('custpage_city'));
  ssrec.setFieldValue('custrecord_custdata_cust_state', nlapiGetFieldText('custpage_state'));
  ssrec.setFieldValue('custrecord_custdata_cust_statewarning', nlapiGetFieldValue('custpage_state_warn'));
  ssrec.setFieldValue('custrecord_custdata_cust_zipcode', nlapiGetFieldValue('custpage_zip'));
  ssrec.setFieldValue('custrecord_custdata_cust_salesrep', nlapiGetFieldValue('custpage_sales_rep'));
  ssrec.setFieldValue('custrecord_custdata_cust_phone', nlapiGetFieldValue('custpage_phone'));
  ssrec.setFieldValue('custrecord_custdata_cust_email', nlapiGetFieldValue('custpage_email'));
  ssrec.setFieldValue('custrecord_custdata_cust_leadsource', nlapiGetFieldText('custpage_how_did_they_find_us'));
  ssrec.setFieldValue('custrecord_custdata_cust_laststatus', nlapiGetFieldText('custpage_latest_status'));
  ssrec.setFieldValue('custrecord_custdata_cust_contactnotes', nlapiGetFieldValue('custpage_notes'));
  ssrec.setFieldValue('custrecord_custdata_cust_followuptype', nlapiGetFieldValue('custpage_followup_type'));
  ssrec.setFieldValue('custrecord_custdata_cust_laststatusnotes', nlapiGetFieldValue('custpage_latest_status_notes'));
  ssrec.setFieldValue('custrecord_custdata_est_decedentexisting', nlapiGetFieldValue('custpage_estate'));
  ssrec.setFieldValue('custrecord_custdata_est_decedentnew', nlapiGetFieldValue('custpage_decedent'));
  ssrec.setFieldValue('custrecord_custdata_est_casefileno', nlapiGetFieldValue('custpage_case_no'));
  ssrec.setFieldValue('custrecord_custdata_est_state', nlapiGetFieldText('custpage_estate_state'));
  ssrec.setFieldValue('custrecord_custdata_est_statewarning', nlapiGetFieldValue('custpage_estate_state_warn'));
  ssrec.setFieldValue('custrecord_custdata_est_county', nlapiGetFieldText('custpage_estate_county'));
  ssrec.setFieldValue('custrecord_custdata_est_estdistdate', nlapiGetFieldValue('custpage_estate_est_date_distr'));
  ssrec.setFieldValue('custrecord_custdata_est_filingdate', nlapiGetFieldValue('custpage_estate_filing_date'));
  ssrec.setFieldValue('custrecord_custdata_est_nextevent', nlapiGetFieldValue('custpage_estate_next_event'));
  ssrec.setFieldValue('custrecord_custdata_est_lastcalldate', nlapiGetFieldValue('custpage_estate_next_phonecall'));
  ssrec.setFieldValue('custrecord_custdata_est_estatestatus', nlapiGetFieldText('custpage_est_status'));
  ssrec.setFieldValue('custrecord_custdata_est_estatetype', nlapiGetFieldValue('custpage_estatetype'));
  ssrec.setFieldValue('custrecord_custdata_est_acctsecurity', nlapiGetFieldValue('custpage_acctsecurity'));
  ssrec.setFieldValue('custrecord_custdata_est_multiple', nlapiGetFieldValue('custpage_multipleestatestrusts'));
  ssrec.setFieldValue('custrecord_custdata_est_supervisionlevel', nlapiGetFieldValue('custpage_supervisionlevel'));
  ssrec.setFieldValue('custrecord_custdata_est_claimsperiodend', nlapiGetFieldValue('custpage_claimsperiodend'));
  ssrec.setFieldValue('custrecord_custdata_est_attyname', nlapiGetFieldValue('custpage_attorney_name'));
  ssrec.setFieldValue('custrecord_custdata_est_firmname', nlapiGetFieldValue('custpage_firm_name'));
  ssrec.setFieldValue('custrecord_custdata_est_firmaddr', nlapiGetFieldValue('custpage_attorney_address'));
  ssrec.setFieldValue('custrecord_custdata_est_firmcity', nlapiGetFieldValue('custpage_attorney_city'));
  ssrec.setFieldValue('custrecord_custdata_est_firmstate', nlapiGetFieldText('custpage_attorney_state'));
  ssrec.setFieldValue('custrecord_custdata_est_firmzipcode', nlapiGetFieldValue('custpage_attorney_zip'));
  ssrec.setFieldValue('custrecord_custdata_est_firmphone', nlapiGetFieldValue('custpage_attorney_phone'));
  ssrec.setFieldValue('custrecord_custdata_est_firmemail', nlapiGetFieldValue('custpage_attorney_email'));
  ssrec.setFieldValue('custrecord_custdata_est_attycontactid', nlapiGetFieldValue('custpage_attorney_id'));
  ssrec.setFieldValue('custrecord_custdata_est_attyscore', nlapiGetFieldValue('custpage_attorney_rating'));
  ssrec.setFieldValue('custrecord_custdata_est_attynotes', nlapiGetFieldValue('custpage_attorney_notes'));
  ssrec.setFieldValue('custrecord_custdata_est_pr', nlapiGetFieldValue('custpage_personal_rep_1'));
  ssrec.setFieldValue('custrecord_custdata_est_praddr', nlapiGetFieldValue('custpage_personal_rep_1_address'));
  ssrec.setFieldValue('custrecord_custdata_est_prcity', nlapiGetFieldValue('custpage_personal_rep_1_city'));
  ssrec.setFieldValue('custrecord_custdata_est_prstate', nlapiGetFieldText('custpage_personal_rep_1_state'));
  ssrec.setFieldValue('custrecord_custdata_est_przipcode', nlapiGetFieldValue('custpage_personal_rep_1_zip'));
  ssrec.setFieldValue('custrecord_custdata_est_prphone', nlapiGetFieldValue('custpage_personal_rep_1_phone'));
  ssrec.setFieldValue('custrecord_custdata_est_premail', nlapiGetFieldValue('custpage_personal_rep_1_email'));
  ssrec.setFieldValue('custrecord_custdata_est_prcontactid', nlapiGetFieldValue('custpage_personal_rep_1_id'));
  ssrec.setFieldValue('custrecord_custdata_est_prrelationship', nlapiGetFieldText('custpage_personal_rep_1_relationship'));
  ssrec.setFieldValue('custrecord_custdata_est_diligencerep', nlapiGetFieldValue('custpage_diligence_assignee'));
  ssrec.setFieldValue('custrecord_custdata_est_totalpropval', nlapiGetFieldValue('custpage_total_property'));
  ssrec.setFieldValue('custrecord_custdata_est_totalassets', nlapiGetFieldValue('custpage_total_assets'));
  ssrec.setFieldValue('custrecord_custdata_est_totalclaims', nlapiGetFieldValue('custpage_total_claims'));
  ssrec.setFieldValue('custrecord_custdata_est_heirbequests', nlapiGetFieldValue('custpage_specific_bequests'));
  ssrec.setFieldValue('custrecord_custdata_est_closingcosts', nlapiGetFieldValue('custpage_closing_costs'));
  ssrec.setFieldValue('custrecord_custdata_est_attyfees', nlapiGetFieldValue('custpage_attorney_fees'));
  ssrec.setFieldValue('custrecord_custdata_est_netequityvalue', nlapiGetFieldValue('custpage_net_equity_value_1'));
  ssrec.setFieldValue('custrecord_custdata_est_legalexpenses', nlapiGetFieldValue('custpage_net_legal_expenses'));
  ssrec.setFieldValue('custrecord_custdata_est_netassetsinfo', nlapiGetFieldValue('custpage_netassets'));
  ssrec.setFieldValue('custrecord_custdata_cust_netequity', nlapiGetFieldValue('custpage_net_equity_value'));
  ssrec.setFieldValue('custrecord_custdata_cust_pctestatedue', nlapiGetFieldValue('custpage_percent_equity_due'));
  ssrec.setFieldValue('custrecord_custdata_cust_heirship', nlapiGetFieldValue('custpage_heirship'));
  ssrec.setFieldValue('custrecord_custdata_cust_estresiduedue', nlapiGetFieldValue('custpage_residue_equity_due'));
  ssrec.setFieldValue('custrecord_custdata_cust_bequestdue', nlapiGetFieldValue('custpage_bequest_due'));
  ssrec.setFieldValue('custrecord_custdata_cust_totalduefromest', nlapiGetFieldValue('custpage_total_due'));
  ssrec.setFieldValue('custrecord_custdata_cust_liens', nlapiGetFieldValue('custpage_liens_judgments'));
  ssrec.setFieldValue('custrecord_custdata_cust_existingassgn', nlapiGetFieldValue('custpage_existing_agreements'));
  ssrec.setFieldValue('custrecord_custdata_cust_netduetocust', nlapiGetFieldValue('custpage_net_due'));
  ssrec.setFieldValue('custrecord_custdata_cust_tenpercentsens', nlapiGetFieldValue('custpage_sensitivity_to_10percent'));
  ssrec.setFieldValue('custrecord_custdata_cust_advtovalratio', nlapiGetFieldValue('custpage_adv_to_val_ratio'));
  ssrec.setFieldValue('custrecord_custdata_cust_maxadvancesize', nlapiGetFieldValue('custpage_max_advance'));
  ssrec.setFieldValue('custrecord_custdata_cust_expectedrebate', nlapiGetFieldValue('custpage_rebate'));
  ssrec.setFieldValue('custrecord_custdata_cust_holdback', nlapiGetFieldValue('custpage_holdback'));
  ssrec.setFieldValue('custrecord_custdata_cust_desiredadvsize', nlapiGetFieldValue('custpage_desired_advance'));
  ssrec.setFieldValue('custrecord_custdata_cust_pricinglevel', nlapiGetFieldValue('custpage_price_level'));
  ssrec.setFieldValue('custrecord_custdata_cust_estmonthsremain', nlapiGetFieldValue('custpage_months_remaining'));
  ssrec.setFieldValue('custrecord_custdata_cust_rebateoption1', nlapiGetFieldValue('custpage_early_rebate_1'));
  ssrec.setFieldValue('custrecord_custdata_cust_rebateoption2', nlapiGetFieldValue('custpage_early_rebate_2'));
  ssrec.setFieldValue('custrecord_custdata_cust_rebateoption3', nlapiGetFieldValue('custpage_early_rebate_3'));
  ssrec.setFieldValue('custrecord_custdata_cust_assignmentsize', nlapiGetFieldValue('custpage_assignment_size'));
  ssrec.setFieldValue('custrecord_custdata_cust_option1pricing', nlapiGetFieldValue('custpage_early_rebate_1_amt'));
  ssrec.setFieldValue('custrecord_custdata_cust_option2pricing', nlapiGetFieldValue('custpage_early_rebate_2_amt'));
  ssrec.setFieldValue('custrecord_custdata_cust_option3pricing', nlapiGetFieldValue('custpage_early_rebate_3_amt'));
  ssrec.setFieldValue('custrecord_custdata_cust_calculatedfee', nlapiGetFieldValue('custpage_calculated_fee'));
  ssrec.setFieldValue('custrecord_custdata_cust_rateofreturn', nlapiGetFieldValue('custpage_rate_of_return'));
  ssrec.setFieldValue('custrecord_custdata_jdict_county', nlapiGetFieldText('custpage_jurisdiction_county'));
  ssrec.setFieldValue('custrecord_custdata_jdict_pleadingtitle', nlapiGetFieldValue('custpage_jurisdiction_pleading_title'));
  ssrec.setFieldValue('custrecord_custdata_jdict_courtname', nlapiGetFieldValue('custpage_jurisdiction_court_name'));
  ssrec.setFieldValue('custrecord_custdata_jdict_courtaddress', nlapiGetFieldValue('custpage_jurisdiction_court_address'));
  ssrec.setFieldValue('custrecord_custdata_jdict_courtcity', nlapiGetFieldValue('custpage_jurisdiction_court_city'));
  ssrec.setFieldValue('custrecord_custdata_jdict_courtstate', nlapiGetFieldValue('custpage_jurisdiction_court_state'));
  ssrec.setFieldValue('custrecord_custdata_jdict_courtzipcode', nlapiGetFieldValue('custpage_jurisdiction_court_zip'));
  ssrec.setFieldValue('custrecord_custdata_jdict_courtphone', nlapiGetFieldValue('custpage_jurisdiction_court_phone'));
  ssrec.setFieldValue('custrecord_custdata_totalinvoices', nlapiGetFieldValue('custpage_invoices_total_assignments'));
  if (!!options.documenttype && (options.documenttype == 'invoice' || options.documenttype == 'quote')) {
    ssrec.setFieldValue('custrecord_custdata_transactionnum', options.documentid);
  }
  var quotecount = nlapiGetLineItemCount('custpage_prior_quotes');
  console.log('quotecount', quotecount);
  ssrec.setFieldValue('custrecord_custdata_quotecount', quotecount);

  console.log('processing checkboxes...');

  ssrec.setFieldValue('custrecord_custdata_cust_custinestate', nlapiGetFieldText('custpage_clientinestate'));
  ssrec.setFieldValue('custrecord_custdata_est_dot', nlapiGetFieldValue('custpage_diligence_dot'));
  ssrec.setFieldValue('custrecord_custdata_est_escrow', nlapiGetFieldValue('custpage_diligence_escrow'));
  ssrec.setFieldValue('custrecord_custdata_est_blockedacctlette', nlapiGetFieldValue('custpage_diligence_blocked_account_letter'));
  ssrec.setFieldValue('custrecord_custdata_est_problemcase', nlapiGetFieldValue('custpage_problem_case'));
  ssrec.setFieldValue('custrecord_custdata_est_prinestate', nlapiGetFieldValue('custpage_prinestate'));
  ssrec.setFieldValue('custrecord_custdata_est_clientinestate', nlapiGetFieldValue('custpage_clientinestate2'));
  ssrec.setFieldValue('custrecord_custdata_est_heirsinestate', nlapiGetFieldValue('custpage_heirinestate'));
  ssrec.setFieldValue('custrecord_custdata_est_3ptyinestate', nlapiGetFieldValue('custpage_thirdptyinestate'));

  console.log('processing sublists...');
  console.log('properties sublist...');
  var propertydata = '';
  if (nlapiGetLineItemCount('custpage_properties') > 0) {
    var csvdata = processSublist('custpage_properties');
    if (!!csvdata && csvdata != -1)
      ssrec.setFieldValue('custrecord_custdata_est_propertieslist', csvdata);
    else
      console.log('error processing properties sublist');
    propertydata = csvdata;
  }

  console.log('accounts sublist...');
  if (nlapiGetLineItemCount('custpage_accounts') > 0) {
    var csvdata = processSublist('custpage_accounts');
    if (!!csvdata && csvdata != -1)
      ssrec.setFieldValue('custrecord_custdata_est_assetslist', csvdata);
    else
      console.log('error processing accounts sublist');
  }

  console.log('claims sublist...');
  if (nlapiGetLineItemCount('custpage_claims') > 0) {
    var csvdata = processSublist('custpage_claims');
    if (!!csvdata && csvdata != -1)
      ssrec.setFieldValue('custrecord_custdata_est_claimslist', csvdata);
    else
      console.log('error processing claims sublist');
  }

  console.log('prior quotes sublist...');
  if (nlapiGetLineItemCount('custpage_prior_quotes') > 0) {
    var csvdata = processSublist('custpage_prior_quotes');
    if (!!csvdata && csvdata != -1)
      ssrec.setFieldValue('custrecord_custdata_cust_priorquoteslist', csvdata);
    else
      console.log('error processing claims sublist');
  }

  console.log('case status list sublist...');
  if (nlapiGetLineItemCount('custpage_case_status_list') > 0) {
    var csvdata = processSublist('custpage_case_status_list');
    if (!!csvdata && csvdata != -1)
      ssrec.setFieldValue('custrecord_custdata_cust_casestatuslist', csvdata);
    else
      console.log('error processing case status sublist');
  }

  console.log('past assignments sublist...');
  if (nlapiGetLineItemCount('custpage_other_assignments') > 0) {
    var csvdata = processSublist('custpage_other_assignments');
    if (!!csvdata && csvdata != -1)
      ssrec.setFieldValue('custrecord_custdata_cust_pastassignlist', csvdata);
    else
      console.log('error processing past assignments sublist');
  }

  console.log('liens sublist...');
  if (nlapiGetLineItemCount('custpage_leins_judgements_list') > 0) {
    var csvdata = processSublist('custpage_leins_judgements_list');
    if (!!csvdata && csvdata != -1)
      ssrec.setFieldValue('custrecord_custdata_cust_lienslist', csvdata);
    else
      console.log('error processing liens sublist');
  }

  console.log('case updates sublist...');
  if (nlapiGetLineItemCount('custpage_phonecalls') > 0) {
    var csvdata = processSublist('custpage_phonecalls');
    if (!!csvdata && csvdata != -1)
      ssrec.setFieldValue('custrecord_custdata_caseupdateslist', csvdata);
    else
      console.log('error processing case updates sublist');
  }

  console.log('messages sublist...');
  if (nlapiGetLineItemCount('custpage_messages') > 0) {
    var csvdata = processSublist('custpage_messages');
    if (!!csvdata && csvdata != -1)
      ssrec.setFieldValue('custrecord_custdata_messageslist', csvdata);
    else
      console.log('error processing messages sublist');
  }

  console.log('events sublist...');
  if (nlapiGetLineItemCount('custpage_events') > 0) {
    var csvdata = processSublist('custpage_events');
    if (!!csvdata && csvdata != -1)
      ssrec.setFieldValue('custrecord_custdata_eventslist', csvdata);
    else
      console.log('error processing events sublist');
  }

  console.log('user notes sublist...');
  if (nlapiGetLineItemCount('custpage_user_notes') > 0) {
    var csvdata = processSublist('custpage_user_notes');
    if (!!csvdata && csvdata != -1)
      ssrec.setFieldValue('custrecord_custdata_usernoteslist', csvdata);
    else
      console.log('error processing user notes sublist');
  }

  console.log('contacts sublist...');
  if (nlapiGetLineItemCount('custpage_contacts') > 0) {
    var csvdata = processSublist('custpage_contacts');
    if (!!csvdata && csvdata != -1)
      ssrec.setFieldValue('custrecord_custdata_contactslist', csvdata);
    else
      console.log('error processing contacts sublist');
  }

  console.log('invoices sublist...');
  if (nlapiGetLineItemCount('custpage_invoice_list') > 0) {
    var csvdata = processSublist('custpage_invoice_list');
    if (!!csvdata && csvdata != -1)
      ssrec.setFieldValue('custrecord_custdata_invoiceslist', csvdata);
    else
      console.log('error processing invoices sublist');
  }

  console.log('followups sublist...');
  if (nlapiGetLineItemCount('custpage_followup_list') > 0) {
    var csvdata = processSublist('custpage_followup_list');
    if (!!csvdata && csvdata != -1)
      ssrec.setFieldValue('custrecord_custdata_followuplist', csvdata);
    else
      console.log('error processing followups sublist');
  }

  console.log('done with sublists.');
  console.log('saving record...');
  var snapshotid = nlapiSubmitRecord(ssrec);
  console.log('done.');

  console.log('processing property subrecords...');
//  if(userid!='2299863') {
//    debugger;
//  }
  var propertyarray = propertydata.trim().split('\n');
  if (propertyarray.length > 1) {
    var headers=propertyarray[0].split('|');
    for (var i = 1; i < propertyarray.length; i++) {
      var line = propertyarray[i].replace(/\n/g, '');
      var psfields = line.split('|');
      var psrec = nlapiCreateRecord('customrecord_propertysnapshot');
      psrec.setFieldValue('custrecord_propertysnapshot_parent', snapshotid);
//      psrec.setFieldValue('name', psfields[0]);
      psrec.setFieldValue('name', psfields[headers.indexOf('Property')]);
//      psrec.setFieldValue('custrecord_propertysnapshot_value', psfields[2]);
      psrec.setFieldValue('custrecord_propertysnapshot_value', psfields[headers.indexOf('Value')]);
      var addrdata = nlapiLookupField(
          'customrecord_property',
//          psfields[16],
          psfields[headers.indexOf('Property ID')],
          [
            'custrecord_property_address',
            'custrecord_property_city',
            'custrecord_property_state',
            'custrecord_property_zipcode'
          ]
      );
      psrec.setFieldValue('custrecord_propertysnapshot_gcaddr', addrdata.custrecord_property_address);
      psrec.setFieldValue('custrecord_propertysnapshot_gccity', addrdata.custrecord_property_city);
      psrec.setFieldValue('custrecord_propertysnapshot_gcstate', addrdata.custrecord_property_state);
      psrec.setFieldValue('custrecord_propertysnapshot_gczip', addrdata.custrecord_property_zipcode);
//      psrec.setFieldValue('custrecord_propertysnapshot_mortgage', psfields[3]);
      psrec.setFieldValue('custrecord_propertysnapshot_mortgage', psfields[headers.indexOf('Mortgage')]);
//      psrec.setFieldValue('custrecord_propertysnapshot_pctowned', psfields[4]);
      psrec.setFieldValue('custrecord_propertysnapshot_pctowned', psfields[headers.indexOf('% Owned')]);
//      psrec.setFieldValue('custrecord_propertysnapshot_netvalue', psfields[5]);
      psrec.setFieldValue('custrecord_propertysnapshot_netvalue', psfields[headers.indexOf('Total (net value)')]);
//      psrec.setFieldValue('custrecord_propertysnapshot_dot', psfields[8]);
      psrec.setFieldValue('custrecord_propertysnapshot_dot', psfields[headers.indexOf('DOT')]);
//      psrec.setFieldValue('custrecord_propertysnapshot_dot_subdate', psfields[9]);
      psrec.setFieldValue('custrecord_propertysnapshot_dot_subdate', psfields[headers.indexOf('DOT Submission Date')]);
//      psrec.setFieldValue('custrecord_propertysnapshot_dot_recdate', psfields[10]);
      psrec.setFieldValue('custrecord_propertysnapshot_dot_recdate', psfields[headers.indexOf('DOT Recording Date')]);
      nlapiSubmitRecord(psrec);
    }
  }
  console.log('snapshot complete.');
}

function processSublist(list) {
  var csvdata = -1;
  var fields = getSublistFields(list);
//  console.log('fields', fields);
  var data = getSublistHeaders(list);
  if (!!data && data != -1)
    csvdata = data.join('|') + '\n';
  if (!!data && data != -1 && !!fields && fields != -1)
    csvdata += stringifySublist(list, fields);
  return csvdata;
}

function stringifySublist(list, fields) {
  try {
    var lc = nlapiGetLineItemCount(list);
    var csvdata = '';
    for (var i = 1; i <= lc; i++) {
      var line = '';
      for (var j = 0; j < fields.length; j++) {
        var field = fields[j];
        var val = nlapiGetLineItemValue(list, field, i);
        line += val;
        if (j + 1 < fields.length)
          line += '|';
      }
      csvdata += line;
      if (i < lc)
        csvdata += '\n';
    }
  } catch (e) {
    csvdata = -1;
  }
  return csvdata;
}

function getSublistFields(list) {
  var retval;
  switch (list) {
    case 'custpage_properties':
      retval = [
        'custpage_property_address',
        'custpage_property_eventtype',
        'custpage_property_value',
        'custpage_property_mortgage',
        'custpage_property_owned',
        'custpage_property_total',
        'custpage_property_sold',
        'custpage_property_escrow',
        'custpage_property_dot',
        'custpage_property_dot_subdate',
        'custpage_property_dot_recdate',
        'custpage_property_note',
        'custpage_property_estamount',
        'custpage_property_preforeclosure_status',
        'custpage_property_owner_name',
        'custpage_property_est_mortage_amt_attom',
        'custpage_property_id',
        'custpage_property_auction_date',
        'custpage_property_salesamount',
        'custpage_property_lastsalesdate',
        'custpage_property_property_type',
        'custpage_property_apn',
        'custpage_property_attomerror',
        'custpage_property_num'
      ];
      break;
    case 'custpage_accounts':
      retval = [
        'custpage_accounts_name',
        'custpage_accounts_date',
        'custpage_accounts_value',
        'custpage_accounts_id'
      ];
      break;
    case 'custpage_claims':
      retval = [
        'custpage_claims_name',
        'custpage_claims_date',
        'custpage_claims_value',
        'custpage_claim_id'
      ];
      break;
    case 'custpage_prior_quotes':
      retval = [
        'custpage_quote_link',
        'custpage_quote_tranid',
        'custpage_quote_salesrep',
        'custpage_quote_status',
        'custpage_quote_date',
        'custpage_quote_advance',
        'custpage_quote_assignment',
        'custpage_quote_option_1',
        'custpage_quote_option_2',
        'custpage_quote_option_3',
        'custpage_quote_rebate_1',
        'custpage_quote_rebate_2',
        'custpage_quote_rebate_3',
        'custpage_quote_time_1',
        'custpage_quote_time_2',
        'custpage_quote_time_3',
        'custpage_quote_internalid'
      ];
      break;
    case 'custpage_case_status_list':
      retval = [
        'custpage_case_status_id',
        'custpage_case_status_status',
        'custpage_case_status_notes',
        'custpage_case_status_timestamp',
        'custpage_case_status_user'
      ];
      break;
    case 'custpage_messages':
      retval = [
        'custpage_date',
        'custpage_author',
        'custpage_receipient',
        'custpage_body'
      ];
      break;
    case 'custpage_other_assignments':
      retval = [
        'custpage_other_company',
        'custpage_other_date',
        'custpage_other_assignment',
        'custpage_assignment_id',
        'custpage_other_priority'
      ];
      break;
    case 'custpage_leins_judgements_list':
      retval = [
        'custpage_lein_judgement_name',
        'custpage_lein_judgement_date',
        'custpage_lein_judgement_amount',
        'custpage_lein_id'
      ];
      break;
    case 'custpage_phonecalls':
      retval = [
        'custpage_phonecalls_title',
        'custpage_phonecalls_message',
        'custpage_phonecalls_phone_number',
        'custpage_phonecalls_owner',
        'custpage_phonecalls_date',
        'custpage_phonecalls_id'
      ];
      break;
    case 'custpage_events':
      retval = [
        'custpage_events_title',
        'custpage_events_date',
        'custpage_events_id'
      ];
      break;
    case 'custpage_user_notes':
      retval = [
        'custpage_user_notes_author',
        'custpage_user_notes_datetime',
        'custpage_user_notes_note',
        'custpage_user_notes_internalid'
      ];
      break;
    case 'custpage_contacts':
      retval = [
        'custpage_contacts_name',
        'custpage_contacts_job_title',
        'custpage_contacts_email',
        'custpage_contacts_phone',
        'custpage_contacts_law_firm',
        'custpage_contacts_role',
        'custpage_contacts_id'
      ];
      break;
    case 'custpage_invoice_list':
      retval = [
        'custpage_invoice_link',
        'custpage_invoice_tranid',
        'custpage_invoice_status',
        'custpage_invoice_po',
        'custpage_invoice_date',
        'custpage_invoice_advance',
        'custpage_invoice_amount',
        'custpage_invoice_rebate_1',
        'custpage_invoice_time_1',
        'custpage_invoice_rebate_2',
        'custpage_invoice_time_2',
        'custpage_invoice_rebate_3',
        'custpage_invoice_time_3',
        'custpage_invoice_assignment',
        'custpage_invoice_datefiled',
        'custpage_invoice_stamped_assignment',
        'custpage_invoice_internalid'
      ];
      break;
    case 'custpage_followup_list':
      retval = [
        'custpage_followup_id',
        'custpage_followup_title',
        'custpage_followup_customer',
        'custpage_followup_phone',
        'custpage_followup_date',
        'custpage_followup_note',
        'custpage_followup_completed',
        'custpage_followup_completed_date',
        'custpage_followup_assinged',
        'custpage_followup_completedby'
      ];
      break;
    default:
      retval = -1;
  }
  return retval;
}

function getSublistHeaders(list) {
  switch (list) {
    case 'custpage_properties':
      retval = [
        'Property',
        'Listing Status',
        'Value',
        'Mortgage',
        '% Owned',
        'Total (net value)',
        'Sold?',
        'Escrow',
        'DOT',
        'DOT Submission Date',
        'DOT Recording Date',
        'Note',
        'Estimated Value',
        'Preforeclosure Status',
        'Owner Name',
        'Est Mortgage',
        'Property ID',
        'Auction Date',
        'Last Sales Amt',
        'Last Sale Date',
        'Property Type',
        'APN',
        'Data Pull Error',
        'Property Record'
      ];
      break;
    case 'custpage_accounts':
      retval = [
        'Cash Account/Asset',
        'Date',
        'Value',
        'Account ID'
      ];
      break;
    case 'custpage_claims':
      retval = [
        'Claim Name',
        'Date',
        'Value',
        'Claim ID'
      ];
      break;
    case 'custpage_prior_quotes':
      retval = [
        'View Quote',
        'Quote #',
        'Sales Person',
        'Status',
        'Date',
        'Advance',
        'Assignment',
        'Option 1',
        'Option 2',
        'Option 3',
        'Rebate 1',
        'Rebate 2',
        'Rebate 3',
        'Time 1',
        'Time 2',
        'Time 3',
        'Quote ID'
      ];
      break;
    case 'custpage_case_status_list':
      retval = [
        'Case Status Internal ID',
        'Status',
        'Notes',
        'Date/Time Updated',
        'Updated By'
      ];
      break;
    case 'custpage_messages':
      retval = [
        'Date',
        'Author',
        'Primary Recipient',
        'Body'
      ];
      break;
    case 'custpage_other_assignments':
      retval = [
        'Advance Company',
        'Date',
        'Assignment',
        'Assignment ID',
        'Priority'
      ];
      break;
    case 'custpage_leins_judgements_list':
      retval = [
        'Lien/Judgment',
        'Date',
        'Amount',
        'Lien/Judgment ID'
      ];
      break;
    case 'custpage_phonecalls':
      retval = [
        'Subject',
        'Message',
        'Phone Number',
        'Organizer',
        'Date',
        'Activity ID'
      ];
      break;
    case 'custpage_events':
      retval = [
        'Title',
        'Date',
        'Event ID'
      ];
      break;
    case 'custpage_user_notes':
      retval = [
        'Title',
        'Date/Time',
        'Note',
        'Note Internal ID'
      ];
      break;
    case 'custpage_contacts':
      retval = [
        'Contact',
        'Job Title',
        'Email',
        'Main Phone',
        'Law Firm',
        'Role',
        'Contact ID'
      ];
      break;
    case 'custpage_invoice_list':
      retval = [
        'View Invoice',
        'Invoice Number',
        'Invoice Status',
        'PO/Check #',
        'Date',
        'Advance Amount',
        'Invoice Amount',
        'Option 1 Pricing',
        'Date Of Option 1 Pricing',
        'Option 2 Pricing',
        'Date Of Option 2 Pricing',
        'Option 3 Pricing',
        'Date Of Option 2 Pricing',
        'Total Assignment Size',
        'Date Filed',
        'Stamped Assignment',
        'Invoice ID'
      ];
      break;
    case 'custpage_followup_list':
      retval = [
        'ID',
        'Title',
        'Customer',
        'Phone',
        'Date',
        'Note',
        'Completed',
        'Completed Date',
        'Assigned',
        'Completed By'
      ];
      break;
    default:
      retval = [];
  }
  return retval;
}

function reloadpage() {
  var customerId = nlapiGetFieldValue("custpage_customer_id");
  var estateId = nlapiGetFieldValue("custpage_estate");
  window.ischanged=false;
  var tab = window.sCurrentlySelectedTab;
  if (customerId) {
    window.location.href = '/app/site/hosting/scriptlet.nl?script=180&deploy=1&customer=' + customerId + '&selectedtab=' + tab;
  } else if (estateId) {
    window.location.href = '/app/site/hosting/scriptlet.nl?script=180&deploy=1&estate=' + estateId + '&selectedtab=' + tab;
  }
  return true;
}

function savebuttonclick() {
  Promise.all([showwarning()]).then(function(values) {
    console.log(values);
    saveall();
  });
  return true;
}

function showwarning() {
  return new Promise(function(resolve, reject) {
    var savedialog=document.getElementById('save-alert-box');
    savedialog.style.display='block';
    setTimeout(function() {
      resolve('Displaying Save Dialog');
    }, Math.random() * 100);
  })
}

function saveall() {
  var d=new Date();
  var starttime=parseFloat(d.getSeconds()+'.'+d.getMilliseconds());
  var userid=nlapiGetUser();
//  if(userid!='2299863') {
    takeSnapshot({event:'RECORD SAVE'});
//  }
  var fieldobj=getUpdateFields();
  var estupdatefields=[];
  var estupdatevalues=[];
  var custupdatefields=[];
  var custupdatevalues=[];
  var estateId=nlapiGetFieldValue("custpage_estate");
  var customerId=nlapiGetFieldValue("custpage_customer_id");
  for(var i in fieldobj) {
    var fld=fieldobj[i];
    var target=fld.target;
    var val=nlapiGetFieldValue(i);
    if(fld.inactivecheck) {
      if(nlapiGetFieldText(i).match('legacy')) {
        continue;
      }
    }
    switch(i) {
      case 'custpage_early_rebate_1':
        val={'3':'1', '6':'2', '8':'7', '9':'3', '12':'4', '18':'5', '24':'6', '2':'8'}[val];
        break;
      case 'custpage_early_rebate_2':
        val={'3':'1', '6':'2', '9':'3', '12':'4', '18':'5', '24':'6', '15':'7'}[val];
        break;
      case 'custpage_early_rebate_3':
        val={'3':'1', '6':'2', '9':'3', '12':'4', '18':'5', '24':'6', '15':'7'}[val];
        break;
    }
    if(val=='undefined' || val=='') {
      val=null;
    }
    if(fld.type=='estate') {
      estupdatefields.push(target);
      estupdatevalues.push(val);
    }
    if(fld.type=='customer') {
      custupdatefields.push(target);
      custupdatevalues.push(val);
    }
  }
  if(customerId) {
    console.log(custupdatefields,custupdatevalues);
    nlapiSubmitField("customer", customerId, custupdatefields, custupdatevalues);
    console.log("updated customer",customerId);
  }
  if(estateId){
    console.log(estupdatefields,estupdatevalues);
    nlapiSubmitField("customer", estateId, estupdatefields, estupdatevalues);
    console.log("updated estate",estateId);
  }
  var d=new Date();
  var endtime=parseFloat(d.getSeconds()+'.'+d.getMilliseconds());
//  alert("Save operation took "+Math.round(100*(endtime-starttime))/100+" seconds");
  reloadpage();
}

function getUpdateFields() {
  return {
    "custpage_percent_equity_due":{"target":"custentity_percent_estate_due_to_custome","type":"customer","label":"Percent of Estate due to Customer"},
    "custpage_bequest_due":{"target":"custentity_specific_bequest_due_to_cust","type":"customer","label":"Specific Bequest due to Customer"},
    "custpage_existing_agreements":{"target":"custentity_customer_totalassignments","type":"customer","label":"Existing Assignments"},
    "custpage_liens_judgments":{"target":"custentity_customer_totalliens","type":"customer","label":"Liens and Judgments"},
    "custpage_adv_to_val_ratio":{"target":"custentity_advance_to_value_ratio","type":"customer","label":"Advance to Value Ratio"},
    "custpage_residue_equity_due":{"target":"custentity_customer_residueestatedue","type":"customer","label":"Residue of Estate due to Customer"},
    "custpage_total_due":{"target":"custentity_customer_totalduefromestate","type":"customer","label":"Total Due to Customer from Estate"},
    "custpage_net_due":{"target":"custentity_customer_netduefromestate","type":"customer","label":"Net due to Customer"},
    "custpage_max_advance":{"target":"custentity_customer_maxadvancesize","type":"customer","label":"Maximum Advance Size"},
    "custpage_heirship":{"target":"custentity_heirship_customer","type":"customer","label":"Customer Heirship"},
    "custpage_clientinestate":{"target":"custentity_client_living_in_estate_rp","type":"customer","label":"Client Living In Estate?"},
    "custpage_price_level":{"target":"custentity_pricing_level","type":"customer","label":"Pricing Level"},
    "custpage_desired_advance":{"target":"custentity_desired_advance_size","type":"customer","label":"Desired Advance Size"},
    "custpage_early_rebate_1":{"target":"custentity_early_rebate_option_1","type":"customer","label":"Early Rebate Option 1 (Months)"},
    "custpage_early_rebate_2":{"target":"custentity_early_rebate_option_2","type":"customer","label":"Early Rebate Option 2 (Months)"},
    "custpage_early_rebate_3":{"target":"custentity_early_rebate_option_3","type":"customer","label":"Early Rebate Option 3 (Months)"},
    "custpage_first_name":{"target":"firstname","type":"customer","label":"First Name"},
    "custpage_middle_initial":{"target":"middlename","type":"customer","label":"MI"},
    "custpage_last_name":{"target":"lastname","type":"customer","label":"Last Name"},
    "custpage_unsubscribe":{"target":"custentity_unsubscribe","type":"customer","label":"Unsubscribe Code"},
    "custpage_alt_phone":{"target":"altphone","type":"customer","label":"Alternate Phone Number"},
    "custpage_diligence_assignee":{"target":"custentity_diligence_assignee","type":"customer","label":"Diligence Assignee","inactivecheck":true},
    "custpage_phone":{"target":"phone","type":"customer","label":"Phone Number"},
    "custpage_email":{"target":"email","type":"customer","label":"Email"},
    "custpage_sales_rep":{"target":"custentity_sales_rep","type":"customer","label":"Sales Rep","inactivecheck":true},
    "custpage_followup_type":{"target":"custentity_follow_up_type","type":"customer","label":"Followup Type"},
    "custpage_diligence_blocked_account_letter":{"target":"custentity_blocked_account_letter","type":"estate","label":"Blocked Account Letter"},
    "custpage_client_signed_blocked_account":{"target":"custentity_client_signed_blocked_account","type":"estate","label":"Client Signed BOL Consent"},
    "custpage_courtapproved_blocked_account":{"target":"custentity_courtapproved_blocked_account","type":"estate","label":"Court Approval Of Blocked Account"},
    "custpage_total_property":{"target":"custentity_estate_total_property","type":"estate","label":"Total Value of Real Property"},
    "custpage_total_claims":{"target":"custentity_estate_total_claims","type":"estate","label":"Total Claims"},
    "custpage_total_assets":{"target":"custentity_estate_total_assets","type":"estate","label":"Total Assets"},
    "custpage_specific_bequests":{"target":"custentity_specific_bequests_due_to_heir","type":"estate","label":"Specific Bequests due to Heirs"},
    "custpage_closing_costs":{"target":"custentity_estate_closingcosts","type":"estate","label":"Real Estate Closing Costs"},
    "custpage_attorney_fees":{"target":"custentity_estate_attorneyfee","type":"estate","label":"Attorney's Fees"},
    "custpage_net_equity_value":{"target":"custentity_estate_net_equity","type":"estate","label":"Net Equity Value of the Estate"},
    "custpage_prinestate":{"target":"custentity_pr_living_in_estate","type":"estate","label":"PR(s)"},
    "custpage_clientinestate2":{"target":"custentity_client_living_in_estate","type":"estate","label":"Our Client(s)"},
    "custpage_heirinestate":{"target":"custentity_other_heirs_living_in_estate","type":"estate","label":"Other Heir(s)"},
    "custpage_thirdptyinestate":{"target":"custentity_third_party_living_in_estate","type":"estate","label":"Third Party(ies)"},
    "custpage_netassets":{"target":"custentity_estate_net_assets","type":"estate","label":"Net Assets"},
    "custpage_estatetype":{"target":"custentity_estate_type","type":"estate","label":"Estate Type"},
    "custpage_acctsecurity":{"target":"custentity_estate_account_security","type":"estate","label":"Account Security"},
    "custpage_multipleestatestrusts":{"target":"custentity_estates_multiple","type":"estate","label":"Multiple Estates or Trusts"},
    "custpage_supervisionlevel":{"target":"custentity_estate_supervision_level","type":"estate","label":"Level Of Supervision"},
    "custpage_claimsperiodend":{"target":"custentity_estate_claims_period_end","type":"estate","label":"End of Creditor Claims Period"},
    "custpage_estate_state":{"target":"custentity3","type":"estate","label":"State"},
    "custpage_decedent":{"target":"companyname","type":"estate","label":"Decedent Name (New)"},
    "custpage_case_no":{"target":"custentity1","type":"estate","label":"Case File No"},
    "custpage_estate_county":{"target":"custentity2","type":"estate","label":"County"},
    "custpage_estate_est_date_distr":{"target":"custentity_est_date_of_distribution","type":"estate","label":"Estimated Date of Distribution"},
    "custpage_est_status":{"target":"custentity_est_status","type":"estate","label":"Estate Status"},
    "custpage_estate_filing_date":{"target":"custentity_filing_date","type":"estate","label":"Filing Date"},
    "custpage_problem_case":{"target":"custentity_problem_case","type":"estate","label":"Problem Case"},
  };
}

function newCaseStatus() {
  var customerId = nlapiGetFieldValue("custpage_customer_id");
  var latestStatusId=nlapiGetFieldValue("custpage_latest_status_id");
  var popupurl='/app/site/hosting/scriptlet.nl?script=2204&deploy=1&custintid='+customerId+'&lateststatusid='+latestStatusId;
  nlOpenWindow(popupurl, 'new_case_status', 'width=500, height=600, resizable=yes, scrollbars=yes')
}

function mapclasstostate(a) {
  var states={"4":"0", "5":"1", "6":"2", "7":"3", "1":"4", "8":"5", "9":"6", "10":"7", "104":"8", "3":"9", "11":"10", "12":"11", "13":"12", "14":"13", "15":"14", "16":"15", "17":"16", "18":"17", "19":"18", "20":"19", "21":"20", "22":"21", "23":"22", "24":"23", "25":"24", "26":"25", "27":"26", "28":"27", "29":"28", "30":"29", "31":"30", "32":"31", "2":"32", "33":"33", "34":"34", "35":"35", "36":"36", "37":"37", "38":"38", "39":"40", "40":"41", "41":"42", "42":"43", "43":"44", "44":"45", "45":"46", "46":"47", "47":"48", "48":"49", "49":"50", "50":"51"};
  return states[a];
}

function stateToAbbrev(statename) {
  return {
    'alabama':'AL',
    'al':'Alabama',
    'alaska':'AK',
    'ak':'Alaska',
    'arizona':'AZ',
    'az':'Arizona',
    'arkansas':'AR',
    'ar':'Arkansas',
    'california':'CA',
    'ca':'California',
    'colorado':'CO',
    'co':'Colorado',
    'connecticut':'CT',
    'ct':'Connecticut',
    'delaware':'DE',
    'de':'Delaware',
    'district of columbia':'DC',
    'dc':'District Of Columbia',
    'florida':'FL',
    'fl':'Florida',
    'georgia':'GA',
    'ga':'Georgia',
    'hawaii':'HI',
    'hi':'Hawaii',
    'idaho':'ID',
    'id':'Idaho',
    'illinois':'IL',
    'il':'Illinois',
    'indiana':'IN',
    'in':'Indiana',
    'iowa':'IA',
    'ia':'Iowa',
    'kansas':'KS',
    'ks':'Kansas',
    'kentucky':'KY',
    'ky':'Kentucky',
    'louisiana':'LA',
    'la':'Louisiana',
    'maine':'ME',
    'me':'Maine',
    'maryland':'MD',
    'md':'Maryland',
    'massachusetts':'MA',
    'ma':'Massachusetts',
    'michigan':'MI',
    'mi':'Michigan',
    'minnesota':'MN',
    
    'mn':'Minnesota',
    'mississippi':'MS',
    'ms':'Mississippi',
    'missouri':'MO',
    'mo':'Missouri',
    'montana':'MT',
    'mt':'Montana',
    'nebraska':'NE',
    'ne':'Nebraska',
    'nevada':'NV',
    'nv':'Nevada',
    'new hampshire':'NH',
    'nh':'New Hampshire',
    'new jersey':'NJ',
    'nj':'New Jersey',
    'new mexico':'NM',
    'nm':'New Mexico',
    'new york':'NY',
    'ny':'New York',
    'north carolina':'NC',
    'nc':'North Carolina',
    'north dakota':'ND',
    'nd':'North Dakota',
    'ohio':'OH',
    'oh':'Ohio',
    'oklahoma':'OK',
    'ok':'Oklahoma',
    'oregon':'OR',
    'or':'Oregon',
    'pennsylvania':'PA',
    'pa':'Pennsylvania',
    'puerto rico':'PR',
    'pr':'Puerto Rico',
    'rhode island':'RI',
    'ri':'Rhode Island',
    'south carolina':'SC',
    'sc':'South Carolina',
    'south dakota':'SD',
    'sd':'South Dakota',
    'tennessee':'TN',
    'tn':'Tennessee',
    'texas':'TX',
    'tx':'Texas',
    'utah':'UT',
    'ut':'Utah',
    'vermont':'VT',
    'vt':'Vermont',
    'virginia':'VA',
    'va':'Virginia',
    'washington':'WA',
    'wa':'Washington',
    'west virginia':'WV',
    'wv':'West Virginia',
    'wisconsin':'WI',
    'wi':'Wisconsin',
    'wyoming':'WY',
    'wy':'Wyoming',
  }[statename.toLowerCase()];
}

function getcasefilelink(casenum, countyval) {
  var retval = null;
  nlapiLogExecution('DEBUG', casenum + ' ' + countyval);
  var rs = nlapiSearchRecord("customrecord_petition_file", null,
      [
        ["custrecord_petitionfile_statecounty", "anyof", countyval],
        "AND",
        ["custrecord_petitionfile_casenum", "is", casenum]
      ],
      [
        new nlobjSearchColumn("custrecord_petitionfile_filename"),
        new nlobjSearchColumn("custrecord_petitionfile_url")
      ]
  );
  if (rs == null)
    rs = [];
  switch (rs.length) {
    case 0:
      retval = 'No file uploaded yet';
      break;
    case 1:
      var filename = rs[0].getValue("custrecord_petitionfile_filename");
      var fileurl = rs[0].getValue("custrecord_petitionfile_url");
      var linktext = '<a target="_blank" href="' + fileurl + '">' + filename + '</a>';
      retval = linktext;
      break;
    default:
      retval='';
      for(var i=0; i<rs.length; i++) {
        var filename = rs[i].getValue("custrecord_petitionfile_filename");
        var fileurl = rs[i].getValue("custrecord_petitionfile_url");
        var linktext = '<a target="_blank" href="' + fileurl + '">' + filename + '</a>';
        retval += linktext;
      }
  }
  return retval;
}

function searchbuttonclick() {
  var estate_state=nlapiGetFieldText('custpage_estate_state');
  var estate_county=nlapiGetFieldText('custpage_estate_county');
  var estate_casenum=nlapiGetFieldValue('custpage_case_no');
  var customer_unsubscribe=nlapiGetFieldValue('custpage_unsubscribe');
  var params='&state='+estate_state+'&county='+estate_county+'&casenum='+estate_casenum+'&unsubscribe='+customer_unsubscribe;
  nlOpenWindow('/app/site/hosting/scriptlet.nl?script=2623&deploy=1'+params, '_blank','height=550,width=1000,toolbar=yes');
//  nlOpenWindow('/app/common/entity/contact.nl?id='+getSelectValue(getFormElementViaFormName('main_form', 'custpage_attorney_id'))+'', '_blank','height=450,width=450');
//  var request=nlapiRequestURL("/app/site/hosting/restlet.nl?script=2623&deploy=1", null, null, null, "GET");
//  var data=JSON.parse(request.body);
//  console.log(request.body);
  return true;
}
