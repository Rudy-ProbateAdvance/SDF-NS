/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/search', 'N/crypto', 'N/file', 'N/ui/serverWidget', 'N/runtime'],
  function(record, search, crypto, file, sw, runtime) {

  function timestamp() {
    var datetimenow = new Date();
    var MM = ('' + datetimenow.getMonth() + 1).padStart(2, '0');
    var dd = ('' + datetimenow.getDate()).padStart(2, '0');
    var yyyy = ('' + datetimenow.getFullYear()).padStart(2, '0');
    var hh = ('' + datetimenow.getHours()).padStart(2, '0');
    var mm = ('' + datetimenow.getMinutes()).padStart(2, '0');
    var ss = ('' + datetimenow.getSeconds()).padStart(2, '0');
    var today = yyyy + MM + dd + hh + mm + ss;
    return today;
  }

  function drawform() {
    var form = sw.createForm({
      title: 'Upload File'
    });
    form.clientScriptModulePath='/SuiteScripts/PetitionUploader-CL.js';

    var fld = form.addField({id:'custpage_userid', type:'text', label:'userid'});
    var fld = form.addField({id:'custpage_password', type:'password', label:'password'});

    fld = form.addField({
      id: 'custpage_pwdirections',
      type: 'text',
      label: 'Note:'
    });
    fld.updateDisplayType({
      displayType: 'inline'
    });
    fld.defaultValue = `Only use these fields if changing your password. No file will be uploaded.<br />`;
    
    var fld = form.addField({id:'custpage_newpassword', type:'password', label:'New Password'});
    var fld = form.addField({id:'custpage_confirmnewpassword', type:'password', label:'Confirm New Password'});


    fld = form.addField({
      id: 'custpage_directions',
      type: 'text',
      label: 'County Format'
    });
    fld.updateDisplayType({
      displayType: 'inline'
    });
    fld.defaultValue = `State Name_County Name<br />`;

    var fld = form.addField({
      id: 'custpage_file',
      type: 'file',
      label: 'Upload File Here'
    });
    fld = form.addField({
      id: 'custpage_county',
      type: 'select',
      label: 'State_County',
      source: 'customrecord173'
    });
    fld = form.addField({
      id: 'custpage_casenum',
      type: 'text',
      label: 'Case Number'
    });
    form.addSubmitButton({
      label: 'Submit'
    });
    return form;
  }

  function doPost(context) {
    var params=context.request.parameters;
    var data={};
    var userid=params.custpage_userid;
    var password=params.custpage_password;
    var newpass=params.custpage_newpassword;
    var confirmpass=params.custpage_confirmnewpassword;

//    context.response.writeLine(JSON.stringify(params));
//    return;

    var auth = crypto.checkPasswordField({
      fieldId: "custentity_suiteletpassword",
      recordId: parseInt(userid),
      recordType: 'employee',
      value: password
    });

    context.response.writeLine('username:'+userid+'; auth:'+auth);
    if(!auth) {
      context.response.writeLine('Authentication failed - you are not allowed to use this tool.');
      return;
    } else {
      context.response.writeLine('Authentication successful.');
    }

    if(newpass) {
      if(newpass!=confirmpass) {
        context.response.writeLine('FAILED: New passwords do not match.');
        return;
      } else {
        record.submitFields({type:'employee', id:userid, values:{custentity_suiteletpassword:confirmpass}});
        context.response.writeLine('Successfully updated password.');
        return;
      }
    }
    
    var userid = runtime.getCurrentUser().id;
    var f = context.request.files['custpage_file'];
    
    var filename=f.name;
    var casenum=context.request.parameters.custpage_casenum;
    var fileext=filename.match(/^.*\.(.*)$/)[1];
    var filecontents = f.getContents();
    var statecounty=search.lookupFields({
      type:'customrecord173',
      id:context.request.parameters.custpage_county,
      columns:'name'
    }).name.split(/_/);
    var state=stateToAbbrev(statecounty[0]);
    var county=statecounty[1];
//    context.response.writeLine(JSON.stringify(context.request.parameters));
    var newfilename=state+'_'+county+'_'+casenum+'.'+fileext;
    context.response.writeLine('<br />'+state);
    context.response.writeLine('<br />'+county);
    context.response.writeLine('<br />'+casenum);
    context.response.writeLine('<br />File Type: '+f.filetype);
    context.response.writeLine('<br />File Extension: '+fileext);
    context.response.writeLine('<br />New Filename: '+newfilename+'<br />');

//    var user=runtime.getCurrentUser();
//    var userid=user.id;
//    var roleid=user.role;
//    context.response.writeLine('<br />Current User: '+userid);
//    context.response.writeLine('<br />Current User Role: '+roleid);
//    return true;

    f.folder=84996;
    f.name=newfilename;
    var fileid=f.save();
    context.response.writeLine('saved file '+f.name+' to file cabinet with internal id '+fileid+'.');
//    log.debug({title:'success', details:'saved file '+f.name+' to file cabinet with internal id '+fileid+'.'});

    return true;
  }

  function doGet(context) {
    context.response.writePage(drawform());
    return true;
  }

  function onRequest(context) {
    if (context.request.method == 'GET') {
      doGet(context);
    } else {
      doPost(context);
    }
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

  return {
    onRequest
  }

});
