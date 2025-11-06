/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * Client Script for Drag and Drop Handling
 * File: drag_drop_client.js
 */

MAXFILES=10;

define(['N/currentRecord'], function(cr) {
  function pageInit(context) {
    var rec=context.currentRecord;
    // Get the drop zone element
    let dropZone = document.getElementById('drop_zone');
    let fileDataField = document.getElementById('custpage_file_data');
    let fileArray = [];
    var fresh=true;

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight drop zone on drag enter/over
    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, function () {
        dropZone.style.backgroundColor = '#e1e1e1';
      }, false);
    });

    // Remove highlight on drag leave
    dropZone.addEventListener('dragleave', function () {
      dropZone.style.backgroundColor = '#f9f9f9';
    }, false);

    // Handle dropped files
    dropZone.addEventListener('drop', function (e) {
      let files = e.dataTransfer.files;
      handleFiles(files);
      dropZone.style.backgroundColor = '#f9f9f9';
    }, false);

    function preventDefaults(e) {
      e.preventDefault();
      e.stopPropagation();
    }

    function handleFiles(files) {
      debugger;
//      dropZone.disabled = true;
//      fileArray = []; // Reset file array
      let fileCount = files.length;
      if(fileCount > 10) {
        alert('You have dropped too many files. Limit:'+MAXFILES);
        return false;
      }
      let processedCount = 0;
      let overmaxfiles=false;
      if(fresh)
        dropZone.innerHTML='';

      for (let i = 0; i < files.length; i++) {
        let file = files[i];
          let reader = new FileReader();

          // Read file as base64
          reader.onload = function (e) {
            console.log(fileArray);
            if(file.size<10000000) {
              if (!fileArray.some(e => e.name == file.name)) {
                fileArray.push({
                  name: file.name,
                  type: file.type,
                  size: file.size,
                  content: e.target.result.split(',')[1] // Extract base64 data
                });

                console.log(e.target.result.split(','));

                dropZone.innerHTML += '<br>\n';
                fresh = false;
                dropZone.innerHTML += file.name;

                rec.selectNewLine({sublistId: 'custpage_files_table'});
                rec.setCurrentSublistValue({
                  sublistId: 'custpage_files_table',
                  fieldId: 'custpage_filename',
                  value: file.name
                });
                rec.setCurrentSublistValue({
                  sublistId: 'custpage_files_table',
                  fieldId: 'custpage_filesize',
                  value: file.size
                });
                rec.setCurrentSublistValue({
                  sublistId: 'custpage_files_table',
                  fieldId: 'custpage_filetype',
                  value: file.type
                });
                rec.commitLine({sublistId: 'custpage_files_table'});
              }
            } else {
              alert(file.name +' is larger than the 10MB limit and will be ignored.');
            }
            processedCount++;
            if (processedCount === fileCount || processedCount === 10) {
              // Update hidden field with JSON string of file data
//              fileDataField.value = JSON.stringify(fileArray);
              rec.setValue({fieldId:'custpage_file_data', value:JSON.stringify(fileArray)});
              console.log('Files ready for submission:', fileArray);
//            alert(`Dropped ${fileCount} file(s). Ready to submit.`);
            }
          };
          reader.readAsDataURL(file);
      }
    }
    clearchanged();
  }

  function saveRecord(context) {
    var rec=context.currentRecord;
    var userid=rec.getValue('custpage_userid');
    if(userid==null || userid.length==0) {
      alert('User ID is required');
      return false;
    }
    var password=rec.getValue('custpage_password');
    if(password==null || password.length==0) {
      alert('Password is required');
      return false;
    }
    var county=rec.getValue('custpage_county');
    if(county==null || county.length==0) {
      alert('State/County is required');
      return false;
    }
    var newpassword=rec.getValue('custpage_newpassword');
    var confirmnewpassword=rec.getValue('custpage_confirmnewpassword');
    if(newpassword !== confirmnewpassword) {
      alert('New Passwords do not match');
      return false
    }

    for(var i=0; i<rec.getLineCount({sublistId:'custpage_files_table'}); i++) {
      var casenum=rec.getSublistValue({sublistId:'custpage_files_table', fieldId:'custpage_casenum', line:i});
      if(casenum==null || casenum.length==0) {
        alert(`Case number is required on line ${i+1}`);
        return false;
      }
    }
    clearchanged();
    return true;
  }

  function clearForm() {
    var rec=cr.get();
    var lc=rec.getLineCount('custpage_files_table')
    for(var i=lc-1; i>=0; i--) {
      rec.removeLine({sublistId:'custpage_files_table', line:i});
    }
    rec.setValue('custpage_file_data', null);
//    rec.setValue('custpage_drop_area', `<div id="drop_zone" style="width: 400px; height: 200px; border: 2px dashed #ccc; text-align: center; padding: 20px; background-color: #f9f9f9;"><p>Drop files here</p></div>`);
    rec.setValue('custpage_county', null);
    clearchanged();
  }

  function validateDelete(context) {
    debugger;

    var rec=context.currentRecord;
    var line=rec.getCurrentSublistIndex({sublistId:'custpage_files_table'});
    var sublistid=context.sublistId;
    var fileDataField = document.getElementById('custpage_file_data');
    var files=JSON.parse(fileDataField.value);
    var filesfld=document.getElementById('drop_zone');
    var filelist=filesfld.innerHTML.replace(/<br>/g,'').split(/\n/);
    filelist.shift();
    filelist.splice(line,1);
    var filenames='<br>\n'+filelist.join('<br>\n');
    filesfld.innerHTML=filenames;
    files.splice(line,1);
    fileDataField.value=JSON.stringify(files);
    clearchanged();
    return true;
  }

  function fieldChanged(context) {
    clearchanged();
    return true;
  }

  function clearchanged() {
    document.getElementById('custpage_files_table_buttons').hidden=true;
    window.ischanged=false;
    return true;
  }

  return {
    pageInit: pageInit,
    saveRecord:saveRecord,
    clearForm:clearForm,
    validateDelete:validateDelete,
    fieldChanged:fieldChanged,
  };
});