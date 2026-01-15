function isempty(val) {
  if(val == null || val.toString().trim() == "")
    return true
  else
    return false;
}

function New_Customer_Application(request, response) {
  if (request.getMethod() == "GET") {
    try {
      var customer = null;
      var customerId = null;
      var estate = null;
      var estateId = null;

      var isInactive;

      var exceptionflag = request.getParameter("exceptionflag");
      var successFlag = request.getParameter("succesflag");

      nlapiLogExecution('DEBUG', 'exceptionflag', 'exceptionflag--' + exceptionflag);
      nlapiLogExecution('DEBUG', 'successFlag', 'successFlag--' + successFlag);

      if (exceptionflag == 'T' || successFlag == 'T') {


        if (request.getParameter("exceptionflag") == 'T') {
          var errorMessage = request.getParameter("message");
          nlapiLogExecution('DEBUG', 'EXCEPTION FORM FOM CLIENt', 'errorMessage--' + errorMessage);

          var form = nlapiCreateForm('Exception Form');
          var fld = form.addField('custpage_exception', 'textarea', 'Exception Details');
          fld.setDefaultValue(errorMessage);
          fld.setDisplayType('inline');
          form.addButton('custpage_closebutton', 'Close', 'window.close();');
          response.writePage(form);

        }

        if (request.getParameter("succesflag") == 'T') {
          var successrMessage = request.getParameter("message");
          nlapiLogExecution('DEBUG', 'Success FORM FOM CLIENt', 'errorMessage--' + successrMessage);

          nlapiLogExecution('DEBUG', 'Customer Actiavted', 'Customer Actiavted-' + childRecords)
          var form = nlapiCreateForm('Customer Activated');
          var fld = form.addField('custpage_exception', 'textarea', 'Exception Details');
          fld.setDefaultValue(successrMessage);
          fld.setDisplayType('inline');
          form.addButton('custpage_closebutton', 'Close', 'window.close();');
          response.writePage(form);

        }

      } else {

        if (request.getParameter("customer") != null && request.getParameter("customer") != "") {
          customerId = request.getParameter("customer");
          customer = nlapiLoadRecord("customer", customerId);
          estateId = customer.getFieldValue("parent");
          if (estateId != null && estateId != "") {
            estate = nlapiLoadRecord("customer", estateId);
          } else {
            estateId = null;
          }
        }
        if (request.getParameter("estate") != null && request.getParameter("estate") != "") {
          estateId = request.getParameter("estate");
          estate = nlapiLoadRecord("customer", estateId);

        }

        nlapiLogExecution("debug", "Estate ID", 'estateId--' + estateId);
        nlapiLogExecution("debug", "Customer ID", 'customerId--' + customerId);

        if ((estateId == null || estateId == "") && (customerId == null || customerId == "")) {
          //Create temp estate + customer
          var estate = nlapiCreateRecord("customer");
          estate.setFieldValue("subsidiary", "2");
          estate.setFieldValue("isperson", "F");
          estate.setFieldValue("companyname", "[TEMP] NEW CUSTOMER");
          estate.setFieldValue("category", "2");
          estateId = nlapiSubmitRecord(estate, true, true);

          var customer = nlapiCreateRecord("customer");
          customer.setFieldValue("subsidiary", "2");
          customer.setFieldValue("isperson", "T");
          customer.setFieldValue("firstname", "NEW");
          customer.setFieldValue("lastname", "CUSTOMER");
          customer.setFieldValue("category", "1");
          customer.setFieldValue("parent", estateId);
          //  customer.setFieldValue("custentity_follow_up_type",1);
          customerId = nlapiSubmitRecord(customer, true, true);
        }
        nlapiLogExecution("debug", "Estate ID", "check1");
        nlapiLogExecution("debug", "Estate ID", "customer data" + JSON.stringify(customer));
        if (customer != null && customer != "")
          var form = nlapiCreateForm(customer.getFieldValue("entityid") + " " + customer.getFieldValue("firstname") + " " + customer.getFieldValue("lastname"));
        else
          var form = nlapiCreateForm("New Customer Application");
        nlapiLogExecution("debug", "Estate ID", "check2");

        form.setScript("customscript_new_cust_app_cs");
        form.addButton('custpage_savebutton', 'Save', 'savebuttonclick();');
        form.addButton('custpage_searchbutton', 'Search Mailer Data', 'searchbuttonclick();');
//        form.addButton('auto_so_if_btn', 'Print Shipping Label', 'onAutoSoIfBtnClick(' + request.getParameter("customer") + ')');

        var fld;
        var fldGroup;
        form.addFieldGroup("customer", "Customer Information");
        form.addFieldGroup("estate", "Estate Information");
        form.addFieldGroup("diligence", "Diligence Information");

        form.addTab("financials", "Estate Financials");

        //Field Groups under Customer Quotes subtab
        form.addTab("quotes", "Customer Quotes");
        fldGroup = form.addFieldGroup("sizing", "Sizing", "quotes");
        fldGroup.setSingleColumn(true);

        fldGroup = form.addFieldGroup("pricing", "Pricing", "quotes");
        fldGroup.setSingleColumn(true);

        fldGroup = form.addFieldGroup("case_status", "Update Case Status", "quotes");
        fldGroup.setSingleColumn(true);

        fldGroup = form.addFieldGroup("temp", "Temporary for Validation", "quotes");
        fldGroup.setSingleColumn(true);

        fldGroup = form.addFieldGroup("getquote", "Get Quote", "quotes");
        fldGroup.setSingleColumn(true);

        //Additional subtabs
        form.addTab("communication", "Communication");
//                form.addSubTab("phonecalls", "Phone Calls", "communication");
        form.addSubTab("phonecalls", "Case Updates", "communication");
        form.addSubTab("message", "Messages", "communication");
        form.addSubTab("tasks", "Tasks", "communication");
        form.addSubTab("events", "Events", "communication");
        form.addSubTab("usernotes", "User Notes", "communication");


        form.addTab("relationships", "Relationships");
        form.addTab("jurisdiction", "Jurisdiction");
        //form.addTab("documents","Documents");
        form.addTab("marketing", "Marketing");
        form.addTab("invoices", "Invoices");
        form.addTab("followup", "Follow Up");


        //23-12-2022
        form.addTab("custom_tab", "Custom");


        fld = form.addField("custpage_wa_name", "checkbox", "OPT-IN WORKFLOW SMS", null, 'custom_tab');
        if (customer != null)
          fld.setDefaultValue(customer.getFieldValue("custentity_mmsdf_send_wf_sms"))
        fld = form.addField("custpage_wa_state_name", "checkbox", "OPT-OUT SMS", null, 'custom_tab');
        if (customer != null)
          fld.setDefaultValue(customer.getFieldValue("custentity_mmsdf_stopsendingsms"))


        fld = form.addField("custpage_customer_id", "select", "Customer (Existing)", "customer", "customer");
        fld.setLayoutType("normal", "startcol");
        if (customerId != null && customerId != "")
          fld.setDefaultValue(customerId);
        fld = form.addField("custpage_first_name", "text", "First Name", null, "customer");
        if (customer != null)
          fld.setDefaultValue(customer.getFieldValue("firstname"));
        fld = form.addField("custpage_middle_initial", "text", "MI", null, "customer");
        if (customer != null)
          fld.setDefaultValue(customer.getFieldValue("middlename"));
        fld = form.addField("custpage_last_name", "text", "Last Name", null, "customer");
        if (customer != null)
          fld.setDefaultValue(customer.getFieldValue("lastname"));
        fld = form.addField("custpage_unsubscribe", "text", "Customer Code", null, "customer");
        if (customer != null)
          fld.setDefaultValue(customer.getFieldValue("custentity_unsubscribe"));

        fld = form.addField("custpage_address", "text", "Address", null, "customer");
        fld.setLayoutType("normal", "startcol");
        if (customer != null)
          fld.setDefaultValue(customer.getFieldValue("billaddr1"));
        fld = form.addField("custpage_city", "text", "City", null, "customer");
        if (customer != null)
          fld.setDefaultValue(customer.getFieldValue("billcity"));
        fld = form.addField("custpage_state_warn", "inlinehtml", "State Warning", null, "customer");
        fld.setDefaultValue(" ");
        fld = form.addField("custpage_state", "select", "State", "classification", "customer");
        if (customer != null)
          fld.setDefaultValue(mapState(customer.getFieldValue("billstate")));
        fld = form.addField("custpage_zip", "text", "Zip", null, "customer");
        if (customer != null)
          fld.setDefaultValue(customer.getFieldValue("billzip"));
        fld = form.addField("custpage_clientinestate", 'select', 'Client Living In Estate?', "customlist_yes_no", "customer");
        if (customer != null)
          fld.setDefaultValue(customer.getFieldValue('custentity_client_living_in_estate_rp'));
/////////////// begin new for reduced select options ///////////////
        fld = form.addField("custpage_sales_rep", "select", "Sales Rep", null, "customer");
        if (customer != null) {
          var currentsalesrep = customer.getFieldValue("custentity_sales_rep");
          var currentsalesrepname = customer.getFieldText("custentity_sales_rep");
        }
        fld.addSelectOption(null, '-NONE-', true);
        var salesreps = getRepList('sales');
        var selectoptions = [];
        salesreps.forEach(function (line) {
          selectoptions.push(line.value);
          fld.addSelectOption(line.value, line.text);
        });
        if (currentsalesrep != null && currentsalesrep != '' && selectoptions.indexOf(currentsalesrep) == -1) {
          fld.addSelectOption(currentsalesrep, currentsalesrepname + ' (legacy)');
        }
        fld.setDefaultValue(currentsalesrep);
/////////////// end new for reduced select options ///////////////

        fld = form.addField("custpage_phone", "phone", "Phone Number", null, "customer");
        fld.setLayoutType("normal", "startcol");
        if (customer != null)
          fld.setDefaultValue(customer.getFieldValue("phone"));
        fld = form.addField("custpage_alt_phone", "phone", "Alternate Phone Number", null, "customer");
        if (customer != null)
//                    fld.setDefaultValue(customer.getFieldValue("custentity_alternate_phone_number"));
          fld.setDefaultValue(customer.getFieldValue("altphone"));

        fld = form.addField("custpage_email", "email", "Email", null, "customer");
        if (customer != null)
          fld.setDefaultValue(customer.getFieldValue("email"));


/////////////// begin new for reduced select options ///////////////
        fld = form.addField("custpage_how_did_they_find_us", "select", "How Did They Find Us", null, "customer");
        if (customer != null) {
          var currentleadsource = customer.getFieldValue("leadsource");
          var currentleadname = customer.getFieldText("leadsource");
        }
        fld.addSelectOption(null, '-NONE-', true);
        var leadsources = getLeadSources();
        var selectoptions = [];
        leadsources.forEach(function (line) {
          selectoptions.push(line.value);
          fld.addSelectOption(line.value, line.text);
        });
        if (currentleadsource != null && currentleadsource != '' && selectoptions.indexOf(currentleadsource) == -1) {
          fld.addSelectOption(currentleadsource, currentleadname + ' (legacy)', true);
        }
        fld.setDefaultValue(currentleadsource);
/////////////// end new for reduced select options ///////////////

        //Adding Active Field ....
        if (customer != null) {
          var custActive = form.addField("custpage_cust_isactive", "checkbox", "CUST:InActive", "customer");
          custActive.setDisplayType("inline");
          custActive.setDefaultValue(customer.getFieldValue("isinactive"));
          //End of Adding Active Field ....
          nlapiLogExecution("debug", "customer ID", "customer 3");
        }

        var latestStatus = null;
        var latestStatusId = null;
        var latestStatusNotes = null;
        var casefilenum = null;
        var fldval = null;

        if (customerId != null) {
          var filters = [];
          filters.push(new nlobjSearchFilter("custrecord_case_status_customer", null, "is", customerId));
          var cols = [];
          cols.push(new nlobjSearchColumn("custrecord_case_status_status"));
          cols.push(new nlobjSearchColumn("custrecord_case_status_notes"));
          cols.push(new nlobjSearchColumn("internalid").setSort(true));
          var results = nlapiSearchRecord("customrecord_case_status", null, filters, cols);
          if (results) {
            latestStatusId = results[0].getId();
            latestStatus = results[0].getValue("custrecord_case_status_status");
            latestStatusNotes = results[0].getValue("custrecord_case_status_notes");
          }
        }

        fld = form.addField("custpage_latest_status_id", "select", "Latest Status Record", "customrecord_case_status", "customer");
        fld.setDisplayType("hidden");
        if (latestStatusId != null)
          fld.setDefaultValue(latestStatusId);

        fld = form.addField("custpage_latest_status", "select", "Latest Status", "customlist_case_statuses", "customer");
        //fld.setDisplayType("inline");
        if (latestStatus != null)
          fld.setDefaultValue(latestStatus);
        nlapiLogExecution("debug", "xxxxxx", latestStatus);

        fld = form.addField("custpage_notes", "textarea", "Notes from Customer Contact", null, "customer");
        fld.setLayoutType("normal", "startcol");
        nlapiLogExecution("debug", "Estate ID", "check2");
        fld.setDisplaySize("70", "6");

        fld = form.addField("custpage_followup_type", "select", "Followup Type", "customlist_follow_up_type", "customer");
        nlapiLogExecution("DEBUG", "customerId", customer);
        if (customer != null)
          fld.setDefaultValue(customer.getFieldValue("custentity_follow_up_type"));

        fld = form.addField("custpage_latest_status_notes", "textarea", "Latest Status Notes", null, "customer");
        //fld.setDisplayType("inline");
        if (latestStatusNotes != null)
          fld.setDefaultValue(latestStatusNotes);


        fld = form.addField("custpage_estate", "select", "Decedent Name (Existing)", "customer", "estate");
        fld.setLayoutType("normal", "startcol");
        if (estateId != null && estateId != "")
          fld.setDefaultValue(estateId);
        fld = form.addField("custpage_decedent", "text", "Decedent Name (New)", null, "estate");
        if (estate != null)
          fld.setDefaultValue(estate.getFieldValue("companyname"));
        fld = form.addField("custpage_case_no", "text", "Case File No", null, "estate");
        if (estate != null) {
          casefilenum=estate.getFieldValue("custentity1");
          fld.setDefaultValue(casefilenum);
        }
        casefilelinkfld = form.addField("custpage_casefilelink", "inlinehtml", "Case File Link", null, "estate");


        try {
//  if(customer!=null) {
//    windowcustdata={
//      custpage_percent_equity_due:customer.getFieldValue('custentity_percent_estate_due_to_custome'),
//      custpage_bequest_due:customer.getFieldValue('custentity_specific_bequest_due_to_cust'),
//      custpage_existing_agreements:customer.getFieldValue('custentity_customer_totalassignments'),
//      custpage_liens_judgments:customer.getFieldValue('custentity_customer_totalliens'),
//      custpage_adv_to_val_ratio:customer.getFieldValue('custentity_advance_to_value_ratio'),
//      custpage_residue_equity_due:customer.getFieldValue('custentity_customer_residueestatedue'),
//      custpage_total_due:customer.getFieldValue('custentity_customer_totalduefromestate'),
//      custpage_net_due:customer.getFieldValue('custentity_customer_netduefromestate'),
//      custpage_max_advance:customer.getFieldValue('custentity_customer_maxadvancesize')
//    };
//  }
//  if(estate!=null) {
//    windowestdata={
//      custpage_total_property:estate.getFieldValue('custentity_estate_total_property'),
//      custpage_total_claims:estate.getFieldValue('custentity_estate_total_claims'),
//      custpage_total_assets:estate.getFieldValue('custentity_estate_total_assets'),
//      custpage_specific_bequests:estate.getFieldValue('custentity_specific_bequests_due_to_heir'),
//      custpage_closing_costs:estate.getFieldValue('custentity_estate_closingcosts'),
//      custpage_attorney_fees:estate.getFieldValue('custentity_estate_attorneyfee'),
//      custpage_net_equity_value:estate.getFieldValue('custentity_estate_net_equity')
//    };
//  }
////  nlapiLogExecution('debug', 'RM Customer Data', JSON.stringify(windowcustdata));
////  nlapiLogExecution('debug', 'RM Estate Data', JSON.stringify(windowestdata));
////  fld=form.addField("custpage_custdata", "text", "custdata");
////  fld.setDisplayType('hidden');
////  fld.setDefaultValue(JSON.stringify(windowcustdata));
////  fld=form.addField("custpage_estdata", "text", "estdata");
////  fld.setDefaultValue(JSON.stringify(windowestdata));
////  fld.setDisplayType('hidden');

// customer: custpage_customer_id, estate: custpage_estate
//  var cid=request.getParameter("customer");
//  var eid=request.getParameter("estate");
//  var cid=nlapiGetFieldValue("custpage_customer_id");
//  var eid=nlapiGetFieldValue("custpage_estate");
          var cid = customerId;
          var eid = estateId;
          nlapiLogExecution("debug", "cid:" + cid);
          nlapiLogExecution("debug", "eid:" + eid);
          var uu = nlapiGetUser();
          if (uu=='2299863' || uu=='2698763' || uu=='848463') {
            if (cid) {
//              form.addButton('custpage_cust_nativeform', 'Customer Native Form', "window.location.href='/app/common/entity/custjob.nl?id=" + cid + "&native=T'");
              var url="/app/common/entity/custjob.nl?id=" + cid + "&native=T&e=T";
              form.addButton('custpage_cust_nativeform', 'Customer Native Form', "window.open('"+url+"')");
            }
            if (eid) {
//              form.addButton('custpage_est_nativeform', 'Estate Native Form', "window.location.href='/app/common/entity/custjob.nl?id=" + eid + "&native=T'");
              var url="/app/common/entity/custjob.nl?id=" + eid + "&native=T&e=T";
              form.addButton('custpage_est_nativeform', 'Estate Native Form', "window.open('"+url+"')");
            }
            if (!cid && !eid)
              nlapiLogExecution("debug", "can't create button, no id");
          }
        } catch (e) {
          nlapiLogExecution('DEBUG', "error loading button: " + e.name, e.message);
        }

        fld = form.addField("custpage_estate_state_warn", "inlinehtml", "State Warning", null, "estate");
        fld.setDefaultValue(" ");
        fld = form.addField("custpage_estate_state", "select", "State", "classification", "estate");
        if (estate != null)
          fld.setDefaultValue(estate.getFieldValue("custentity3"));
        fld = form.addField("custpage_estate_county_warn", "inlinehtml", "County Warning", null, "estate");
        fld.setDefaultValue(" ");
        fld = form.addField("custpage_estate_county", "select", "County", "customrecord173", "estate");
        var countyval=estate.getFieldValue("custentity2")
        if (estate != null) {
          fld.setDefaultValue(countyval);
        }

        if(casefilenum!=null && countyval!=null && countyval!='') 
          fldval=getcasefilelink(casefilenum, countyval);
        else
          fldval="No case number present";

        casefilelinkfld.setDefaultValue(fldval);


        
        fld = form.addField("custpage_estate_est_date_distr", "date", "Estimated Date of Distribution", null, "estate");
        if (estate != null)
          fld.setDefaultValue(estate.getFieldValue("custentity_est_date_of_distribution"));

        fld = form.addField("custpage_estate_filing_date", "date", "Filing Date", null, "estate");
        if (estate != null)
          fld.setDefaultValue(estate.getFieldValue("custentity_filing_date"));

        var nextEventFld = form.addField("custpage_estate_next_event", "text", "Next Event", null, "estate");
        nextEventFld.setDisplayType("inline");

        var nextCallFld = form.addField("custpage_estate_next_phonecall", "text", "Last Phone Call", null, "estate");
        nextCallFld.setDisplayType("inline");

        fld = form.addField("custpage_est_status", "select", "Estate Status", "customlist_open_list", "estate");
        nlapiLogExecution("DEBUG", "estateId", estate);
        if (estate != null)
          fld.setDefaultValue(estate.getFieldValue("custentity_est_status"));

        //Adding Active Field ....
        if (estate != null) {
          var customerActive = form.addField("custpage_est_isactive", "checkbox", "EST:InActive", "estate");
          customerActive.setDisplayType("inline");
          customerActive.setDefaultValue(estate.getFieldValue("isinactive"));
          //End of Adding Active Field ....
          nlapiLogExecution("debug", "Estate ID", "check4");
        }
// RM 20240122 BEGIN
        nlapiLogExecution('debug', 'estate', estateId);
        fld = form.addField("custpage_estatetype", 'select', "Estate Type", "customlist_estate_type_options", "estate");
        nlapiLogExecution('debug', 'estate type', estate.getFieldValue("custentity_estate_type"));
        if (estate != null)
          fld.setDefaultValue(estate.getFieldValue("custentity_estate_type"));
        fld = form.addField("custpage_acctsecurity", 'select', "Account Security", "customlist_account_security_options", "estate");
        if (estate != null)
          fld.setDefaultValue(estate.getFieldValue("custentity_estate_account_security"));
        fld = form.addField("custpage_multipleestatestrusts", 'select', "Multiple Estates or Trusts", "customlist_yes_no", "estate");
        if (estate != null)
          fld.setDefaultValue(estate.getFieldValue("custentity_estates_multiple"));
        fld = form.addField("custpage_supervisionlevel", 'select', "Level Of Supervision", "customlist_supervision_level", "estate");
        if (estate != null)
          fld.setDefaultValue(estate.getFieldValue("custentity_estate_supervision_level"));
        fld = form.addField("custpage_claimsperiodend", 'date', "End of Creditor Claims Period", null, "estate")
        if (estate != null)
          fld.setDefaultValue(estate.getFieldValue("custentity_estate_claims_period_end"));
// RM 20240122 END

        var attorneyFlds = null;

        if (estateId != null && estateId != "") {
          var filters = [];
//                    filters.push(new nlobjSearchFilter("company", null, "is", estateId));
          filters.push(new nlobjSearchFilter("internalid", "company", "anyof", estateId));
          filters.push(new nlobjSearchFilter("role", null, "is", "1")); //Contact Category = Attorney
          var cols = [];
          cols.push(new nlobjSearchColumn("custentity_law_firm"));
          cols.push(new nlobjSearchColumn("entityid"));
          cols.push(new nlobjSearchColumn("email"));
          cols.push(new nlobjSearchColumn("phone"));
          cols.push(new nlobjSearchColumn("billaddress1"));
          cols.push(new nlobjSearchColumn("billcity"));
          cols.push(new nlobjSearchColumn("billstate"));
          cols.push(new nlobjSearchColumn("billzipcode"));
          cols.push(new nlobjSearchColumn("custentity_attorney_rating"));
          cols.push(new nlobjSearchColumn("custentity_contact_notes"));
          var results = nlapiSearchRecord("contact", null, filters, cols);
          if (results) {
            attorneyFlds = results[0];
          }
        }

        fld = form.addField("custpage_attorney_id", "select", "Attorney Contact ID", "contact", "estate");
        fld.setLayoutType("normal", "startcol");
        if (attorneyFlds != null)
          fld.setDefaultValue(attorneyFlds.getId());
        fld = form.addField("custpage_attorney_name", "text", "Attorney Name", null, "estate");
        if (attorneyFlds != null)
          fld.setDefaultValue(attorneyFlds.getValue("entityid"));
        fld.setDisplayType('disabled');
        fld = form.addField("custpage_firm_name", "text", "Firm Name", null, "estate");
        if (attorneyFlds != null)
          fld.setDefaultValue(attorneyFlds.getValue("custentity_law_firm"));
        fld.setDisplayType('disabled');
        fld = form.addField("custpage_attorney_address", "text", "Address", null, "estate");
        if (attorneyFlds != null)
          fld.setDefaultValue(attorneyFlds.getValue("billaddress1"));
        fld.setDisplayType('disabled');
        fld = form.addField("custpage_attorney_city", "text", "City", null, "estate");
        if (attorneyFlds != null)
          fld.setDefaultValue(attorneyFlds.getValue("billcity"));
        fld.setDisplayType('disabled');
        fld = form.addField("custpage_attorney_state", "select", "State", "classification", "estate");
        if (attorneyFlds != null)
          fld.setDefaultValue(mapState(attorneyFlds.getValue("billstate")));
        fld.setDisplayType('disabled');
        fld = form.addField("custpage_attorney_zip", "text", "Zip", null, "estate");
        if (attorneyFlds != null)
          fld.setDefaultValue(attorneyFlds.getValue("billzipcode"));
        fld.setDisplayType('disabled');
        fld = form.addField("custpage_attorney_phone", "phone", "Phone", null, "estate");
        if (attorneyFlds != null)
          fld.setDefaultValue(attorneyFlds.getValue("phone"));
        fld.setDisplayType('disabled');
        fld = form.addField("custpage_attorney_email", "email", "Email", null, "estate");
        if (attorneyFlds != null)
          fld.setDefaultValue(attorneyFlds.getValue("email"));
        fld.setDisplayType('disabled');
        fld = form.addField("custpage_attorney_rating", "select", "Attorney Rating", null, "estate");
//              fld.setDisplayType('disabled');
        if (attorneyFlds != null)
          var attyscore = attorneyFlds.getValue("custentity_attorney_rating");
        fld.addSelectOption(0, "Unknown", attyscore ? false : true);
        fld.addSelectOption(1, "1");
        fld.addSelectOption(2, "2");
        fld.addSelectOption(3, "3");
        fld.addSelectOption(4, "4");
        fld.addSelectOption(5, "5");
        if (attyscore) {
          fld.setDefaultValue(attyscore);
        }
        fld = form.addField("custpage_attorney_notes", "textarea", "Attorney Notes", null, "estate");
//              fld.setDisplayType('disabled');
        if (attorneyFlds != null)
          var attynotes = attorneyFlds.getValue("custentity_contact_notes");
        if (attynotes) {
          fld.setDefaultValue(attynotes);
        }


        nlapiLogExecution("debug", "Added Attorney");

        var personalRepFlds = null;

        if (estateId != null && estateId != "") {
          var filters = [];
          filters.push(new nlobjSearchFilter("internalid", "company", "anyof", estateId));
          filters.push(new nlobjSearchFilter("role", null, "is", "-10")); //Contact Category = Primary Contact (aka Personal Rep)
          var cols = [];
          cols.push(new nlobjSearchColumn("entityid"));
          cols.push(new nlobjSearchColumn("email"));
          cols.push(new nlobjSearchColumn("phone"));
          cols.push(new nlobjSearchColumn("custentity_pr_relationship"));
          cols.push(new nlobjSearchColumn("billaddress1"));
          cols.push(new nlobjSearchColumn("billcity"));
          cols.push(new nlobjSearchColumn("billstate"));
          cols.push(new nlobjSearchColumn("billzipcode"));
          cols.push(new nlobjSearchColumn("custentity_contact_notes"));
          var results = nlapiSearchRecord("contact", null, filters, cols);
          if (results) {
            personalRepFlds = results[0];
          }
        }

        fld = form.addField("custpage_personal_rep_1_id", "select", "Personal Rep 1 Contact ID", "contact", "estate");
        fld.setLayoutType("normal", "startcol");
        if (personalRepFlds != null)
          fld.setDefaultValue(personalRepFlds.getId());
        fld = form.addField("custpage_personal_rep_1_relationship", "select", "Relationship To Decedent", 'customlist_pr_relationships', "estate");
        if (personalRepFlds != null)
          fld.setDefaultValue(personalRepFlds.getValue("custentity_pr_relationship"));
        fld = form.addField("custpage_personal_rep_1", "text", "Personal Representative 1", null, "estate");
        if (personalRepFlds != null)
          fld.setDefaultValue(personalRepFlds.getValue("entityid"));
        fld.setDisplayType('disabled');
        fld = form.addField("custpage_personal_rep_1_address", "text", "Address", null, "estate");
        if (personalRepFlds != null)
          fld.setDefaultValue(personalRepFlds.getValue("billaddress1"));
        fld.setDisplayType('disabled');
        fld = form.addField("custpage_personal_rep_1_city", "text", "City", null, "estate");
        if (personalRepFlds != null)
          fld.setDefaultValue(personalRepFlds.getValue("billcity"));
        fld.setDisplayType('disabled');
        fld = form.addField("custpage_personal_rep_1_state", "select", "State", "classification", "estate");
        if (personalRepFlds != null)
          fld.setDefaultValue(mapState(personalRepFlds.getValue("billstate")));
        fld.setDisplayType('disabled');
        fld = form.addField("custpage_personal_rep_1_zip", "text", "Zip", null, "estate");
        if (personalRepFlds != null)
          fld.setDefaultValue(personalRepFlds.getValue("billzipcode"));
        fld.setDisplayType('disabled');
        fld = form.addField("custpage_personal_rep_1_phone", "phone", "Phone", null, "estate");
        if (personalRepFlds != null)
          fld.setDefaultValue(personalRepFlds.getValue("phone"));
        fld.setDisplayType('disabled');
        fld = form.addField("custpage_personal_rep_1_email", "email", "Email", null, "estate");
        if (personalRepFlds != null)
          fld.setDefaultValue(personalRepFlds.getValue("email"));
        fld.setDisplayType('disabled');
        fld = form.addField("custpage_personal_rep_1_notes", "textarea", "Personal Rep 1 Notes", null, "estate");
//              fld.setDisplayType('disabled');
        if (personalRepFlds != null)
          var prnotes = personalRepFlds.getValue("custentity_contact_notes");
        if (prnotes) {
          fld.setDefaultValue(prnotes);
        }


        /////////////// begin new for reduced select options ///////////////
        fld = form.addField("custpage_diligence_assignee", "select", "Diligence Assignee", null, "estate");
        if (customer != null) {
          var currentdiligencerep = customer.getFieldValue("custentity_diligence_assignee");
          var currentdiligencerepname = customer.getFieldText("custentity_diligence_assignee");
        }
        fld.addSelectOption(null, '-NONE-', true);
        var diligencereps = getRepList('diligence');
        var selectoptions = [];
        diligencereps.forEach(function (line) {
          selectoptions.push(line.value);
          fld.addSelectOption(line.value, line.text);
        });
        if (currentdiligencerep != null && currentdiligencerep != '' && selectoptions.indexOf(currentdiligencerep) == -1) {
          fld.addSelectOption(currentdiligencerep, currentdiligencerepname + ' (legacy)', true);
        }
        fld.setDefaultValue(currentdiligencerep);

        
        fld = form.addField("custpage_pm_assignee", "select", "Portfolio Management Assignee", null, "estate");
        if (estate != null) {
          var currentpmrep = estate.getFieldValue("custentity_pm_assignee");
          var currentpmrepname = estate.getFieldText("custentity_pm_assignee");
          nlapiLogExecution('debug', currentpmrep + ' ' + currentpmrepname);
        }
        fld.addSelectOption(null, '', true);
        var pmreps = getRepList('pm');
        var selectoptions = [];
        pmreps.forEach(function (line) {
          selectoptions.push(line.value);
          fld.addSelectOption(line.value, line.text);
        });
        if (currentpmrep != null && currentpmrep != '' && selectoptions.indexOf(currentpmrep) == -1) {
          fld.addSelectOption(currentpmrep, currentpmrepname + ' (legacy)', true);
        }
        fld.setDefaultValue(currentpmrep);
/////////////// end new for reduced select options ///////////////


        nlapiLogExecution("debug", "Added Personal Rep");
        var dotField = form.addField("custpage_diligence_dot", "checkbox", "DOT", null, "estate");
        dotField.setDisplayType("disabled");             ////// Change
        var escrowField = form.addField("custpage_diligence_escrow", "checkbox", "ESCROW", null, "estate");
        escrowField.setDisplayType("disabled");            ////// Change

        var accountField = form.addField("custpage_diligence_blocked_account_letter", "checkbox", "Blocked Account Letter", null, "estate");
        if (estateId) {
          if(estate==null) {
            estate = nlapiLoadRecord('customer', estateId);
          }
          accountField.setDefaultValue(estate.getFieldValue("custentity_blocked_account_letter"));
        }

        var accountField = form.addField("custpage_client_signed_blocked_account", "checkbox", "Client Signed Blocked Account Consent", null, "estate");
        if (estateId) {
          if(estate==null) {
            var estate = nlapiLoadRecord('customer', estateId);
          }
          accountField.setDefaultValue(estate.getFieldValue("custentity_client_signed_blocked_account"));
        }

        var accountField = form.addField("custpage_courtapproved_blocked_account", "checkbox", "Blocked Account Obtained", null, "estate");
        if (estateId) {
          if(estate==null) {
            var estate = nlapiLoadRecord('customer', estateId);
          }
          accountField.setDefaultValue(estate.getFieldValue("custentity_courtapproved_blocked_account"));
        }
        
        var accountField = form.addField("custpage_problem_case", "checkbox", "Problem Case", null, "estate");
        if (estateId) {
          if(estate==null) {
            var estate = nlapiLoadRecord('customer', estateId);
          }
          accountField.setDefaultValue(estate.getFieldValue("custentity_problem_case"));
        }
//                }
        //escrowField.setDisplayType("disabled");            ////// Change

        var lispenfld = form.addField("custpage_diligence_lispendens", "checkbox", "Lis Pendens", null, "estate");
        lispenfld.setDisplayType("disabled");            ////// Change
        var moifld = form.addField("custpage_diligence_moi", "checkbox", "MOI", null, "estate");
        moifld.setDisplayType("disabled");            ////// Change

        fld = form.addField("custpage_total_property", "integer", "Total Value of Real Property", null, "financials");
        fld.setDisplayType("inline");
        fld.setDefaultValue(0.00);
        fld = form.addField("custpage_total_assets", "integer", "Total Assets", null, "financials");
        fld.setDisplayType("inline");
        fld.setDefaultValue(0.00);
        fld = form.addField("custpage_total_claims", "integer", "Total Claims", null, "financials");
        fld.setDisplayType("inline");
        fld.setDefaultValue(0.00);
        fld = form.addField("custpage_specific_bequests", "integer", "Specific Bequests due to Heirs", null, "financials");
        if (estate != null && estate.getFieldValue("custentity_specific_bequests_due_to_heir") != null && estate.getFieldValue("custentity_specific_bequests_due_to_heir") != "")
          fld.setDefaultValue(estate.getFieldValue("custentity_specific_bequests_due_to_heir"));
        else
          fld.setDefaultValue(0.00);
        fld = form.addField("custpage_closing_costs", "integer", "Real Estate Closing Costs", null, "financials");
        fld.setLayoutType("normal", "startcol");
        fld.setDisplayType("inline");
        fld.setDefaultValue(0.00);
        fld = form.addField("custpage_attorney_fees", "integer", "Attorney's Fees", null, "financials");
        fld.setDisplayType("inline");
        fld.setDefaultValue(0.00);
        fld = form.addField("custpage_net_equity_value_1", "integer", "Net Equity Value of Estate", null, "financials");
        fld.setDisplayType("inline");
        fld.setDefaultValue(0.00);
        var legal_expenes = form.addField("custpage_net_legal_expenses", "currency", "Legal expenses", null, "financials");
        legal_expenes.setDisplayType("inline");
// RM 20240122 BEGIN
        fld = form.addField('custpage_lbllivinginestate', 'label', 'Living in Estate:', null, "financials");
        fld.setLayoutType("normal", "startcol");
        fld = form.addField('custpage_prinestate', 'checkbox', 'PR(s)', null, 'financials');
        fld.setDefaultValue(estate.getFieldValue('custentity_pr_living_in_estate'));
        fld = form.addField('custpage_clientinestate2', 'checkbox', 'Our Client(s)', null, 'financials');
        fld.setDefaultValue(estate.getFieldValue('custentity_client_living_in_estate'));
        fld = form.addField('custpage_heirinestate', 'checkbox', 'Other Heir(s)', null, 'financials');
        fld.setDefaultValue(estate.getFieldValue('custentity_other_heirs_living_in_estate'));
        fld = form.addField('custpage_thirdptyinestate', 'checkbox', 'Third Party(ies)', null, 'financials');
        fld.setDefaultValue(estate.getFieldValue('custentity_third_party_living_in_estate'));
        fld = form.addField('custpage_netassets', 'select', 'Net Assets', "customlist_net_assets", 'financials');
        fld.setDefaultValue(estate.getFieldValue('custentity_estate_net_assets'));
// RM 20240122 END

        var properties = form.addSubList("custpage_properties", "inlineeditor", "Real Properties", "financials");//inlineeditor//list

/*******************************************************************************************
 *******************************************************************************************
 *** If field headers change, they have to be updated in Client Script Snapshot function ***
 *******************************************************************************************
 *******************************************************************************************/
        
        fld = properties.addField("custpage_property_address", "textarea", "Property");
        fld.setDisplayType("entry");
        fld.setDisplaySize("200", "6");
        fld = properties.addField("custpage_property_eventtype", "select", "Listing Status", "customlist_listing_status");
        //fld.setDisplayType("entry");
        fld = properties.addField("custpage_property_value", "integer", "Value");
        fld.setMandatory(true);
        fld.setDisplayType("entry");
        fld = properties.addField("custpage_property_mortgage", "integer", "Mortgage");
        fld.setDisplayType("entry");
        fld = properties.addField("custpage_property_owned", "percent", "% Owned");
        fld.setDefaultValue("100%");
        fld.setDisplayType("entry");
        fld = properties.addField("custpage_property_total", "integer", "Total");
        fld.setDisplayType("entry");
        fld = properties.addField("custpage_property_sold", "checkbox", "Sold?");
        fld = properties.addField("custpage_property_escrow", "checkbox", "Escrow");
        fld = properties.addField("custpage_property_dot", "select", "DOT", "customlist_dot_list");
        fld = properties.addField("custpage_property_dot_subdate", "date", "DOT Submitted");
        fld = properties.addField("custpage_property_dot_recdate", "date", "DOT Recorded");
        fld = properties.addField("custpage_property_lispendens", "checkbox", "Lis Pendens");
        fld = properties.addField("custpage_property_moi", "checkbox", "MOI");
        fld = properties.addField("custpage_property_note", "textarea", "Note");
        fld.setDisplayType("entry");

/*******************************************************************************************
 *******************************************************************************************
 *** If field headers change, they have to be updated in Client Script Snapshot function ***
 *******************************************************************************************
 *******************************************************************************************/
        
        fld = properties.addField("custpage_property_estamount", "integer", "ESTIMATED Value");
        fld.setDisplayType("disabled");
        fld = properties.addField("custpage_property_preforeclosure_status", "select", "Preforeclosure Status", "customlist_preforeclosure_status");
        fld.setDisplayType("entry");
        fld = properties.addField("custpage_property_owner_name", "text", "Owner Name");
        fld.setDisplayType("disabled");
        fld = properties.addField("custpage_property_est_mortage_amt_attom", "currency", "EST MORTGAGE");
        fld.setDisplayType("hidden");
        fld = properties.addField("custpage_property_id", "select", "Property ID", "customrecord_property");
        fld.setDisplayType("hidden");
        fld = properties.addField("custpage_property_auction_date", "text", "Auction Date");
        fld.setDisplayType("hidden");
        fld = properties.addField("custpage_property_salesamount", "currency", "Last Sales Amt");
        fld.setDisplayType("hidden");
        fld = properties.addField("custpage_property_lastsalesdate", "text", "LAST SALE DATE");
        fld.setDisplayType("hidden");
        fld = properties.addField("custpage_property_property_type", "text", "Property Type");
        fld.setDisplayType("hidden");
        fld = properties.addField("custpage_property_apn", "text", "APN");
        fld.setDisplayType("hidden");
        fld = properties.addField("custpage_property_attomerror", "text", "Data pull ERROR");
        fld.setDisplayType("hidden");
        fld = properties.addField("custpage_property_num", "select", "Property Record", "customrecord_property");//text

/*******************************************************************************************
 *******************************************************************************************
 *** If field headers change, they have to be updated in Client Script Snapshot function ***
 *******************************************************************************************
 *******************************************************************************************/
        


        //fld =properties.addField("custpage_property_listingtype", "text", "LISTING TYPE (SWAGGER)");
        // fld.setDisplayType("disabled");
        //fld =properties.addField("custpage_property_eventtype", "text", "EVENT TYPE");
        //fld.setDisplayType("disabled");
        //fld =properties.addField("custpage_property_eventeffective", "text", "EVENT EFFECTIVE DATE");
        //fld.setDisplayType("disabled");
        //fld =properties.addField("custpage_property_lastsalesamount", "text", "LAST SALE AMOUNT");
        //fld.setDisplayType("disabled");
        //fld =properties.addField("custpage_property_swaggererror", "text", "SWAGGER ERROR");
        //fld.setDisplayType("disabled");
        //fld =properties.addField("custpage_property_est_mortage_amt_last_update", "text", "ESTIMATED MORTAGAGE AMOUNT LAST UPDATED");
        //      fld.setDisplayType("disabled");
        if (customerId) {
          var legal_expenes_amouunt = 0;
          var checkSearch = nlapiSearchRecord("transaction", null,
              [
                //  ["type", "anyof", "Check"],
                //   "AND",
                ["account", "anyof", "273"],
                "AND",
                ["custcol_name_check", "anyof", customerId]
              ],
              [
                new nlobjSearchColumn("custcol_name_check", null, "GROUP"),
                new nlobjSearchColumn("amount", null, "SUM")
              ]
          );
          if (checkSearch && checkSearch.length > 0) {
            legal_expenes_amouunt += Number(checkSearch[0].getValue("amount", null, "SUM"));
          }
          var transactionSearch = nlapiSearchRecord("transaction", null,
              [
                ["account", "anyof", "273"],
                "AND",
                ["type", "anyof", "CardChrg", "Deposit", "CustDep"],
                "AND",
                ["name", "anyof", customerId]
              ],
              [
                new nlobjSearchColumn("entity", null, "GROUP"),
                new nlobjSearchColumn("amount", null, "SUM")
              ]
          );
          if (transactionSearch && transactionSearch.length > 0) {
            legal_expenes_amouunt += Number(transactionSearch[0].getValue("amount", null, "SUM"));
          }
          nlapiLogExecution("debug", "legal_expenes_amouunt", legal_expenes_amouunt);
          legal_expenes.setDefaultValue(legal_expenes_amouunt);

        } else if (estateId) {
          var legal_expenes_amouunt = 0;
          var checkSearch = nlapiSearchRecord("transaction", null,
              [
                //  ["type", "anyof", "Check"],
                //   "AND",
                ["account", "anyof", "273"],
                "AND",
                ["custcol_name_check", "anyof", estateId]
              ],
              [
                new nlobjSearchColumn("custcol_name_check", null, "GROUP"),
                new nlobjSearchColumn("amount", null, "SUM")
              ]
          );
          if (checkSearch && checkSearch.length > 0) {
            legal_expenes_amouunt += Number(checkSearch[0].getValue("amount", null, "SUM"));
          }
          var transactionSearch = nlapiSearchRecord("transaction", null,
              [
                ["account", "anyof", "273"],
                "AND",
                ["type", "anyof", "CardChrg", "Deposit", "CustDep"],
                "AND",
                ["name", "anyof", estateId]
              ],
              [
                new nlobjSearchColumn("entity", null, "GROUP"),
                new nlobjSearchColumn("amount", null, "SUM")
              ]
          );
          if (transactionSearch && transactionSearch.length > 0) {
            legal_expenes_amouunt += Number(transactionSearch[0].getValue("amount", null, "SUM"));
          }
          nlapiLogExecution("debug", "legal_expenes_amouunt", legal_expenes_amouunt);
          legal_expenes.setDefaultValue(legal_expenes_amouunt);
        }
        if (estate != null) {
          var filters = [];
          filters.push(new nlobjSearchFilter("custrecord_property_estate", null, "is", estateId));
          var cols = [];
          cols.push(new nlobjSearchColumn("name"));
          cols.push(new nlobjSearchColumn("custrecord_property_value"));
          cols.push(new nlobjSearchColumn("custrecord_property_mortgage"));
          cols.push(new nlobjSearchColumn("custrecord_property_percent_owned"));
          cols.push(new nlobjSearchColumn("custrecord_property_total"));
          cols.push(new nlobjSearchColumn("custrecord_saleamount"));
          cols.push(new nlobjSearchColumn("custrecord_estimatedvalue"));
          // cols.push(new nlobjSearchColumn("custrecord_listingtype"));
          cols.push(new nlobjSearchColumn("custrecord_event_type_new"));
          //cols.push(new nlobjSearchColumn("custrecord_event_effective_date"));
          //cols.push(new nlobjSearchColumn("custrecord_last_sales_date"));
          //cols.push(new nlobjSearchColumn("custrecord_last_sale_valueamount"));
          //cols.push(new nlobjSearchColumn("custrecord_error"));
          cols.push(new nlobjSearchColumn("custrecord_attom_error"));
          cols.push(new nlobjSearchColumn("custrecord_notes"));
          cols.push(new nlobjSearchColumn("custrecord_sold"));
          cols.push(new nlobjSearchColumn("custrecord_escrow"));
          cols.push(new nlobjSearchColumn("custrecord_dot"));
          cols.push(new nlobjSearchColumn("custrecord_property_dot_subdate"));
          cols.push(new nlobjSearchColumn("custrecord_property_dot_recdate"));
          cols.push(new nlobjSearchColumn("custrecord_property_lispendens"));
          cols.push(new nlobjSearchColumn("custrecord_property_moi"));
          cols.push(new nlobjSearchColumn("custrecord_est_mortage_amt_attom"));
          //cols.push(new nlobjSearchColumn("custrecord_swagger_script_last_run_date"));
          //cols.push(new nlobjSearchColumn("custrecord_est_mortage_amt_last_update"));
          cols.push(new nlobjSearchColumn("custrecord_last_sale_date_attom"));
          cols.push(new nlobjSearchColumn("custrecord_preforeclosure_status"));
          cols.push(new nlobjSearchColumn("custrecord_owner_name"));
          cols.push(new nlobjSearchColumn("custrecord_property_type"));
          cols.push(new nlobjSearchColumn("custrecord_apn"));
          cols.push(new nlobjSearchColumn("custrecord_auction_date"));

          var propertyDot;
          var propertyEscrow = "F";
          var propertyLispendens="F";
          var propertyMOI="F";
          var results = nlapiSearchRecord("customrecord_property", null, filters, cols);
          if (results) {
            var lines = [];
            for (var x = 0; x < results.length; x++) {
              var estamount = parseInt(0).toFixed(0);
              if (results[x].getValue("custrecord_estimatedvalue"))
                estamount = parseInt(results[x].getValue("custrecord_estimatedvalue")).toFixed(0);

              if (propertyDot != 1 && propertyDot != 2)
                propertyDot = results[x].getValue("custrecord_dot");
              if (propertyEscrow == "F")
                propertyEscrow = results[x].getValue("custrecord_escrow");
              if(propertyLispendens=="F")
                propertyLispendens=results[x].getValue("custrecord_property_lispendens");
              if(propertyMOI=="F")
                propertyMOI=results[x].getValue("custrecord_property_moi");
              
              lines.push({
                custpage_property_id: results[x].getId(),

                custpage_property_num: results[x].getId(),
                //custpage_property_link: "<a href='/app/common/custom/custrecordentry.nl?rectype=279&id=" + results[x].getId() + "' target='_blank'>View Property</a>",
                custpage_property_address: results[x].getValue("name"),
                custpage_property_value: results[x].getValue("custrecord_property_value"),
                custpage_property_mortgage: results[x].getValue("custrecord_property_mortgage"),
                custpage_property_owned: results[x].getValue("custrecord_property_percent_owned"),
                custpage_property_total: results[x].getValue("custrecord_property_total"),
                custpage_property_salesamount: results[x].getValue("custrecord_saleamount"),
                custpage_property_estamount: estamount,
                // custpage_property_listingtype: results[x].getValue("custrecord_listingtype"),
                //custpage_property_eventeffective: results[x].getValue("custrecord_event_effective_date"),
                custpage_property_lastsalesdate: results[x].getValue("custrecord_last_sale_date_attom"),
                custpage_property_eventtype: results[x].getValue("custrecord_event_type_new"),
                //custpage_property_lastsalesamount: results[x].getValue("custrecord_last_sale_valueamount"),
                custpage_property_est_mortage_amt_attom: results[x].getValue("custrecord_est_mortage_amt_attom"),
                //custpage_property_est_mortage_amt_last_update: results[x].getValue("custrecord_est_mortage_amt_last_update"),
                custpage_property_preforeclosure_status: results[x].getValue("custrecord_preforeclosure_status"),
                custpage_property_auction_date: results[x].getValue("custrecord_auction_date"),
                custpage_property_attomerror: results[x].getValue("custrecord_attom_error"),
                custpage_property_note: results[x].getValue("custrecord_notes"),
                custpage_property_escrow: results[x].getValue("custrecord_escrow"),
                custpage_property_dot: results[x].getValue("custrecord_dot"),
                custpage_property_dot_subdate: results[x].getValue("custrecord_property_dot_subdate"),
                custpage_property_dot_recdate: results[x].getValue("custrecord_property_dot_recdate"),
                custpage_property_lispendens: results[x].getValue("custrecord_property_lispendens"),
                custpage_property_moi: results[x].getValue("custrecord_property_moi"),
                custpage_property_owner_name: results[x].getValue("custrecord_owner_name"),
                custpage_property_property_type: results[x].getValue("custrecord_property_type"),
                custpage_property_apn: results[x].getValue("custrecord_apn"),
                custpage_property_sold: results[x].getValue("custrecord_sold")

              });
            }
            properties.setLineItemValues(lines);
          }
        }
        if (propertyEscrow == "T")
          escrowField.setDefaultValue("T");
        if (propertyDot == 1 || propertyDot == 2)
          dotField.setDefaultValue("T");
        if(propertyLispendens == "T")
          lispenfld.setDefaultValue("T");
        if(propertyMOI == "T")
          moifld.setDefaultValue("T");
        nlapiLogExecution("debug", "Added Properties");

        var accounts = form.addSubList("custpage_accounts", "inlineeditor", "Cash Accounts/Other Assets", "financials");
        accounts.addField("custpage_accounts_name", "text", "Cash Account/Other Asset");
        accounts.addField("custpage_accounts_date", "date", "Date");
        fld = accounts.addField("custpage_accounts_value", "integer", "Value");
        fld.setMandatory(true);
        fld = accounts.addField("custpage_accounts_id", "select", "Account/Asset ID", "customrecord_asset");
        fld.setDisplayType("hidden");

        if (estate != null) {
          var filters = [];
          filters.push(new nlobjSearchFilter("custrecord_asset_estate", null, "is", estateId));
          var cols = [];
          cols.push(new nlobjSearchColumn("name"));
          cols.push(new nlobjSearchColumn("custrecord_asset_date"));
          cols.push(new nlobjSearchColumn("custrecord_asset_value"));
          var results = nlapiSearchRecord("customrecord_asset", null, filters, cols);
          if (results) {
            var lines = [];
            for (var x = 0; x < results.length; x++) {
              lines.push({
                custpage_accounts_id: results[x].getId(),
                custpage_accounts_name: results[x].getValue("name"),
                custpage_accounts_date: results[x].getValue("custrecord_asset_date"),
                custpage_accounts_value: results[x].getValue("custrecord_asset_value")
              });
            }
            accounts.setLineItemValues(lines);
          }
        }

        nlapiLogExecution("debug", "Added Assets");

        var claims = form.addSubList("custpage_claims", "inlineeditor", "Creditor Claims", "financials");
        claims.addField("custpage_claims_name", "text", "Claim Name");
        claims.addField("custpage_claims_date", "date", "Date");
        fld = claims.addField("custpage_claims_value", "integer", "Value");
        fld.setMandatory(true);
        fld = claims.addField("custpage_claim_id", "select", "Claim ID", "customrecord_claim");
        fld.setDisplayType("hidden");

        if (estateId != null) {
          var filters = [];
          filters.push(new nlobjSearchFilter("custrecord_claim_estate", null, "is", estateId));
          var cols = [];
          cols.push(new nlobjSearchColumn("name"));
          cols.push(new nlobjSearchColumn("custrecord_claim_date"));
          cols.push(new nlobjSearchColumn("custrecord_claim_value"));
          var results = nlapiSearchRecord("customrecord_claim", null, filters, cols);
          if (results) {
            var lines = [];
            for (var x = 0; x < results.length; x++) {
              lines.push({
                custpage_claim_id: results[x].getId(),
                custpage_claims_name: results[x].getValue("name"),
                custpage_claims_date: results[x].getValue("custrecord_claim_date"),
                custpage_claims_value: results[x].getValue("custrecord_claim_value")
              });
            }
            claims.setLineItemValues(lines);
          }
        }

        nlapiLogExecution("debug", "Added Claims");

        fld = form.addField("custpage_net_equity_value", "integer", "Net Equity Value of the Estate", null, "sizing");
        fld.setDisplayType("inline");
        fld.setLayoutType("startrow", "startcol");
        fld = form.addField("custpage_percent_equity_due", "percent", "Percent of Estate due to Customer", null, "sizing");
        fld.setLayoutType("startrow", "none");
        if (customer != null && customer.getFieldValue("custentity_percent_estate_due_to_custome") != null && customer.getFieldValue("custentity_percent_estate_due_to_custome") != "") {
          fld.setDefaultValue(customer.getFieldValue("custentity_percent_estate_due_to_custome"));
        } else {
          if (customerId) {
            try {
              nlapiLogExecution("audit", "customerId:" + customerId);
              nlapiSubmitField("customer", customerId, "custentity_percent_estate_due_to_custome", "100%");
            } catch (e) {
              nlapiLogExecution("Error", JSON.stringify(e));
            }
          }
          fld.setDefaultValue("100%");
        }
// RM 20240122 BEGIN
        fld = form.addField("custpage_heirship", 'select', "Customer Heirship", 'customlist_heirship_customer', 'sizing');
        if (customer != null)
          fld.setDefaultValue(customer.getFieldValue('custentity_heirship_customer'));
// RM 20240122 END
        fld = form.addField("custpage_residue_equity_due", "integer", "Residue of Estate due to Customer", null, "sizing");
        fld.setDisplayType("inline");
        fld.setLayoutType("startrow", "none");
        fld = form.addField("custpage_bequest_due", "integer", "Specific Bequest due to Customer", null, "sizing");
        fld.setLayoutType("startrow", "none");
        if (customer != null && customer.getFieldValue("custentity_specific_bequest_due_to_cust") != null && customer.getFieldValue("custentity_specific_bequest_due_to_cust") != "")
          fld.setDefaultValue(customer.getFieldValue("custentity_specific_bequest_due_to_cust"));
        else
          fld.setDefaultValue(0);
        fld = form.addField("custpage_total_due", "integer", "Total Due to Customer from Estate", null, "sizing");
        fld.setDisplayType("inline");
        fld.setLayoutType("startrow", "none");
        fld = form.addField("custpage_liens_judgments", "integer", "Liens and Judgments", null, "sizing");
        fld.setLayoutType("startrow", "none");
        fld.setDefaultValue(0);
        fld.setDisplayType("inline");
        fld = form.addField("custpage_existing_agreements", "integer", "Existing Assignments", null, "sizing");
        fld.setLayoutType("startrow", "none");
        fld.setDefaultValue(0);
        fld.setDisplayType("inline");
        fld = form.addField("custpage_net_due", "integer", "Net due to Customer", null, "sizing");
        fld.setDisplayType("inline");
        fld.setLayoutType("startrow", "none");
        fld = form.addField("custpage_sensitivity_to_10percent", "percent", "Sensitivity to 10% Change in Property Value", null, "sizing");
        fld.setDisplayType("inline");
        fld.setDefaultValue(0);
        fld = form.addField("custpage_adv_to_val_ratio", "percent", "Advance to Value Ratio", null, "sizing");
        fld.setLayoutType("startrow", "none");
        if (customer != null && customer.getFieldValue("custentity_advance_to_value_ratio") != null && customer.getFieldValue("custentity_advance_to_value_ratio") != "")
          fld.setDefaultValue(customer.getFieldValue("custentity_advance_to_value_ratio"));
        else
          fld.setDefaultValue("36%");
        fld = form.addField("custpage_max_advance", "integer", "Maximum Advance Size", null, "sizing");
        fld.setDisplayType("inline");
        fld.setLayoutType("startrow", "none");
        var rebate = form.addField("custpage_rebate", "currency", "Expected Rebate", null, "sizing");
        rebate.setDisplayType("inline");
        var holdback = form.addField("custpage_holdback", "currency", "Holdback Amount", null, "sizing");
        holdback.setDisplayType("inline");

        fld = form.addField("custpage_desired_advance", "integer", "Desired Advance Size", null, "pricing");
        fld.setLayoutType("startrow", "none");
        if (customer != null && customer.getFieldValue("custentity_desired_advance_size") != null && customer.getFieldValue("custentity_desired_advance_size") != "")
          fld.setDefaultValue(customer.getFieldValue("custentity_desired_advance_size"));

        fld = form.addField("custpage_price_level", "select", "Pricing Level", "customrecord_price_option", "pricing");
        fld.setLayoutType("startrow", "none");
        if (customer != null && customer.getFieldValue("custentity_pricing_level") != null && customer.getFieldValue("custentity_pricing_level") != "")
          fld.setDefaultValue(customer.getFieldValue("custentity_pricing_level"));
        else
          fld.setDefaultValue("7");//3

        fld = form.addField("custpage_months_remaining", "float", "Guess of Months Remaining", null, "pricing");
        fld.setLayoutType("startrow", "none");
        //fld.setDisplayType("inline");
        fld.setDefaultValue(18);

        fld = form.addField("custpage_early_rebate_1", "select", "Early Rebate Option 1 (Months)", null, "pricing");
        fld.setLayoutType("normal", "startcol");
        fld.addSelectOption("", "", true);
        fld.addSelectOption("3", "3", false);
        fld.addSelectOption("6", "6", false);
        fld.addSelectOption("9", "9", false);
        fld.addSelectOption("12", "12", false);
        fld.addSelectOption("18", "18", false);
        fld.addSelectOption("24", "24", false);
        if (customer!=null && !isempty(customer.getFieldValue("custentity_early_rebate_option_1")))
          fld.setDefaultValue(customer.getFieldValue("custentity_early_rebate_option_1"));
        else
          fld.setDefaultValue("3");

        fld = form.addField("custpage_early_rebate_2", "select", "Early Rebate Option 2 (Months)", null, "pricing");
        fld.addSelectOption("", "", true);
        fld.addSelectOption("3", "3", false);
        fld.addSelectOption("6", "6", false);
        fld.addSelectOption("9", "9", false);
        fld.addSelectOption("12", "12", false);
        fld.addSelectOption("18", "18", false);
        fld.addSelectOption("24", "24", false);
        if (customer!=null  && !isempty(customer.getFieldValue("custentity_early_rebate_option_2")))
          fld.setDefaultValue(customer.getFieldValue("custentity_early_rebate_option_2"));
        else fld.setDefaultValue("9");

        fld = form.addField("custpage_early_rebate_3", "select", "Early Rebate Option 3 (Months)", null, "pricing");
        fld.addSelectOption("", "", true);
        fld.addSelectOption("3", "3", false);
        fld.addSelectOption("6", "6", false);
        fld.addSelectOption("9", "9", false);
        fld.addSelectOption("12", "12", false);
        fld.addSelectOption("18", "18", false);
        fld.addSelectOption("24", "24", false);
        if (customer!=null && !isempty(customer.getFieldValue("custentity_early_rebate_option_3")))
          fld.setDefaultValue(customer.getFieldValue("custentity_early_rebate_option_3"));
        else
          fld.setDefaultValue("");

        fld = form.addField("custpage_assignment_size", "integer", "Assignment Size", null, "pricing");
        fld.setLayoutType("startrow", "none");

        fld = form.addField("custpage_early_rebate_1_amt", "integer", "Option 1 Pricing", null, "pricing");
        fld.setLayoutType("normal", "startcol");
//        fld = form.addField("custpage_multiplier_1", "text", "Option 1 Multiplier", null, "pricing");
//        fld.setDisplayType("inline");
        fld = form.addField("custpage_early_rebate_2_amt", "integer", "Option 2 Pricing", null, "pricing");
//        fld = form.addField("custpage_multiplier_2", "text", "Option 1 Multiplier", null, "pricing");
//        fld.setDisplayType("inline");
        fld = form.addField("custpage_early_rebate_3_amt", "integer", "Option 3 Pricing", null, "pricing");
//        fld = form.addField("custpage_multiplier_3", "text", "Option 1 Multiplier", null, "pricing");
//        fld.setDisplayType("inline");

        //Get quote button
        var fld = form.addField("custpage_get_quote", "inlinehtml", "Get Quote", null, "pricing");
        fld.setDefaultValue("<input type='button' name='getquote' id='getquote' value='Get Quote' onclick='createQuote();'/>");


        fld = form.addField("custpage_calculated_fee", "currency", "Calculated Fee", null, "temp");
        fld.setDisplayType("hidden");

        fld = form.addField("custpage_rate_of_return", "float", "Rate of Return", null, "temp");
        fld.setDisplayType("hidden");

        //fld = form.addField("custpage_update_case_status","select","Case Status","customlist_case_statuses","case_status");
        //fld = form.addField("custpage_update_case_status_notes","textarea","Case Status Notes",null,"case_status");
        //fld = form.addField("custpage_update_case_status_button","inlinehtml","Update Case Status Button",null,"case_status");
        //fld.setDefaultValue("<input type='button' name='updatecasestatus' id='updatecasestatus' value='Update Case Status' onclick='updateCaseStatus();'/>");

        var priorQuotes = form.addSubList("custpage_prior_quotes", "list", "Prior Quotes", "quotes");
        priorQuotes.addField("custpage_quote_link", "text", "View Quote");
        priorQuotes.addField("custpage_quote_preferred", "checkbox", "Preferred?");
        priorQuotes.addField("custpage_quote_tranid", "text", "Quote #");
        priorQuotes.addField("custpage_quote_salesrep", "text", "Sales Person");
        priorQuotes.addField("custpage_quote_status", "select", "Status", "customlist_quote_status");
        priorQuotes.addField("custpage_quote_date", "date", "Date");
        priorQuotes.addField("custpage_quote_advance", "currency", "Advance");
        priorQuotes.addField("custpage_quote_assignment", "currency", "Assignment");

        priorQuotes.addField("custpage_quote_option_1", "currency", "Option 1");
        priorQuotes.addField("custpage_quote_option_2", "currency", "Option 2");
        priorQuotes.addField("custpage_quote_option_3", "currency", "Option 3");

        priorQuotes.addField("custpage_quote_rebate_1", "currency", "Rebate 1");
        priorQuotes.addField("custpage_quote_rebate_2", "currency", "Rebate 2");
        priorQuotes.addField("custpage_quote_rebate_3", "currency", "Rebate 3");

        priorQuotes.addField("custpage_quote_time_1", "integer", "Time 1");
        priorQuotes.addField("custpage_quote_time_2", "integer", "Time 2");
        priorQuotes.addField("custpage_quote_time_3", "integer", "Time 3");
        fld = priorQuotes.addField("custpage_quote_internalid", "select", "Quote ID", "estimate");
        fld.setDisplayType("hidden");

        priorQuotes.addField("custpage_quote_mail_merge", "text", "Mail Merge");
        priorQuotes.addField("custpage_quote_create_invoice", "text", "Create Invoice");

        if (request.getParameter("customer") != null && request.getParameter("customer") != "") {
          var filters = [];
          filters.push(new nlobjSearchFilter("entity", null, "is", request.getParameter("customer")));
          filters.push(new nlobjSearchFilter("mainline", null, "is", "T"));
          var cols = [];
          cols.push(new nlobjSearchColumn("salesrep"));
          cols.push(new nlobjSearchColumn("trandate"));
          cols.push(new nlobjSearchColumn("tranid"));
          cols.push(new nlobjSearchColumn("custbody_assignment_size"));
          cols.push(new nlobjSearchColumn("custbody_advance_size"));
          cols.push(new nlobjSearchColumn("custbody_rebate_1_month"));
          cols.push(new nlobjSearchColumn("custbody_rebate_2_month"));
          cols.push(new nlobjSearchColumn("custbody_rebate_3_month"));
          cols.push(new nlobjSearchColumn("custbody_rebate_1_amount"));
          cols.push(new nlobjSearchColumn("custbody_rebate_2_amount"));
          cols.push(new nlobjSearchColumn("custbody_rebate_3_amount"));
          cols.push(new nlobjSearchColumn("custbody_option_1_pricing"));
          cols.push(new nlobjSearchColumn("custbody_option_2_pricing"));
          cols.push(new nlobjSearchColumn("custbody_option_3_pricing"));
          cols.push(new nlobjSearchColumn("custbody_quote_status"));
          cols.push(new nlobjSearchColumn("custbody_preferred_quote"));
          cols.push(new nlobjSearchColumn("internalid").setSort(true));
          var results = nlapiSearchRecord("estimate", null, filters, cols);
          if (results) {
            var lines = [];

            for (var x = 0; x < results.length; x++) {
              lines.push({
                custpage_quote_internalid: results[x].getId(),
                custpage_quote_link: "<a href='/app/accounting/transactions/estimate.nl?id=" + results[x].getId() + "' target='_blank'>View Quote</a>",
                custpage_quote_tranid: results[x].getValue("tranid"),
                custpage_quote_salesrep: results[x].getText("salesrep"),
                custpage_quote_status: results[x].getValue("custbody_quote_status"),
                custpage_quote_date: results[x].getValue("trandate"),
                custpage_quote_advance: results[x].getValue("custbody_advance_size"),
                custpage_quote_assignment: results[x].getValue("custbody_assignment_size"),
                custpage_quote_rebate_1: results[x].getValue("custbody_rebate_1_amount"),
                custpage_quote_rebate_2: results[x].getValue("custbody_rebate_2_amount"),
                custpage_quote_rebate_3: results[x].getValue("custbody_rebate_3_amount"),
                custpage_quote_time_1: results[x].getText("custbody_rebate_1_month"),
                custpage_quote_time_2: results[x].getText("custbody_rebate_2_month"),
                custpage_quote_time_3: results[x].getText("custbody_rebate_3_month"),
                custpage_quote_option_1: results[x].getValue("custbody_option_1_pricing"),
                custpage_quote_option_2: results[x].getValue("custbody_option_2_pricing"),
                custpage_quote_option_3: results[x].getValue("custbody_option_3_pricing"),
                custpage_quote_preferred: results[x].getValue("custbody_preferred_quote"),
                custpage_quote_create_invoice: "<input type='button' name='newinvoice' id='newInvoice" + results[x].getId() + "' value='Create Invoice' onclick='createInvoice(" + results[x].getId() + ");'/>",
                custpage_quote_mail_merge: "<input type='button' name='mailmerge' id='mailmerge" + results[x].getId() + "' value='Mail Merge' onclick='mailMerge(" + results[x].getId() + ");'/>"
              });
            }

            priorQuotes.setLineItemValues(lines);
          }
        }

        nlapiLogExecution("debug", "Added Prior Quotes");

        var caseStatus = form.addSubList("custpage_case_status_list", "inlineeditor", "Case Status", "quotes");
        fld = caseStatus.addField("custpage_case_status_id", "select", "Case Status Internal ID", "customrecord_case_status");
        fld.setDisplayType("hidden");
        fld = caseStatus.addField("custpage_case_status_status", "select", "Status", "customlist_case_statuses");
        caseStatus.addField("custpage_case_status_notes", "textarea", "Notes");
        caseStatus.addField("custpage_case_status_timestamp", "text", "Date/Time Updated");
        caseStatus.addField("custpage_case_status_user", "text", "Updated By");
        //caseStatus.addRefreshButton();

        if (request.getParameter("customer") != null && request.getParameter("customer") != "") {
          var filters = [];
          filters.push(new nlobjSearchFilter("custrecord_case_status_customer", null, "is", request.getParameter("customer")));
          var cols = [];
          cols.push(new nlobjSearchColumn("custrecord_case_status_status"));
          cols.push(new nlobjSearchColumn("custrecord_case_status_notes"));
          cols.push(new nlobjSearchColumn("created"));
          cols.push(new nlobjSearchColumn("owner"));
          cols.push(new nlobjSearchColumn("internalid").setSort(true));
          var results = nlapiSearchRecord("customrecord_case_status", null, filters, cols);
          if (results) {
            var lines = [];

            for (var x = 0; x < results.length; x++) {
              lines.push({
                custpage_case_status_id: results[x].getId(),
                custpage_case_status_status: results[x].getValue("custrecord_case_status_status"),
                custpage_case_status_notes: results[x].getValue("custrecord_case_status_notes"),
                custpage_case_status_timestamp: results[x].getValue("created"),
                custpage_case_status_user: results[x].getText("owner")
              });
            }

            caseStatus.setLineItemValues(lines);
          }
          //////// Messages Sublist from chat /////////////////

          var messages = form.addSubList("custpage_messages", "inlineeditor", "Messages", "message");
          fld = messages.addField("custpage_date", "text", "Date");
          fld = messages.addField("custpage_author", "text", "AUTHOR");
          fld = messages.addField("custpage_receipient", "text", "PRIMARY RECIPIENT");
          fld = messages.addField("custpage_body", "textarea", "Body");

          var sms_receipt_Search = nlapiSearchRecord("customrecord_mmsdf_sms_receipt", null,
              [
                ["custrecord_mmsdf_sms_receipt_recpnt_id", "anyof", request.getParameter("customer")]
              ],
              [
                new nlobjSearchColumn("custrecord_mmsdf_sms_receipt_sender"),
                new nlobjSearchColumn("created"),
                new nlobjSearchColumn("custrecord_mmsdf_sms_receipt_message"),
                new nlobjSearchColumn("altname", "CUSTRECORD_MMSDF_SMS_RECEIPT_RECPNT_ID", null),
                new nlobjSearchColumn("custrecord_mmsdf_sms_receipt_msgid")
              ]
          );

          if (sms_receipt_Search) {
            var chatData = [];
            for (var m1 = 0; m1 < sms_receipt_Search.length; m1++) {

              chatData.push({
                custpage_body: sms_receipt_Search[m1].getValue("custrecord_mmsdf_sms_receipt_message"),
                custpage_date: sms_receipt_Search[m1].getValue("created"),
                custpage_author: sms_receipt_Search[m1].getText("custrecord_mmsdf_sms_receipt_sender"),
                custpage_receipient: sms_receipt_Search[m1].getValue("altname", "custrecord_mmsdf_sms_receipt_recpnt_id")
              });
              var id = sms_receipt_Search[m1].getId();
              if (id) {
                var sms_reply_Search = nlapiSearchRecord("customrecord_mmsdf_sms_reply", null,
                    [
                      ["custrecord_mmsdf_reply_smsreceiptid", "anyof", id]
                    ],
                    [
                      new nlobjSearchColumn("custrecord_mmsdf_reply_message"),
                      new nlobjSearchColumn("created")
                    ]
                );
                if (sms_reply_Search) {
                  var smsreplyurl=null;
                  try {
                    smsreplyurl="https://5295340.app.netsuite.com/app/common/custom/custrecordentry.nl?rectype=567&id="+id;
                    var smsmessagebody=sms_reply_Search[0].getValue("custrecord_mmsdf_reply_message");
                    if(smsmessagebody.length>245) {
                      smsmessagebody=smsmessagebody.substr(0,125)+ ' (... see '+smsreplyurl+' for full message)';
                    }
                  } catch(e) {
                    nlapiLogExecution("ERROR", e.name, e.message);
                  }
                  chatData.push({
                    custpage_body: smsmessagebody,
                    custpage_date: sms_reply_Search[0].getValue("created"),
                    custpage_author: sms_receipt_Search[m1].getValue("altname", "custrecord_mmsdf_sms_receipt_recpnt_id"),
                    custpage_receipient: sms_receipt_Search[m1].getText("custrecord_mmsdf_sms_receipt_sender")
                  });
                }
              }

            }
            messages.setLineItemValues(chatData);
          }

          /////////////////////////////////////////////////////
        }

        nlapiLogExecution("debug", "Added Case Statuses");

//                var otherAssignments = form.addSubList("custpage_other_assignments", "inlineeditor", "Assignments Done With Other Companies", "quotes");
        var otherAssignments = form.addSubList("custpage_other_assignments", "inlineeditor", "Past Assignments", "quotes");
        otherAssignments.addField("custpage_other_company", "text", "Advance Company");
        otherAssignments.addField("custpage_other_date", "date", "Date");
        fld = otherAssignments.addField("custpage_other_assignment", "integer", "Assignment");
        fld.setMandatory(true);
        fld = otherAssignments.addField("custpage_assignment_id", "select", "Assignment ID", "customrecord_existing_assignment");
        fld.setDisplayType("hidden");
        fld = otherAssignments.addField("custpage_other_priority", "select", "Priority");
        fld.addSelectOption('', "");
        for (var nI = 1; nI <= 50; nI++)
          fld.addSelectOption(nI, "Priority " + nI);

        var invoice_results = null;
        if (customerId != null) {
          var filters = [];
          filters.push(new nlobjSearchFilter("custrecord_existing_assignment_customer", null, "is", customerId));
          var cols = [];
          cols.push(new nlobjSearchColumn("name"));
          cols.push(new nlobjSearchColumn("custrecord_existing_assignment_priority").setSort());
          cols.push(new nlobjSearchColumn("custrecord_existing_assignment_date").setSort());
          cols.push(new nlobjSearchColumn("custrecord_existing_assignment_amount"));
          cols.push(new nlobjSearchColumn("custrecord_existing_assignment_invoice"));
          var results = nlapiSearchRecord("customrecord_existing_assignment", null, filters, cols);
          var lines = [];
          if (results) {
            pre_priority = 0;
            for (var x = 0; x < results.length; x++) {
              priority = Math.floor(results[x].getValue("custrecord_existing_assignment_priority"));
              if (!priority) {
                priority = parseInt(pre_priority) + 1;
                nlapiSubmitField("customrecord_existing_assignment", results[x].getId(), ['custrecord_existing_assignment_priority'], [priority]);
              }
              pre_priority = priority;
              lines.push({
                custpage_assignment_id: results[x].getId(),
                custpage_other_company: results[x].getValue("name"),
                custpage_other_date: results[x].getValue("custrecord_existing_assignment_date"),
                custpage_other_assignment: results[x].getValue("custrecord_existing_assignment_amount"),
                custpage_other_priority: priority + '' //results[x].getValue("custrecord_existing_assignment_priority")
              });
            }
          }

          filters = [];
          filters.push(new nlobjSearchFilter("entity", null, "is", customerId));
          filters.push(new nlobjSearchFilter("mainline", null, "is", "T"));
          cols = [];
          cols.push(new nlobjSearchColumn("tranid"));
          cols.push(new nlobjSearchColumn("trandate").setSort(true));
          cols.push(new nlobjSearchColumn("amount"));
          cols.push(new nlobjSearchColumn("status"));
          cols.push(new nlobjSearchColumn("custbody_assignment_size"));
          cols.push(new nlobjSearchColumn("custbody_advance_size"));
          cols.push(new nlobjSearchColumn("custbody_date_of_option_1_pricing"));
          cols.push(new nlobjSearchColumn("custbody_date_of_option_2_pricing"));
          cols.push(new nlobjSearchColumn("custbody_date_of_option_3_pricing"));
          cols.push(new nlobjSearchColumn("custbody_rebate_1_amount"));
          cols.push(new nlobjSearchColumn("custbody_rebate_2_amount"));
          cols.push(new nlobjSearchColumn("custbody_rebate_3_amount"));
          cols.push(new nlobjSearchColumn("otherrefnum"));
          cols.push(new nlobjSearchColumn("custbody_assignment_packet"));
          cols.push(new nlobjSearchColumn("custbody_signed_assignment"));
          cols.push(new nlobjSearchColumn("custbody_stamped_assignment"));
          cols.push(new nlobjSearchColumn("custbody_option_1_pricing"));
          cols.push(new nlobjSearchColumn("custbody_option_2_pricing"));
          cols.push(new nlobjSearchColumn("custbody_option_3_pricing"));
          cols.push(new nlobjSearchColumn("custbody_rebate_1_month"));
          cols.push(new nlobjSearchColumn("custbody_rebate_2_month"));
          cols.push(new nlobjSearchColumn("custbody_rebate_3_month"));
          cols.push(new nlobjSearchColumn("internalid"));
          cols.push(new nlobjSearchColumn("custbody_invoice_datefiled"));
          invoice_results = nlapiSearchRecord("invoice", null, filters, cols);

          if (invoice_results) {
            for (var x = invoice_results.length - 1; x >= 0; x--) {
              var exist_check = false,
                  priority = '';
              if (results) {
                for (var y = 0; y < results.length; y++) {
                  if (results[y].getValue('custrecord_existing_assignment_invoice') == invoice_results[x].getId()) {
                    exist_check = true;
                    break;
                  }

                  var g1 = new Date(results[y].getValue('custrecord_existing_assignment_date'));
                  var g2 = new Date(invoice_results[x].getValue('trandate'));
                  if (g1.getTime() <= g2.getTime())
                    priority = results[y].getValue('custrecord_existing_assignment_priority');
                }
              }

              if (!exist_check) {
                var assign_rec = nlapiCreateRecord('customrecord_existing_assignment');
                assign_rec.setFieldValue("name", "Probate Advance #" + invoice_results[x].getValue("tranid"));
                assign_rec.setFieldValue("custrecord_existing_assignment_invoice", invoice_results[x].getId());
                assign_rec.setFieldValue("custrecord_existing_assignment_customer", customerId);
                assign_rec.setFieldValue("custrecord_existing_assignment_estate", estateId);
                assign_rec.setFieldValue("custrecord_existing_assignment_date", invoice_results[x].getValue("trandate"));
                assign_rec.setFieldValue("custrecord_existing_assignment_priority", priority);
                assingment_size = Math.floor(invoice_results[x].getValue("custbody_assignment_size"));
                if (!assingment_size) assingment_size = invoice_results[x].getValue("amount");

                assign_rec.setFieldValue("custrecord_existing_assignment_amount", parseInt(assingment_size));
                assignment_id = nlapiSubmitRecord(assign_rec, true, true);

                lines.push({
                  custpage_assignment_id: assignment_id,
                  //custpage_other_company : "<a href='/app/accounting/transactions/custinvc.nl?id=" + invoice_results[x].getId() + "' target='_blank'>View Invoice</a>&nbsp;&nbsp;"+invoice_results[x].getValue("tranid"),
                  custpage_other_company: "Probate Advance #" + invoice_results[x].getValue("tranid"),
                  custpage_other_date: invoice_results[x].getValue("trandate"),
                  custpage_other_assignment: Math.floor(assingment_size) + '',
                  custpage_other_priority: priority
                });
              }
            }

          }
          otherAssignments.setLineItemValues(lines);
        }

        nlapiLogExecution("debug", "Added Assignments");

//                var leinsJudgments = form.addSubList("custpage_leins_judgements_list", "inlineeditor", "Leins/Judgements", "quotes");
        var leinsJudgments = form.addSubList("custpage_leins_judgements_list", "inlineeditor", "Liens/Judgements", "quotes");
//                leinsJudgments.addField("custpage_lein_judgement_name", "text", "Lein/Judgement");
        leinsJudgments.addField("custpage_lein_judgement_name", "text", "Lien/Judgement");
        leinsJudgments.addField("custpage_lein_judgement_date", "date", "Date");
        fld = leinsJudgments.addField("custpage_lein_judgement_amount", "integer", "Amount");
        fld.setMandatory(true);
//                fld = leinsJudgments.addField("custpage_lein_id", "select", "Lein/Judgement ID", "customrecord_lein_judgement");
        fld = leinsJudgments.addField("custpage_lein_id", "select", "Lien/Judgement ID", "customrecord_lein_judgement");
        fld.setDisplayType("hidden");

        if (customerId != null) {
          var filters = [];
          filters.push(new nlobjSearchFilter("custrecord_lein_judgement_customer", null, "is", customerId));
          var cols = [];
          cols.push(new nlobjSearchColumn("name"));
          cols.push(new nlobjSearchColumn("custrecord_lein_judgement_date"));
          cols.push(new nlobjSearchColumn("custrecord_lein_judgement_amount"));
          var results = nlapiSearchRecord("customrecord_lein_judgement", null, filters, cols);
          if (results) {
            var lines = [];

            for (var x = 0; x < results.length; x++) {
              lines.push({
                custpage_lein_id: results[x].getId(),
                custpage_lein_judgement_name: results[x].getValue("name"),
                custpage_lein_judgement_date: results[x].getValue("custrecord_lein_judgement_date"),
                custpage_lein_judgement_amount: results[x].getValue("custrecord_lein_judgement_amount"),
              });
            }

            leinsJudgments.setLineItemValues(lines);
          }
        }
        nlapiLogExecution("debug", "Added Liens/Judgments");


        var flaggedmsg = nlapiLookupField('customer', estateId, 'custentity_pcl_flag_note');
        nlapiLogExecution('audit', 'flaggedmsg:' + flaggedmsg);

        var phonecalls = form.addSubList("custpage_phonecalls", "inlineeditor", "Phone Calls", "phonecalls");
        fld = phonecalls.addField("custpage_phonecalls_flagmsg", "checkbox", "PCL Msg Flag");
        fld.setDisplaySize(3, 1);
        fld = phonecalls.addField("custpage_phonecalls_title", "text", "Subject");
        fld.setMaxLength(255);
        fld.setMandatory(true);
        fld = phonecalls.addField("custpage_phonecalls_message", "textarea", "Message");
        fld = phonecalls.addField("custpage_phonecalls_phone_number", "phone", "Phone Number");
        fld = phonecalls.addField("custpage_phonecalls_owner", "select", "Organizer", "employee");
        fld = phonecalls.addField("custpage_phonecalls_date", "date", "Date");
        fld = phonecalls.addField("custpage_phonecalls_id", "text", "Activity ID");
        fld.setDisplayType("hidden");

        if (estate != null) {
          var filters = [];
          filters.push(new nlobjSearchFilter("company", null, "is", estateId));
          var cols = [];
          cols.push(new nlobjSearchColumn("title"));
          cols.push(new nlobjSearchColumn("startdate").setSort(true));
          cols.push(new nlobjSearchColumn("assigned"));
          cols.push(new nlobjSearchColumn("phone"));
          cols.push(new nlobjSearchColumn("message"));
          cols.push(new nlobjSearchColumn("internalid").setSort(true));
          var results = nlapiSearchRecord("phonecall", null, filters, cols);
          if (results) {
            var lines = [];
            for (var x = 0; x < results.length; x++) {
              if (x == 0) {
                nextCallFld.setDefaultValue(results[x].getValue("startdate") + " " + results[x].getValue("title"));
              }

              var flagged = "F";
              if (flaggedmsg != '' && flaggedmsg != null && results[x].getId() == flaggedmsg)
                var flagged = "T";
              lines.push({
                custpage_phonecalls_flagmsg: flagged,
                custpage_phonecalls_id: results[x].getId(),
                custpage_phonecalls_title: results[x].getValue("title"),
                custpage_phonecalls_date: results[x].getValue("startdate"),
                custpage_phonecalls_phone_number: results[x].getValue("phone"),
                custpage_phonecalls_owner: results[x].getValue("assigned"),
                custpage_phonecalls_message: results[x].getValue("message")
              });
            }

            phonecalls.setLineItemValues(lines);
          }
        }

        nlapiLogExecution("debug", "Added Phone Calls");

        var events = form.addSubList("custpage_events", "inlineeditor", "Events", "events");
        fld = events.addField("custpage_events_title", "text", "Title");
        fld.setDisplaySize(50);
        fld = events.addField("custpage_events_date", "date", "Date");
        fld = events.addField("custpage_events_id", "text", "Event ID");
        fld.setDisplayType("hidden");

        if (estate != null) {
          var filters = [];
          filters.push(new nlobjSearchFilter("attendee", null, "is", estateId));
          var cols = [];
          cols.push(new nlobjSearchColumn("title"));
          cols.push(new nlobjSearchColumn("startdate").setSort(true));
          cols.push(new nlobjSearchColumn("starttime"));
          cols.push(new nlobjSearchColumn("location"));
          cols.push(new nlobjSearchColumn("endtime"));
          var results = nlapiSearchRecord("calendarevent", null, filters, cols);
          if (results) {
            var lines = [];
            for (var x = 0; x < results.length; x++) {
              if (x == 0) {
                nextEventFld.setDefaultValue(results[x].getValue("startdate") + " " + results[x].getValue("title"));
              }

              lines.push({
                custpage_events_id: results[x].getId(),
                custpage_events_title: results[x].getValue("title"),
                custpage_events_date: results[x].getValue("startdate"),
                custpage_events_location: results[x].getValue("location"),
                custpage_events_start_time: results[x].getValue("starttime"),
                custpage_events_end_time: results[x].getValue("endtime")
              });
            }

            events.setLineItemValues(lines);
          }
        }

        nlapiLogExecution("debug", "Added Events");

        var usernotes = form.addSubList("custpage_user_notes", "list", "User Notes", "usernotes");
        fld = usernotes.addField("custpage_user_notes_author", "text", "Title");
        //fld.setDisplaySize(50);
        fld = usernotes.addField("custpage_user_notes_datetime", "text", "Date/Time");
        fld = usernotes.addField("custpage_user_notes_note", "textarea", "Note");
        fld = usernotes.addField("custpage_user_notes_internalid", "text", "Note Internal ID");
        fld.setDisplayType("hidden");

        if (customerId != null) {
          var filters = [];
          filters.push(new nlobjSearchFilter("internalid", "customer", "is", customerId));
          var cols = [];
          cols.push(new nlobjSearchColumn("author"));
          cols.push(new nlobjSearchColumn("notedate").setSort(true));
          cols.push(new nlobjSearchColumn("note"));
          var results = nlapiSearchRecord("note", null, filters, cols);
          if (results) {
            var lines = [];
            for (var x = 0; x < results.length; x++) {
              lines.push({
                custpage_user_notes_internalid: results[x].getId(),
                custpage_user_notes_author: results[x].getText("author"),
                custpage_user_notes_datetime: results[x].getValue("notedate"),
                custpage_user_notes_note: results[x].getValue("note")
              });
            }

            usernotes.setLineItemValues(lines);
          }
        }

        nlapiLogExecution("debug", "Added User Notes");

        var contacts = form.addSubList("custpage_contacts", "inlineeditor", "Contacts", "relationships");
        contacts.addField("custpage_contacts_name", "text", "Contact");
        contacts.addField("custpage_contacts_job_title", "text", "Job Title");
        contacts.addField("custpage_contacts_email", "text", "Email");
        contacts.addField("custpage_contacts_phone", "text", "Main Phone");
        //contacts.addField("custpage_contacts_law_firm","text","Law Firm");
        contacts.addField("custpage_contacts_role", "text", "Role");
        fld = contacts.addField("custpage_contacts_id", "text", "Contact ID");
        fld.setDisplayType("hidden");

        if (estate != null) {
          var filters = [];
          filters.push(new nlobjSearchFilter("internalid", "company", "is", estateId));
          var cols = [];
          cols.push(new nlobjSearchColumn("jobtitle"));
          cols.push(new nlobjSearchColumn("phone"));
          cols.push(new nlobjSearchColumn("email"));
          cols.push(new nlobjSearchColumn("custentity_law_firm"));
          cols.push(new nlobjSearchColumn("role"));
          cols.push(new nlobjSearchColumn("entityid"));
          var results = nlapiSearchRecord("contact", null, filters, cols);
          if (results) {
            var lines = [];
            for (var x = 0; x < results.length; x++) {
              lines.push({
                custpage_contacts_id: results[x].getId(),
                custpage_contacts_name: results[x].getValue("entityid"),
                custpage_contacts_job_title: results[x].getValue("jobtitle"),
                custpage_contacts_phone: results[x].getValue("phone"),
                custpage_contacts_email: results[x].getValue("email"),
                custpage_contacts_role: results[x].getText("role"),
                custpage_contacts_law_firm: results[x].getValue("custentity_law_firm")
              });
            }
            contacts.setLineItemValues(lines);
          }
        }

        nlapiLogExecution("debug", "Added Contacts");

        //Jurisdiction Tab
        fld = form.addField("custpage_jurisdiction_county", "select", "County", "customrecord173", "jurisdiction");
        if (estate != null)
          fld.setDefaultValue(estate.getFieldValue("custentity2"));

        var county = null;
        if (estate != null && estate.getFieldValue("custentity2") != null && estate.getFieldValue("custentity2") != "")
          county = nlapiLookupField("customrecord173", estate.getFieldValue("custentity2"), ["custrecord_county_pleading_title", "custrecord_county_address_of_court", "custrecord_county_court_phone_number", "custrecord_county_court_name", "custrecord_court_street_address", "custrecord_court_city", "custrecord_court_state", "custrecord_court_zip", "custrecord_county_court_url"]);

        fld = form.addField("custpage_jurisdiction_pleading_title", "textarea", "Pleading Title", null, "jurisdiction");
        if (county != null)
          fld.setDefaultValue(county.custrecord_county_pleading_title);

        fld = form.addField("custpage_jurisdiction_court_name", "text", "Court Name", null, "jurisdiction");
        if (county != null)
          fld.setDefaultValue(county.custrecord_county_court_name);

        fld = form.addField("custpage_jurisdiction_court_address", "text", "Court Address", null, "jurisdiction");
        if (county != null)
          fld.setDefaultValue(county.custrecord_court_street_address);

        fld = form.addField("custpage_jurisdiction_court_city", "text", "Court City", null, "jurisdiction");
        if (county != null)
          fld.setDefaultValue(county.custrecord_court_city);

        fld = form.addField("custpage_jurisdiction_court_state", "text", "Court State", null, "jurisdiction");
        if (county != null)
          fld.setDefaultValue(county.custrecord_court_state);

        fld = form.addField("custpage_jurisdiction_court_zip", "text", "Court Zip Code", null, "jurisdiction");
        if (county != null)
          fld.setDefaultValue(county.custrecord_court_zip);

        fld = form.addField("custpage_jurisdiction_court_phone", "text", "Court Phone Number", null, "jurisdiction");
        if (county != null)
          fld.setDefaultValue(county.custrecord_county_court_phone_number);

        fld = form.addField("custpage_jurisdiction_court_url", "inlinehtml", "Court URL", null, "jurisdiction");
        var urlvalue;
        if (county != null) {
          if (county.custrecord_county_court_url != null && county.custrecord_county_court_url != '') {
            urlvalue = '<a target="_blank" href="' + county.custrecord_county_court_url + '">Link To Court Handling The Case</a>';
          } else {
            urlvalue = '<a target="_blank" href="/app/common/custom/custrecordentry.nl?rectype=173&id=' + estate.getFieldValue("custentity2") + '&e=T"><h2><font color="red">Please Configure Court URL For This County</font></h2></a>';
          }
        } else {
          urlvalue = 'Please select a county.';
        }
        fld.setDefaultValue(urlvalue);

        nlapiLogExecution("debug", "Set Justification Tab...");

        var fld = form.addField("custpage_invoices_total_assignments", "currency", "Total Assignments", null, "invoices");
        fld.setDisplayType("inline");
        var invoiceList = form.addSubList("custpage_invoice_list", "list", "Invoices", "invoices");
        invoiceList.addField("custpage_invoice_link", "text", "View Invoice");
        invoiceList.addField("custpage_invoice_tranid", "text", "Invoice Number");
        invoiceList.addField("custpage_invoice_status", "text", "Invoice Status");
        invoiceList.addField("custpage_invoice_po", "text", "PO/Check #");
        invoiceList.addField("custpage_invoice_date", "date", "Date");
        invoiceList.addField("custpage_invoice_advance", "currency", "Advance Amount");
        invoiceList.addField("custpage_invoice_amount", "currency", "Invoice Amount");
        invoiceList.addField("custpage_invoice_rebate_1", "currency", "Option 1 Pricing");
        invoiceList.addField("custpage_invoice_time_1", "date", "Date of Option 1 Pricing");
        invoiceList.addField("custpage_invoice_rebate_2", "currency", "Option 2 Pricing");
        invoiceList.addField("custpage_invoice_time_2", "date", "Date of Option 2 Pricing");
        invoiceList.addField("custpage_invoice_rebate_3", "currency", "Option 3 Pricing");
        invoiceList.addField("custpage_invoice_time_3", "date", "Date of Option 3 Pricing");
        invoiceList.addField("custpage_invoice_assignment", "currency", "Total Assignment Size");
        invoiceList.addField("custpage_invoice_attach", "text", "Attach Assignment");
        //invoiceList.addField("custpage_invoice_assignment_packet","text","Assignment Packet");
        //invoiceList.addField("custpage_invoice_signed_assignment","text","Signed Assignment");
        fld = invoiceList.addField("custpage_invoice_datefiled", "date", "Date Filed");
        fld.setDisplayType('entry');
        invoiceList.addField("custpage_invoice_stamped_assignment", "text", "Stamped Assignment");
        fld = invoiceList.addField("custpage_invoice_internalid", "select", "Invoice ID", "invoice");
        fld.setDisplayType("hidden");
        var paydate = estate.getFieldValue("custentity_est_date_of_distribution");

        nlapiLogExecution("debug", "Created Invoice Sublist");

        if (customerId != null && customerId != "") {

          if (invoice_results) {
            var lines = [];
            var total = 0;
            for (var x = 0; x < invoice_results.length; x++) {
              var trandate = invoice_results[x].getValue("trandate");
              if (paydate) {
                var daydiff = daysdiff(trandate, paydate);
                var n = Number(daydiff / (365 / 12));
                //  nlapiLogExecution("debug", "daydiff"+n,JSON.stringify(invoice_results[x]));
                var d = invoice_results[x].getValue("custbody_advance_size");
                var e = invoice_results[x].getValue("amount");
                var f = invoice_results[x].getValue("custbody_option_1_pricing");
                var g = invoice_results[x].getValue("custbody_rebate_1_month") ? invoice_results[x].getText("custbody_rebate_1_month") : 0;
                var h = invoice_results[x].getValue("custbody_option_2_pricing");
                var i = invoice_results[x].getValue("custbody_rebate_2_month") ? invoice_results[x].getText("custbody_rebate_2_month") : 0;
                var j = invoice_results[x].getValue("custbody_option_3_pricing");
                var k = invoice_results[x].getValue("custbody_rebate_3_month") ? invoice_results[x].getText("custbody_rebate_3_month") : 0;
                nlapiLogExecution("debug", "amount" + n, 'd=' + d + 'e=' + e + 'f=' + f + '=' + g + 'h=' + h + 'i=' + i + 'k=' + k);
                var amount = (f == 0 || f == '' || f == null) ? 0 : n < g ? (f - e) : (h == 0 || h == '' || h == null) ? 0 : n < i ? (h - e) : (j == 0 || j == '' || j == null) ? 0 : (n < k) ? (j - e) : 0;
                // nlapiLogExecution("debug", "amount"+g,amount);
                total = Number(total) + amount
              }
              lines.push({
                custpage_invoice_internalid: invoice_results[x].getId(),
                custpage_invoice_link: "<a href='/app/accounting/transactions/custinvc.nl?id=" + invoice_results[x].getId() + "' target='_blank'>View Invoice</a>",
                custpage_invoice_tranid: invoice_results[x].getValue("tranid"),
                custpage_invoice_status: invoice_results[x].getValue("status"),
                custpage_invoice_amount: invoice_results[x].getValue("amount"),
                custpage_invoice_po: invoice_results[x].getValue("otherrefnum"),
                custpage_invoice_date: invoice_results[x].getValue("trandate"),
                custpage_invoice_advance: invoice_results[x].getValue("custbody_advance_size"),
                custpage_invoice_assignment: invoice_results[x].getValue("custbody_assignment_size"),
                custpage_invoice_rebate_1: invoice_results[x].getValue("custbody_option_1_pricing"),
                custpage_invoice_rebate_2: invoice_results[x].getValue("custbody_option_2_pricing"),
                custpage_invoice_rebate_3: invoice_results[x].getValue("custbody_option_3_pricing"),
                custpage_invoice_time_1: invoice_results[x].getText("custbody_date_of_option_1_pricing"),
                custpage_invoice_time_2: invoice_results[x].getText("custbody_date_of_option_2_pricing"),
                custpage_invoice_time_3: invoice_results[x].getText("custbody_date_of_option_3_pricing"),
                custpage_invoice_stamped_assignment: invoice_results[x].getText("custbody_stamped_assignment"),
                custpage_invoice_attach: "<input type='button' name='attachAssignment" + invoice_results[x].getId() + "' id='attachAssignment" + invoice_results[x].getId() + "' value='Attach Assignment' onclick='attachAssignment(" + invoice_results[x].getId() + ");'/>",
                custpage_invoice_datefiled: invoice_results[x].getValue("custbody_invoice_datefiled"),
              });
            }

            invoiceList.setLineItemValues(lines);
          }
        }
        nlapiLogExecution("debug", "total", total);
        if (total && customerId) {
          rebate.setDefaultValue(total);
          nlapiSubmitField("customer", customerId, ['custentity_rebate'], [total]);
        } else if (customerId) {
          rebate.setDefaultValue(0);
          nlapiSubmitField("customer", customerId, ['custentity_rebate'], [0]);
        }
        var holdbackamt = 0;
        if (customer != null)
          holdbackamt = customer.getFieldValue('custentity_invoiceholdback') || 0;
        holdback.setDefaultValue(holdbackamt);
        var followupList = form.addSubList("custpage_followup_list", "inlineeditor", "Follow Up", "followup");
        fld = followupList.addField("custpage_followup_id", "text", "Title");
        fld.setDisplayType("hidden");
        fld = followupList.addField("custpage_followup_title", "text", "Title");
        fld.setDisplayType("disabled");
        fld = followupList.addField("custpage_followup_customer", "text", "Customer");
        fld.setDisplayType("disabled");
        fld = followupList.addField("custpage_followup_phone", "text", "Phone");
        fld.setDisplayType("disabled");
        fld = followupList.addField("custpage_followup_date", "text", "Date");
        fld.setDisplayType("disabled");
        fld = followupList.addField("custpage_followup_note", "textarea", "Note");
        fld.setDisplayType("disabled");
        fld = followupList.addField("custpage_followup_completed", "checkbox", "Completed");
        fld.setDisplayType("disabled");
        fld = followupList.addField("custpage_followup_completed_date", "text", "Completed Date");
        fld.setDisplayType("disabled");
        fld = followupList.addField("custpage_followup_assinged", "select", "Assigned", 'employee');
        fld = followupList.addField("custpage_followup_completedby", "select", "Completed by", 'employee');

        if (customerId) {
          var filters = [];
          filters.push(new nlobjSearchFilter("custrecord_followup_customer", null, "anyof", customerId));
          var cols = [];
          cols.push(new nlobjSearchColumn("custrecord_followup_customer"));
          cols.push(new nlobjSearchColumn("custrecord_followup_date").setSort(true));
          cols.push(new nlobjSearchColumn("custrecord_followup_phone"));
          cols.push(new nlobjSearchColumn("custrecord_followup_title"));
          cols.push(new nlobjSearchColumn("custrecord_followup_note"));
          cols.push(new nlobjSearchColumn("custrecord_complete_date"));
          cols.push(new nlobjSearchColumn("custrecord_assigned"));
          cols.push(new nlobjSearchColumn("custrecord_followup_completed"));
          cols.push(new nlobjSearchColumn("custrecord_followup_completedby"));


          var results = nlapiSearchRecord("customrecord_customer_follow_up", null, filters, cols);
          if (results) {
            var lines = [];
            for (var x = 0; x < results.length; x++) {
              lines.push({
                custpage_followup_id: results[x].id,
                custpage_followup_title: results[x].getValue('custrecord_followup_title'),
                custpage_followup_customer: results[x].getText("custrecord_followup_customer"),
                custpage_followup_phone: results[x].getValue("custrecord_followup_phone"),
                custpage_followup_date: results[x].getValue("custrecord_followup_date"),
                custpage_followup_note: results[x].getValue("custrecord_followup_note"),
                custpage_followup_assinged: results[x].getValue("custrecord_assigned"),
                custpage_followup_completed_date: results[x].getValue("custrecord_complete_date"),
                custpage_followup_completed: results[x].getValue("custrecord_followup_completed"),
                custpage_followup_completedby: results[x].getValue("custrecord_followup_completedby")
              });
            }
            followupList.setLineItemValues(lines);
          }
        }

        nlapiLogExecution("debug", "Created Invoice Sublist DATA");

        if (estateId != null && estateId != "") {
          form.addTab("custpage_create_box_subtab", "Documents");
          fld = form.addField("custpage_box_frame_new", "inlinehtml", "Frame", null, "custpage_create_box_subtab");

          nlapiLogExecution("debug", "Added Box Subtab");

// RM PRO-272 BEGIN
//          var boxfolderid = 0;
//          var rs = nlapiSearchRecord(
//              "customrecord_box_record_folder",
//              null,
//              [["custrecord_ns_record_id", "is", estateId]],
//              [new nlobjSearchColumn("custrecord_box_record_folder_id")]
//          );
//          if (rs) {
//            boxfolderid = rs[0].getValue('custrecord_box_record_folder_id');
//            nlapiLogExecution('debug', 'boxfolderid:' + boxfolderid);
//          }
//          if (boxfolderid > 0) {
//            var frame_url = 'https://probateadvancellc.app.box.com/embed/folder/' + boxfolderid;
//          } else {
          // Original code BEGIN
//            var frame_url = nlapiResolveURL("SUITELET", "customscript_box_client", "customdeploy_box_client");
          var frame_url = nlapiResolveURL("SUITELET", "customscript_box_app_client_ss21", "customdeploy_box_app_client_ss21");
          frame_url += "&record_id=" + estateId + "&record_type=customer";
          // Original code END
//          }
// RM PRO-272 END 

          nlapiLogExecution("debug", "frame_url", frame_url);

          var content = '<iframe id="boxnet_widget_frame" src="' + frame_url + '" align="center" style="width: 100%; height:600px; margin:0; border:0; padding:0" frameborder="0"></iframe>';
          fld.setDefaultValue(content);

          nlapiLogExecution("debug", "Added default value to field");
        }


        //Added the Buttons based on the Customer Load..
        if (estate != null && estateId != null && estateId != "") {

          //Check if the customer and Estate is also Loaded.....
          if (customer != null && customerId != null && customerId != '' && estate != null && estateId != null && estateId != "") {

            var isestateInactive = estate.getFieldValue("isinactive");
            nlapiLogExecution("debug", "isestateInactive", 'isestateInactive--' + isestateInactive);

            var oneInactive = false;
            //If the customer is also loaded then add both the buttons....
            var isChildInactive = customer.getFieldValue("isinactive");
            nlapiLogExecution("debug", "isChildInactive", 'isChildInactive--' + isChildInactive);
            if (isChildInactive == 'F') {
              //Adding delete button...
              form.addButton('custpage_deletecustomer', 'Delete Customer', 'DeleteCustomer();');
            } else {
              oneInactive = true;
            }

            if (isestateInactive == 'F') {
              //Adding delete button...
              form.addButton('custpage_deleteestate', 'Delete Estate', 'DeleteEstate();');
            } else {
              oneInactive = true;
            }
            form.addButton('custpage_remindercustomer', 'Follow Up', 'Customerreminder();');
            form.addButton('custpage_conversations', 'Conversations', 'Conversations();');

            if (oneInactive) {
              //Adding delete button...
              form.addSubmitButton("Recover");
            }
          } else if ((customer == null && (customerId == null || customerId == '')) && estate != null && estateId != null && estateId != "") {

            //Condition where only the estate is loaded....
            var isestateInactive = estate.getFieldValue("isinactive");
            nlapiLogExecution("debug", "isestateInactive", 'isestateInactive--' + isestateInactive);

            if (isestateInactive == 'T') {
              //Adding delete button...
              form.addSubmitButton("Recover");
            } else {
              //Adding delete button...
              form.addSubmitButton("Delete Estate");
            }
          }
        }
        //Check if the customer only Loaded.....
        if (customer != null && customerId != null && customerId != '' && (estate == null && (estateId == null || estateId == ''))) {

          //If the customer is also loaded then add both the buttons....
          var isChildInactive = customer.getFieldValue("isinactive");
          nlapiLogExecution("debug", "isChildInactive", 'isChildInactive--' + isChildInactive);
          if (isChildInactive == 'T') {
            //Adding delete button...
            form.addSubmitButton("Recover");
          } else {
            //Adding delete button...
            form.addSubmitButton("Delete Customer");
          }
        }
        response.writePage(form);
      }
    } catch (err) {
      nlapiLogExecution("error", "Error Showing Customer Application", "Details: " + err.message + " " + JSON.stringify(err));
    }
  } else {

    //Added condition to delete the customer record...
    if (request.getParameter('submitter') == 'Delete Customer' || request.getParameter('submitter') == 'Recover' || request.getParameter('submitter') == 'Delete Estate') {

      try {
        //check if customer id is there if it then check for the transactions...

        if (request.getParameter('submitter') == 'Recover') {
          try {

            var customerId = request.getParameter('custpage_estate');
            nlapiLogExecution("debug", "customerId " + JSON.stringify(customerId));

            //  nlapiDeleteRecord('customer',customerId);
            var loadCustomer = nlapiLoadRecord('customer', customerId);
            loadCustomer.setFieldValue('isinactive', 'F');
            loadCustomer.setFieldValue('custentity_date_inactivted', null);
            var customeridsub = nlapiSubmitRecord(loadCustomer);


            //Activate the Customer record....
            var childRecords = searchChildRecords(customerId);
            nlapiLogExecution("debug", "Customer recoverd" + JSON.stringify(childRecords));
            if (childRecords && childRecords.length > 0) {
              for (var itr = 0; itr < childRecords.length; itr++) {
                nlapiSubmitField('customer', childRecords[itr], 'isinactive', 'F');
                nlapiSubmitField('customer', childRecords[itr], 'custentity_date_inactivted', null);
                nlapiLogExecution("debug", "Customer recoverd" + childRecords[itr]);
              }
            }

            nlapiLogExecution('DEBUG', 'Customer Actiavted', 'Customer Actiavted-' + childRecords)
            var form = nlapiCreateForm('Customer Activated');
            var fld = form.addField('custpage_exception', 'textarea', 'Exception Details');
            fld.setDefaultValue('Customer Restored Successfully');
            fld.setDisplayType('inline');
            form.addButton('custpage_closebutton', 'Close', 'window.close();');
            response.writePage(form);

          } catch (err) {
            nlapiLogExecution("error", "Error Showing Customer Application", "Details: " + err.message);
            var form = nlapiCreateForm('Exception Form');
            var fld = form.addField('custpage_exception', 'textarea', 'Exception Details');
            fld.setDefaultValue(err.message);
            fld.setDisplayType('inline');
            form.addButton('custpage_closebutton', 'Close', 'window.close();');
            response.writePage(form);
          }

        } else if (request.getParameter('submitter') == 'Delete Estate') {

          var estateid = request.getParameter('custpage_estate');
          nlapiLogExecution("debug", "Delete Estate ", 'estateid--' + estateid);

          var childRecords = searchChildRecords(estateid);
          childRecords.push(customerId);
          nlapiLogExecution("debug", "In delete Customer --" + JSON.stringify(childRecords));
          var hasTransactions = searchTransactionForCustomer(childRecords);
          nlapiLogExecution("debug", "In delete Customer has transactions --" + hasTransactions);
          if (hasTransactions) {

            var form = nlapiCreateForm('Exception Form');
            var fld = form.addField('custpage_exception', 'textarea', 'Exception Details');
            fld.setDefaultValue('Customer or Estate Cannot be Deleted - It has Linked Transactions');
            fld.setDisplayType('inline');
            form.addButton('custpage_closebutton', 'Close', 'window.close();');
            response.writePage(form);

          } else {
            try {

              nlapiLogExecution("debug", "Deletion Inactivation Started Inactivated --");

              //Activate the Customer record....
              var childRecordsIDs = searchChildRecords(estateid);
              if (childRecordsIDs && childRecordsIDs.length > 0) {
                for (var ir = 0; ir < childRecordsIDs.length; ir++) {
                  nlapiLogExecution("debug", "looping --" + ir);
                  nlapiLogExecution("debug", "Custimer Inactivated --" + childRecordsIDs[ir]);
                  var loadCustomer = nlapiLoadRecord('customer', childRecordsIDs[ir]);
                  loadCustomer.setFieldValue('custentity_date_inactivted', new Date());
                  loadCustomer.setFieldValue('isinactive', 'T');
                  var customeridsub = nlapiSubmitRecord(loadCustomer);
                  nlapiLogExecution("debug", "Custimer Inactivated --" + customeridsub);
                }
              }

              nlapiLogExecution("debug", "Child Deletion Inactivation Ended Inactivated --");

              //  nlapiDeleteRecord('customer',customerId);
              var loadCustomer = nlapiLoadRecord('customer', estateid);
              loadCustomer.setFieldValue('isinactive', 'T');
              loadCustomer.setFieldValue('custentity_date_inactivted', new Date());
              var customeridsub = nlapiSubmitRecord(loadCustomer);

              nlapiLogExecution('DEBUG', 'Customer Inactivated', 'Customer Inactivated-' + customeridsub)
              var form = nlapiCreateForm('Customer Deleted');
              var fld = form.addField('custpage_exception', 'textarea', 'Exception Details');
              fld.setDefaultValue('Customer Deleted Successfully');
              fld.setDisplayType('inline');
              form.addButton('custpage_closebutton', 'Close', 'window.close();');
              response.writePage(form);

            } catch (err) {
              nlapiLogExecution("error", "Error Showing Customer Application", "Details: " + err.message);
              var form = nlapiCreateForm('Exception Form');
              var fld = form.addField('custpage_exception', 'textarea', 'Exception Details');
              fld.setDefaultValue(err.message);
              fld.setDisplayType('inline');
              form.addButton('custpage_closebutton', 'Close', 'window.close();');
              response.writePage(form);
            }
          }
        } else if (request.getParameter('submitter') == 'Delete Customer') {


          var customerId = request.getParameter('custpage_customer_id');
          nlapiLogExecution("debug", "customerId " + JSON.stringify(customerId));

          var hasTransactions = searchTransactionForCustomer(customerId);
          nlapiLogExecution("debug", "In delete Customer has transactions --" + hasTransactions);

          if (hasTransactions) {

            var form = nlapiCreateForm('Exception Form');
            var fld = form.addField('custpage_exception', 'textarea', 'Exception Details');
            fld.setDefaultValue('Customer or Estate Cannot be Deleted - It has Linked Transactions');
            fld.setDisplayType('inline');
            form.addButton('custpage_closebutton', 'Close', 'window.close();');
            response.writePage(form);

          } else {

            //  nlapiDeleteRecord('customer',customerId);
            var loadCustomer = nlapiLoadRecord('customer', customerId);
            loadCustomer.setFieldValue('isinactive', 'T');
            loadCustomer.setFieldValue('custentity_date_inactivted', new Date());
            var customeridsub = nlapiSubmitRecord(loadCustomer);

            nlapiLogExecution('DEBUG', 'Customer Inactivated', 'Customer Inactivated-' + customeridsub)
            var form = nlapiCreateForm('Customer Deleted');
            var fld = form.addField('custpage_exception', 'textarea', 'Exception Details');
            fld.setDefaultValue('Customer Deleted Successfully');
            fld.setDisplayType('inline');
            form.addButton('custpage_closebutton', 'Close', 'window.close();');
            response.writePage(form);

          }
        }
      } catch (e) {

        var form = nlapiCreateForm('Exception Form');
        var fld = form.addField('custpage_exception', 'textarea', 'Exception Details');
        fld.setDefaultValue(JSON.stringify(e));
        fld.setDisplayType('inline');
        form.addButton('custpage_closebutton', 'Close', 'window.close();');
        response.writePage(form);


      }
    } else {

      //Create estate (if none selected)
      if (request.getParameter("custpage_estate") == null || request.getParameter("custpage_estate") == "") {
        var estate = nlapiCreateRecord("customer");
        estate.setFieldValue("isperson", "F");
        estate.setFieldValue("companyname", request.getParameter("custpage_decedent"));
        estate.setFieldValue("custentity1", request.getParameter("custpage_case_no"));
        estate.setFieldValue("custentity3", request.getParameter("custpage_estate_state"));
        estate.setFieldValue("custentity2", request.getParameter("custpage_estate_county"));
        var estateId = nlapiSubmitRecord(estate, true, true);
      } else {
        var estate = nlapiLoadRecord("customer", request.getParameter("custpage_estate"));
        estate.setFieldValue("companyname", request.getParameter("custpage_decedent"));
        estate.setFieldValue("custentity1", request.getParameter("custpage_case_no"));
        estate.setFieldValue("custentity3", request.getParameter("custpage_estate_state"));
        estate.setFieldValue("custentity2", request.getParameter("custpage_estate_county"));
        var estateId = nlapiSubmitRecord(estate, true, true);
      }

      //Create new customer record (sub-record of estate)
      var customer = nlapiCreateRecord("customer");
      customer.setFieldValue("isperson", "T");
      customer.setFieldValue("firstname", request.getParameter("custpage_first_name"));
      customer.setFieldValue("lastname", request.getParameter("custpage_last_name"));
      customer.setFieldValue("email", request.getParameter("custpage_email"));
      customer.setFieldValue("phone", request.getParameter("custpage_phone"));
      customer.setFieldValue("leadsource", request.getParameter("custpage_how_did_they_find_us"));
      customer.setFieldValue("leadsource", customerId);
      var customerId = nlapiSubmitRecord(customer, true, true);

      //Create new user note if notes are populated
      if (request.getParameter("custpage_notes") != null && request.getParameter("custpage_notes") != "") {
        var userNote = nlapiCreateRecord("note");
        userNote.setFieldValue("note", request.getParameter("custpage_notes"));
        userNote.setFieldValue("entity", customerId);
        nlapiSubmitRecord(userNote, true, true);
      }

      //Create property records
      for (var x = 0; x < request.getParameter("custpage_properties"); x++) {
        if (request.getLineItemValue("custpage_properties", "custpage_property_id", x + 1) != null && request.getLineItemValue("custpage_properties", "custpage_property_id", x + 1) != null)
          var property = nlapiLoadRecord("customrecord_property", request.getLineItemValue("custpage_properties", "custpage_property_id", x + 1));
        else
          var property = nlapiCreateRecord("customrecord_property");

        property.setFieldValue("name", request.getLineItemValue("custpage_properties", "custpage_property_address", x + 1));
        property.setFieldValue("custrecord_property_value", request.getLineItemValue("custpage_properties", "custpage_property_value", x + 1));
        property.setFieldValue("custrecord_property_mortgage", request.getLineItemValue("custpage_properties", "custpage_property_mortgage", x + 1));
        property.setFieldValue("custrecord_property_percent_owned", request.getLineItemValue("custpage_properties", "custpage_property_owned", x + 1));
        property.setFieldValue("custrecord_property_total", request.getLineItemValue("custpage_properties", "custpage_property_total", x + 1));
        propertyId = nlapiSubmitRecord(property, true, true);
      }

      //Create asset records
      for (var x = 0; x < request.getParameter("custpage_accounts"); x++) {
        if (request.getLineItemValue("custpage_accounts", "custpage_accounts_id", x + 1) != null && request.getLineItemValue("custpage_accounts", "custpage_accounts_id", x + 1) != null)
          var asset = nlapiLoadRecord("customrecord_asset", request.getLineItemValue("custpage_accounts", "custpage_accounts_id", x + 1));
        else
          var asset = nlapiCreateRecord("customrecord_asset");

        asset.setFieldValue("name", request.getLineItemValue("custpage_accounts", "custpage_accounts_name", x + 1));
        asset.setFieldValue("custrecord_asset_date", request.getLineItemValue("custpage_accounts", "custpage_accounts_date", x + 1));
        asset.setFieldValue("custrecord_asset_value", request.getLineItemValue("custpage_accounts", "custpage_accounts_value", x + 1));
        asset.setFieldValue("custrecord_asset_estate", estateId);
        assetId = nlapiSubmitRecord(asset, true, true);
      }

      //Create claim records
      for (var x = 0; x < request.getParameter("custpage_claims"); x++) {
        if (request.getLineItemValue("custpage_claims", "custpage_claims_id", x + 1) != null && request.getLineItemValue("custpage_claims", "custpage_claims_id", x + 1) != null)
          var claims = nlapiLoadRecord("customrecord_claim", request.getLineItemValue("custpage_claims", "custpage_claims_id", x + 1));
        else
          var claims = nlapiCreateRecord("customrecord_claim");

        claims.setFieldValue("name", request.getLineItemValue("custpage_claims", "custpage_claims_name", x + 1));
        claims.setFieldValue("custrecord_asset_date", request.getLineItemValue("custpage_claims", "custpage_claims_date", x + 1));
        claims.setFieldValue("custrecord_asset_value", request.getLineItemValue("custpage_claims", "custpage_claims_value", x + 1));
        claims.setFieldValue("custrecord_asset_estate", estateId);
        claimsId = nlapiSubmitRecord(claims, true, true);
      }

      //Create quote
      var quote = nlapiTransformRecord("customer", customerId, "estimate");
      quote.setFieldValue("custbody_rebate_1_month", request.getParameter("custpage_early_rebate_1"));
      quote.setFieldValue("custbody_rebate_2_month", request.getParameter("custpage_early_rebate_2"));
      quote.setFieldValue("custbody_rebate_3_month", request.getParameter("custpage_early_rebate_3"));
      quote.setFieldValue("custbody_rebate_1_amount", request.getParameter("custpage_early_rebate_1_amt"));
      quote.setFieldValue("custbody_rebate_2_amount", request.getParameter("custpage_early_rebate_2_amt"));
      quote.setFieldValue("custbody_rebate_3_amount", request.getParameter("custpage_early_rebate_3_amt"));

      quote.selectNewLineItem("item");
      quote.setCurrentLineItemValue("item", "item", "7"); //Cash Advanced to Client
      quote.setCurrentLineItemValue("item", "rate", request.getParameter("custpage_desired_advance"));
      quote.setCurrentLineItemValue("item", "amount", request.getParameter("custpage_desired_advance"));
      quote.commitLineItem("item");

      quote.selectNewLineItem("item");
      quote.setCurrentLineItemValue("item", "item", "5"); //Fixed Fee
      quote.setCurrentLineItemValue("item", "rate", request.getParameter("custpage_desired_advance"));
      quote.setCurrentLineItemValue("item", "amount", request.getParameter("custpage_desired_advance"));
      quote.commitLineItem("item");

      quote.selectNewLineItem("item");
      quote.setCurrentLineItemValue("item", "item", "6"); //Deferred Revenue
      quote.setCurrentLineItemValue("item", "rate", request.getParameter("custpage_desired_advance"));
      quote.setCurrentLineItemValue("item", "amount", request.getParameter("custpage_desired_advance"));
      quote.commitLineItem("item");

      var quoteId = nlapiSubmitRecord(quote, true, true);

      response.sendRedirect("RECORD", "estimate", quote);
    }
  }
}


function searchChildRecords(customerId) {
  if (customerId) {

    var filters = [];
    filters.push(new nlobjSearchFilter("parent", null, "anyof", customerId));

    var cols = [];
    cols.push(new nlobjSearchColumn("internalid"));

    var results = nlapiSearchRecord("customer", null, filters, cols);
    if (results) {
      var ids = [];
      for (var x = 0; x < results.length; x++) {
        var customerid = results[x].getId();
        ids.push(customerid);
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

function searchTransactionForCustomer(customerid) {


  var transactionSearch = nlapiSearchRecord("transaction", null,
      [
        ["type", "anyof", "CustPymt", "CashRfnd", "CashSale", "CustCred", "CustDep", "CustRfnd", "CustInvc", "SalesOrd", "Estimate"],
        "AND",
        ["name", "anyof", customerid]
      ],
      [
        new nlobjSearchColumn("internalid"),
      ]
  );

  if (transactionSearch && transactionSearch.length > 0) {
    return true;
  } else {
    return false;
  }

}


function creaeErrorMessage(errorMsg) {


}

function mapState(stateAbbrev) {
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

function daysdiff(d1, d2) {
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  const diffTime = Math.abs(date2 - date1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}


function getRepList(type) {
  var reps = [];
  var filters = [];
  var fieldid = '';
  if (type == 'sales') {
    fieldid = 'custentity_issalesrep';
  }
  if (type == 'diligence') {
    fieldid = 'custentity_isdiligencerep';
  }
  if(type == 'pm') {
    fieldid = 'custentity_isportfoliomgmt';
  }
  filters.push(new nlobjSearchFilter(fieldid, null, 'is', 'T', null));
  filters.push(new nlobjSearchFilter('isInactive', null, 'is', 'F', null));
  var columns = [];
  columns.push(new nlobjSearchColumn('internalid'));
  columns.push(new nlobjSearchColumn('firstname'));
  columns.push(new nlobjSearchColumn('lastname'));
  var rs = nlapiSearchRecord('employee', null, filters, columns);
  rs.forEach(function (result) {
    var emplintid = result.getValue('internalid');
    var fname = result.getValue('firstname');
    var lname = result.getValue('lastname');
    var name = fname + ' ' + lname;
    reps.push({value: emplintid, text: name});
    return true;
  });
  reps.sort(function (a, b) {
    return a.text - b.text
  })
  return reps;
}

function getLeadSources() {
  var leadsources = [];
  leadsources.push({value: "115", text: "Affiliate"});
  leadsources.push({value: "9523", text: "ARB"});
  leadsources.push({value: "10003", text: "Attorney Referral"});
  leadsources.push({value: "-2", text: "Direct Mail"});
  leadsources.push({value: "-5", text: "Google"});
  leadsources.push({value: "4", text: "Heir Referral"});
  leadsources.push({value: "689", text: "James Leestma"});
  leadsources.push({value: "7646", text: "Email"});
  leadsources.push({value: "9524", text: "Oasis"});
  leadsources.push({value: "-6", text: "Peachtree"});
  leadsources.push({value: "65743", text: "Rep"});
  return leadsources;
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
    'missouri':'MI',
    'mi':'Missouri',
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
