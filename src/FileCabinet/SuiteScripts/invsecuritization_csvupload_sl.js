/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/task', 'N/email', 'N/file', 'N/record', 'N/search', 'N/ui/serverWidget', 'N/runtime', 'N/query', 'SuiteScripts/Libraries/RM-functions.js'],
  /**
   * @param{email} email
   * @param{file} file
   * @param{record} record
   * @param{search} search
   * @param{serverWidget} serverWidget
   */
  (task, email, file, record, search, sw, runtime, query, rmfunc) => {
  /**
   * Defines the Suitelet script trigger point.
   * @param {Object} scriptContext
   * @param {ServerRequest} scriptContext.request - Incoming request
   * @param {ServerResponse} scriptContext.response - Suitelet response
   * @since 2015.2
   */

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
      title: 'Upload Invoice Securitization Data'
    });
    var fld = form.addField({
      id: 'custpage_file',
      type: 'file',
      label: 'Upload File Here'
    });
    var fld = form.addField({
      id: 'custpage_directions',
      type: 'text',
      label: 'Required Format'
    });
    fld.updateDisplayType({
      displayType: 'inline'
    });
    form.addSubmitButton({
      label: 'Submit'
    });
    fld.defaultValue = `CSV file, no commas contained in data.<br />
Required fields and field names:<br />
GroupName, PurchaseDate, Multiple, AssetID<br />
Invoice must exist and must be open.`;
    return form;
  }

  function doPost(context) {
    var userid = runtime.getCurrentUser().id;
    //            context.response.writeLine(JSON.stringify(context.request));
    var data = {};
    var invoicedata={};
    var errors = {};
    var invintids = [];
    var resultcount = 0;
    var f = context.request.files['custpage_file'];
    if (f.fileType == 'CSV' && f.isText) {
      var filecontents = f.getContents();
      var lines = filecontents.trim().replace(/\r/g, '').split(/\n/);
      var headers = lines[0];
      var temp = lines[0].split(',');
      log.debug(JSON.stringify(temp));
      var format=true;
      var errmsg='';
      if (temp.length != 4) {
        format=false;
        errmsg+='columns:'+temp.length+'\n';
      }
      if(temp[0].replace(/"/g, '').trim().toLowerCase() != 'groupname') {
        format=false;
        errmsg+='column 1 name:"'+temp[0]+'" does not match "GroupName"\n';
      }
      if(temp[1].replace(/"/g, '').trim().toLowerCase() != 'purchasedate') {
        format=false;
        errmsg+='column 2 name:"'+temp[1]+'" does not match "PurchaseDate"\n';
      }
      if(temp[2].replace(/"/g, '').trim().toLowerCase() != 'multiple') {
        format=false;
        errmsg+='column 3 name:"'+temp[2]+'" does not match "Multiple"\n';
      }
      if(temp[3].replace(/"/g, '').trim().toLowerCase() != 'assetid') {
        format=false;
        errmsg+='column 4 name:"'+temp[3]+'" does not match "AssetID"\n';
      }
      if (!format) {
        context.response.writeLine('Incorrect CSV format. Please see requirements and check the file you are uploading.');
        context.response.writeLine('Error(s):\n'+errmsg);
        return;
      }
      f.folder=24169;
      f.name=Date.now()+'-asset-tagging.csv';
      var csvfileid=f.save();
      context.response.writeLine('saved file '+f.name+' to file cabinet with internal id '+csvfileid+'.');
    } else {
      context.response.writeLine('Incorrect file type. Please select a CSV file with the headers: GroupName, PurchaseDate, Multiple, AssetID');
      return;
    }
    try {
      var mrTask = task.create({
        taskType: task.TaskType.MAP_REDUCE,
        scriptId: 'customscript_invsec_csvupload_mr',
        deploymentId: 'customdeploy1',
        params: { custscriptfileid: csvfileid }
      });
      var mrTaskId = mrTask.submit();
      context.response.writeLine('scheduled MR job '+mrTaskId);
    } catch(e) {
      context.response.writeLine('failed to schedule job: '+e.name+' '+e.message);
    }

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

  return {
    onRequest
  }

});
