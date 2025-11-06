/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(['N/record', 'N/search', 'N/query', 'N/runtime', 'N/https', 'N/currentRecord'], function(record, search, query, runtime, https, cr) {

  function fieldChanged(context) {
    window.ischanged=false;
//    alert('function:fieldChanged; sublist:'+context.sublistId+'; field:'+context.fieldId)
	  return true;
  }

  function lineInit(context) {
    window.ischanged=false;
//    alert('function:lineInit; sublist:'+context.sublistId+'; field:'+context.fieldId)
	  return true;
  }

  function pageInit(context) {
    window.ischanged=false;
    try {
      document.getElementsByClassName('uir-machine-row-focused')[0].style.display='none';
      document.getElementsByClassName('uir-machine-button-row')[0].style.display='none'
      console.log(JSON.stringify(context));
      var rec=context.currentRecord;
    } catch(e) {
      return true;
    }
    return true;
  }

  function executesearch() {
    window.ischanged=false;
//    debugger;
    var rec=cr.get();
    var url='https://5295340.app.netsuite.com/app/site/hosting/restlet.nl?script=2621&deploy=1';
    var unsubscribe=rec.getValue('custpage_unsubscribe');
    var casenum=rec.getValue('custpage_casenum');
    var county=rec.getValue('custpage_county');
    var state=rec.getValue('custpage_state');
    if(county) {
      var stco=county.split('_');
      var st=stco[0];
      var co=stco[1];
    }
    var params=`unsubscribe=${unsubscribe}&state=${st}&county=${co}&casenum=${casenum}`;
    url+='&'+params;
    try {
      var response=https.get({url:url});
//      alert(JSON.stringify(response));
      var responsebody=JSON.parse(response.body);
      if(!!response.status && response.status==false) {
        alert(responsebody.name+'\n'+response.message);
        return false;
      }
      var data=JSON.parse(response.body).content;
//      alert(JSON.stringify(data));
      rec.setValue({fieldId:'custpage_data', value:JSON.stringify(data)});
      var f=document.getElementById('main_form');
      f.submit();
    } catch(e) {
      alert(e.name +'\n' + e.message);
    }
  }

  function selectLine(i) {
    var data=JSON.parse(rec.getValue('custpage_data'));
    alert(i);
    alert(JSON.stringify(data[i]));
    return true;
  }

  function allinsert() {
    custinsert();
    estinsert();
    return true;
  }

  function custinsert() {
//    debugger;
    var rec=cr.get();
    var parent=window.opener;

    var val=parent.nlapiGetFieldValue('custpage_first_name');
    if(!val || val=='NEW') {
      var fname='';
      var mi='';
      var lname='';
      var name=rec.getValue('custpage_customer_name');
      var names=name.split(' ');
      fname=names[0];
      if(names.length>2) {
        var end=names.length-1;
        lname=names[end];
        mi=names[1];
      }
      if(names.length==2) {
        lname=names[1];
      }
      if(fname)
        parent.nlapiSetFieldValue('custpage_first_name', fname);
      if(mi)
        parent.nlapiSetFieldValue('custpage_middle_initial', mi);
      if(lname)
        parent.nlapiSetFieldValue('custpage_last_name', lname);
    }

    var val=parent.nlapiGetFieldValue('custpage_address');
    if(!val) {
      val=rec.getValue('custpage_customer_address');
      if(val) {
        parent.nlapiSetFieldValue('custpage_address', val);
      }
    }

    var val=parent.nlapiGetFieldValue('custpage_city');
    if(!val) {
      val=rec.getValue('custpage_customer_city');
      if(val) {
        parent.nlapiSetFieldValue('custpage_city', val);
      }
    }

    var val=parent.nlapiGetFieldValue('custpage_state');
    if(!val) {
      val=rec.getValue('custpage_customer_state');
      if(val) {
        parent.nlapiSetFieldText('custpage_state', stateToAbbrev(val));
      }
    }

    var val=parent.nlapiGetFieldValue('custpage_zip');
    if(!val) {
      val=rec.getValue('custpage_customer_zip_code');
      if(val) {
        parent.nlapiSetFieldValue('custpage_zip', val);
      }
    }

    var val=parent.nlapiGetFieldValue('custpage_unsubscribe');
    if(!val) {
      val=rec.getValue('custpage_customer_unsubscribe');
      if(val) {
        parent.nlapiSetFieldValue('custpage_unsubscribe', val);
      }
    }
//    alert("Completed insert of customer data");
    return true;
  }

  function estinsert() {
//    debugger;
    var rec=cr.get();
    var parent=window.opener;
    var val=null;
    var statename='';

    val=parent.nlapiGetFieldValue('custpage_estate_state');
    if(!val) {
      val=rec.getValue('custpage_estate_state');
      if(val) {
        if(val.length==2) {
          statename=stateToAbbrev(val);
        } else {
          statename=val;
        }
        parent.nlapiSetFieldText('custpage_estate_state', statename);
      }
    }

    val=parent.nlapiGetFieldValue('custpage_estate_county');
    if(statename && !val) {
      val=statename+'_'+rec.getValue('custpage_estate_county');
      if(val) {
        parent.nlapiSetFieldText('custpage_estate_county', val);
      }
    }

    val=parent.nlapiGetFieldValue('custpage_case_no');
    if(!val) {
      val=rec.getValue('custpage_estate_case_number');
      if(val) {
        parent.nlapiSetFieldValue('custpage_case_no', val);
      }
    }

    val=parent.nlapiGetFieldValue('custpage_estate_filing_date');
    if(!val) {
      val=rec.getValue('custpage_estate_filing_date');
      if(val) {
        parent.nlapiSetFieldValue('custpage_estate_filing_date', val);
      }
    }

    val=parent.nlapiGetFieldValue('custpage_decedent');
    if(!val || val.match(/\[TEMP\]/)) {
      val=rec.getValue('custpage_estate_estate_of_decedent_name');
      if(val) {
        parent.nlapiSetFieldValue('custpage_decedent', val);
//        alert("Decedent name changed - Please don't forget to save the customer")
      }
    }

    
//    alert("Completed insert of estate data");
    return true;
  }

  function prinsert() {
    try {
      var rec=cr.get();
      var parent=window.opener;
      var estintid=parent.nlapiGetFieldValue('custpage_estate');
      var val=rec.getValue('custpage_petitioner_name');
      if(!val) {
        alert("the Petitioner Name field is required");
        return false;
      } else {
        var crec = record.create({type: "contact", isDynamic: true});
      
        // Set body fields on the record. 
        crec.setValue({fieldId: 'entityid', value: val});
        val=rec.getValue({fieldId: 'custpage_petitioner_phone'});
        crec.setValue({fieldId: 'phone', value:val});
        crec.setValue({fieldId: 'role', value: '-10'});
        crec.setValue({fieldId: 'contactrole', value: '-10'});
        crec.setValue({fieldId:'category', value:'2'});
        crec.setValue({fieldId:'subsidiary', value:'2'});
        
        // Create the subrecord.
        crec.selectNewLine({sublistId:'addressbook'});
        var subrec = crec.getCurrentSublistSubrecord({sublistId:'addressbook',  line:1,  fieldId: 'addressbookaddress'}); 
        
        // Set values on the subrecord.
        // Set country field first when script uses dynamic mode
        subrec.setValue({fieldId: 'country', value: 'US'});
        val=rec.getValue({fieldId: 'custpage_petitioner_city'});
        subrec.setValue({fieldId: 'city', value: val});
        val=rec.getValue({fieldId: 'custpage_petitioner_state'});
        subrec.setValue({fieldId: 'state', value: val});
        val=rec.getValue({fieldId: 'custpage_petitioner_zip_code'});
        subrec.setValue({fieldId: 'zip', value: val});
        val=rec.getValue({fieldId: 'custpage_petitioner_address'});
        subrec.setValue({fieldId: 'addr1', value: val});
        crec.commitLine({sublistId: 'addressbook'});
        
        // Save the record.
        var recId = crec.save();
        console.log('Record created successfully:', 'Id: ' + recId);
      }
      
      var id = record.attach({
        record: {type: 'contact', id: recId},
        to: {type: 'customer', id: estintid},
        attributes: {role:'-10'}
      });
  
      alert('Personal Rep added. Note that changes will not be reflected until the page is reloaded.');
    } catch(e) {
      alert('Error adding Personal Rep:\n'+e.name+'\n'+e.message);
    }
    return true;
  }

  function attyinsert() {
//    debugger;
    try {
      var rec=cr.get();
      var recId=null;
      var parent=window.opener;
      var estintid=parent.nlapiGetFieldValue('custpage_estate');
      var val=rec.getValue('custpage_attorney_name');
        
      if(!val) {
        alert("the Attorney Name field is required");
        return false;
      }
      var phone=rec.getValue({fieldId: 'custpage_attorney_phone'});
      if(!phone) {
        alert('Phone is a required field. Please proceed with manual entry.');
        return false;
      }
      var match=matchattorney(phone);
      if(match=='CANCEL' || match=='NO_MATCHES') {
        var crec = record.create({type: "contact", isDynamic: true});
      
        // Set body fields on the record. 
        crec.setValue({fieldId: 'entityid', value: val});
        val=phone;
        crec.setValue({fieldId: 'phone', value:val});
        crec.setValue({fieldId:'category', value:'1'});
        crec.setValue({fieldId:'subsidiary', value:'2'});
        
        // Create the subrecord.
        crec.selectNewLine({sublistId:'addressbook'});
        var subrec = crec.getCurrentSublistSubrecord({sublistId:'addressbook',  line:1,  fieldId: 'addressbookaddress'}); 
        
        // Set values on the subrecord.
        // Set country field first when script uses dynamic mode
        subrec.setValue({fieldId: 'country', value: 'US'});
        val=rec.getValue({fieldId: 'custpage_attorney_city'});
        subrec.setValue({fieldId: 'city', value: val});
        val=rec.getValue({fieldId: 'custpage_attorney_state'});
        subrec.setValue({fieldId: 'state', value: val});
        val=rec.getValue({fieldId: 'custpage_attorney_zip_code'});
        subrec.setValue({fieldId: 'zip', value: val});
        val=rec.getValue({fieldId: 'custpage_attorney_address'});
        subrec.setValue({fieldId: 'addr1', value: val});
        crec.commitLine({sublistId: 'addressbook'});
        
        // Save the record.
        recId = crec.save();
        log.debug('Attorney record created successfully: ' + recId);
    } else {
      recId=match;
    }      
      
      var id = record.attach({
        record: {type: 'contact', id: recId},
        to: {type: 'customer', id: estintid},
        attributes: {role:'1'}
      });

      alert('Attorney added. Note that changes will not be reflected until the page is reloaded.');
    } catch(e) {
      alert('Error adding Attorney:\n'+e.name+'\n'+e.message);
    }
    
    return true;
  }

  function matchattorney(phone) {
    var retval=false;
    var cleanedphone=phone.toString().replace(/[\D]/g, '');
    var q=`select id, fullname, REGEXP_REPLACE(phone, '[^0-9]+', '') as cleaned_phone, category
    from contact 
    where REGEXP_REPLACE(phone, '[^0-9]+','')=${cleanedphone}
    order by REGEXP_REPLACE(phone, '[^0-9]+', '')`;
    var rc=query.runSuiteQLPaged(q).count;
    if(rc==0) {
      retval='NO_MATCHES';
    }
    var data=query.runSuiteQL(q).asMappedResults();
    if(rc==1) {
      var result=data[0];
      var cat=result.category==1?'Atty':'Contact';
      var results='Found one matching contact. Click ok to use this contact or cancel to create a new contact:\n';
      results+=`${result.fullname} (${cat})`;
      var selection=confirm(results);
      if(selection) {
        retval=data[0];
      }
    }
    if(rc>1) {
      //debugger;
      var start=0;
      var endloop=false;
      do {
        var results='Multiple matches. Select entry by number, -/+ for prev/next page, or CANCEL to create a new contact:\n';
        var len=data.length;
        var end=len>start+5?start+5:len;
        for(var i=start; i<len && i<end; i++) {
          var result=data[i];
          var cat=result.category==1?'Atty':'Contact';
          results+=`(${i+1}) ${result.fullname} (${cat})`;
          if(i<end-1)
            results+='\n';
        }
        selection=prompt(results);
        snum=parseInt(selection);
        if(selection==null) {
          endloop=true;
          retval='CANCEL';
        }
        if(snum>=1 && snum<=len) {
          endloop=true;
        }
        if(selection=='+') {
          start+=5;
          if(start>len)
            start=0;
        }
        if(selection=='-') {
          start-=5;
          if(start<0)
            start=len-5;
          if(start<0)
            start=0;
        }
      } while(!endloop);
      if(!retval) {
        var index=selection-1;
        retval=data[index].id;
      }
    }
    return retval;
  }  

  return {
    fieldChanged:fieldChanged,
    pageInit:pageInit,
    executesearch:executesearch,
    selectLine:selectLine,
    allinsert:allinsert,
    custinsert:custinsert,
    estinsert:estinsert,
    prinsert:prinsert,
    attyinsert:attyinsert,
  };
});

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
  }[statename.toLowerCase()] || 'error - no state found';
}

