/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

const keystring='TxsX0TEnptSmIwILHbImc4sHbnZyHV';

define(['N/encode', 'N/file', 'N/crypto', 'N/ui/serverWidget', 'N/search', 'N/record', 'SuiteScripts/Libraries/RM-functions.js'],
    function (encode, file, crypto, serverWidget, search, record, rmfunc) {
      function createFormField(form, config) {
        const field = form.addField(config);
        if (config.displayType) {
          field.updateDisplayType({displayType: config.displayType});
        }
        if (config.layoutType) {
          field.updateLayoutType({layoutType: config.layoutType});
        }
        if (config.breakType) {
          field.updateBreakType({breakType: config.breakType});
        }
        if (config.defaultValue) {
          field.defaultValue = config.defaultValue;
        }
        return field;
      }

      function drawform(context) {
        /***************************************************************************************
         *
         *          DO GET
         *
         ***************************************************************************************/
        var params=context.request.parameters;
        var userid='';
        var password='';
        var countyid='';

        var encodedString = params.whence;
        if(encodedString != null && encodedString != '') {
          originalString = dc_encrypt(encode.convert({
            string: encodedString,
            inputEncoding: encode.Encoding.BASE_64,
            outputEncoding: encode.Encoding.UTF_8
          }), keystring);
          [userid, password, countyid] = originalString.split('?');
        }

        // Create a NetSuite form
        const form = serverWidget.createForm({title: 'Court Petition Uploader'});
        form.clientScriptModulePath = './PetitionUploader-v2-CL.js';

        // Field Groups
        form.addFieldGroup({id: 'custpage_authentication', label: 'Authentication'}).isSingleColumn = true;
        form.addFieldGroup({id: 'custpage_caseinfo', label: 'Case Information'});
        form.addFieldGroup({id: 'custpage_fileuploader', label: 'File Upload'});

        // Authentication Fields
        createFormField(form, {
          id: 'custpage_userid',
          type: 'text',
          label: 'User ID',
          container: 'custpage_authentication',
          defaultValue: userid
        });
        createFormField(form, {
          id: 'custpage_password',
          type: 'password',
          label: 'Password',
          container: 'custpage_authentication',
          defaultValue: password
        });
        createFormField(form, {
          id: 'custpage_pwinstructions',
          type: serverWidget.FieldType.INLINEHTML,
          label: 'Instructions',
          container: 'custpage_authentication',
//          layoutType: 'endrow',
          defaultValue: '<p>Only use the fields below if changing your password. No file will be uploaded.</p>'
        });
        createFormField(form, {
          id: 'custpage_newpassword',
          type: 'password',
          label: 'New Password',
          container: 'custpage_authentication'
        });
        createFormField(form, {
          id: 'custpage_confirmnewpassword',
          type: 'password',
          label: 'Confirm New Password',
          container: 'custpage_authentication'
        });

        // File Uploader Fields
        createFormField(form, {
          id: 'custpage_instructions',
          type: serverWidget.FieldType.INLINEHTML,
          label: 'Instructions',
          container: 'custpage_fileuploader',
          layoutType: 'endrow',
          defaultValue: '<p>Drag and drop up to 10 files into the area below:</p>'
        });
        createFormField(form, {
          id: 'custpage_drop_area',
          type: serverWidget.FieldType.INLINEHTML,
          label: 'Drop Area',
          container: 'custpage_fileuploader',
          layoutType: 'startrow',
          breakType: 'startrow',
          defaultValue: `
          <div id="drop_zone" 
               style="width: 400px; height: 200px; border: 2px dashed #ccc; text-align: center; padding: 20px; background-color: #f9f9f9;">
              <p>Drop files here</p>
          </div>`
        });
        createFormField(form, {
          id: 'custpage_file_data',
          type: serverWidget.FieldType.LONGTEXT,
          label: 'File Data',
          displayType: serverWidget.FieldDisplayType.HIDDEN
        });

        // Case Information Fields
        createFormField(form, {
          id: 'custpage_county',
          type: 'select',
          label: 'State and County',
          source: 'customrecord173',
          container: 'custpage_caseinfo',
          breakType: serverWidget.FieldBreakType.STARTROW,
          defaultValue: countyid
        });

        // Submit Button
        form.addSubmitButton({label: 'Process Files'});
        form.addButton({id:'custpage_clear_form', label: 'Clear Form', functionName: 'clearForm'});

        // Files Sublist
        const filesTable = form.addSublist({
          id: 'custpage_files_table',
          label: 'Files To Upload',
          type: 'inlineeditor',
          container: 'custpage_caseinfo'
        });
        filesTable.addField({id: 'custpage_filename', label: 'Filename', type: 'text'});
        filesTable.addField({id: 'custpage_filesize', label: 'File Size', type: 'text'});
        filesTable.addField({id: 'custpage_filetype', label: 'Filetype', type: 'text'});
        filesTable.addField({id: 'custpage_casenum', label: 'Case Number', type: 'text'});

        return form;
      }

      function doPost(context) {

        /***************************************************************************************
         *
         *          DO POST
         *
         ***************************************************************************************/
        const { custpage_userid: userid, custpage_password: password, custpage_newpassword: newpass,
          custpage_confirmnewpassword: confirmpass, custpage_county: countyid, custpage_file_data: filedata,
          custpage_files_tabledata: tabledata } = context.request.parameters;

// ***************** Authentication subroutine *****************
        if (userid) {
          var auth = false;
          auth = crypto.checkPasswordField({
            fieldId: "custentity_suiteletpassword",
            recordId: parseInt(userid),
            recordType: 'employee',
            value: password
          });
        } else {
          context.response.writeLine('<br><br>***** userid is required. authentication failed *****');
          return false;
        }

        context.response.writeLine('userid:' + userid + '; auth:' + auth + '<br>');
        if (!auth) {
          context.response.writeLine('Authentication failed - you are not allowed to use this tool.');
          return false;
        } else {
          context.response.writeLine('Authentication successful.<br>');
        }


// ***************** Password change subroutine *****************
        if (newpass || confirmpass) {
          if (newpass != confirmpass) {
            context.response.writeLine('FAILED: New passwords do not match.');
            return;
          } else { //if (newpass != confirmpass)
            record.submitFields({type: 'employee', id: userid, values: {custentity_suiteletpassword: confirmpass}});
            context.response.writeLine('Successfully updated password.');
            var baseurl='/app/site/hosting/scriptlet.nl?script=2838&deploy=1';
            context.response.writeLine(`<button onclick="window.location.href='${baseurl}';">Return To Entry Form</button>`);
            return;
          } //if (newpass != confirmpass)
        } //if(newpass)

// ***************** Parse submitted data *****************
        log.debug('parsing data');
        var stcounty = search.lookupFields({type: 'customrecord173', id: countyid, columns: 'name'}).name;
        const [state, county] = stcounty.split('_');
//        context.response.writeLine('Files received. Check server logs for details.<br><br>');

        try {
          var files = JSON.parse(filedata);
          var lines = tabledata.split(/\x02/);
        } catch(e) {
          log.debug({title:'error details', details:userid + ' ' + filedata});
          context.response.writeLine('There was an error. Please try again or notify your supervisor.');
        }

      // Check that files and lines are the same size
        if(files.length != lines.length) {
          context.response.writeLine('<br><br>***** Sorry, there was an error uploading the files. Please try again *****');
          return false;
        }

        for (var i = 0; i < lines.length; i++) {
          var line = lines[i].split(/\x01/);
          var finfo={};
          finfo.acontents=files[i].content;
          finfo.oldname = line[0];
          finfo.size=line[1];
          finfo.filetype=line[2].replace(/^.*\//,'');
          finfo.casenum = line[3].trim();
          finfo.ext = finfo.oldname.replace(/^.*\./, '');
          finfo.name = `${state}_${county}_${finfo.casenum}.${finfo.ext}`;
          finfo.folderid = 84996;

          var filetype=null;
          switch(finfo.filetype.toLowerCase()) {
            case 'pdf':
              filetype=file.Type.PDF;
              break;
            case 'html':
            case 'htm':
              filetype=file.Type.HTMLDOC;
              break;
            case 'doc':
            case 'docx':
              filetype=file.Type.WORD;
              break;
            case 'rtf':
            case 'rtfx':
              filetype=file.Type.RTF;
              break;
            case 'xml':
              filetype=file.Type.XML;
              break;
            case 'txt':
            case 'csv':
              filetype=file.Type.PLAINTEXT;
              break;
            default:
              context.response.writeLine('unknown file type: ' + finfo.oldname);
              filetype=file.Type.PLAINTEXT
//              return;
          }

          var options={
            name: finfo.name,
            fileType: filetype,
            contents: finfo.acontents,
            description: `Court Petition file; ${state} ${county} county, case # ${finfo.casenum}`,
            folder: finfo.folderid
          }

          try {
            var f = file.create(options);
            var fileid=f.save();
            context.response.writeLine(`<br>saved file ${finfo.name} with internalid ${fileid}<br>`);
          } catch(e) {
            context.response.writeLine(JSON.stringify(e)+'<br>');
            context.response.writeLine('error creating file '+finfo.name+'/'+finfo.oldname+'<br><br>');
            continue;
          }

          var f=file.load({id:fileid});
          var filerec = record.create({type: 'customrecord_petition_file'});
          filerec.setValue({fieldId: 'name', value: finfo.casenum});
          filerec.setValue({fieldId: 'owner', value: userid});
          filerec.setValue({fieldId: 'custrecord_petitionfile_statecounty', value: context.request.parameters.custpage_county});
          filerec.setValue({fieldId: 'custrecord_petitionfile_origfilename', value: finfo.oldname});
          filerec.setValue({fieldId: 'custrecord_petitionfile_filename', value: finfo.name});
          filerec.setValue({fieldId: 'custrecord_petitionfile_url', value: f.url});
          filerec.setValue({fieldId: 'custrecord_petitionfile_fileid', value: fileid});
          filerec.setValue({fieldId: 'custrecord_petitionfile_filesize', value: f.size});
          filerec.setValue({fieldId: 'custrecord_petitionfile_casenum', value: finfo.casenum});
          filerec.setValue({fieldId: 'custrecord_petitionfile_folderid', value: finfo.folderid});
          filerecid = filerec.save();
        }

        var baseurl='/app/site/hosting/scriptlet.nl?script=2838&deploy=1';
          const originalString = dc_encrypt(userid + '?' + password + '?' + countyid, keystring);
          var encodedString = encode.convert({
            string: originalString,
            inputEncoding: encode.Encoding.UTF_8,
            outputEncoding: encode.Encoding.BASE_64
          });
//        baseurl+='&whence=' + encodedString;
        context.response.writeLine(`<button onclick="window.location.href='${baseurl}';">Return To Entry Form</button>`);
        return true;
      } // function doPost

      function doGet(context) {
        var form=drawform(context);
        context.response.writePage(form);
      }


      function onRequest(context) {
        log.debug('onrequest');
        if (context.request.method === 'GET') {
          doGet(context)
        }
        if (context.request.method === 'POST') {
          doPost(context);
        }
      }

      function dc_encrypt(str, key)
      {
        var ord = []; var res = "";

        var i;
        for (i = 1; i <= 255; i++) {ord[String.fromCharCode(i)] = i}

        for (i = 0; i < str.length; i++)
          res += String.fromCharCode(ord[str.substr(i, 1)] ^ ord[key.substr(i %    key.length, 1)]);

        return(res);
      }

      return {
        onRequest: onRequest
      };
    });
