/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/search', 'N/query', 'N/runtime', 'SuiteScripts/Libraries/RM-functions.js'], function(record, search, query, runtime, rmfunc) {

  function getInputData(){
    var folderid=84996;
    var allresults=[];
    var q=`select id, name, filesize, createddate, url, folder from file where folder=${folderid}`;
    var rs=query.runSuiteQLPaged({pageSize:1000, query:q});
    for(var i in rs.pageRanges) {
      var page=rs.fetch(i);
      var results=page.data.asMappedResults();
      allresults=allresults.concat(results);
    };
    return allresults;
  }

  function map(context) {
    log.debug({title:'value', details:context.value});
    var result=JSON.parse(context.value);
    [state, county, casenum] = result.name.split('_');
    casenum=casenum.replace(/\....$/,'');
    county=rmfunc.stateToAbbrev(state)+'_'+county;
    var q=`select id from customrecord173 where name='${county}'`;
    var countyid=query.runSuiteQL({query:q}).asMappedResults()[0].id;
    var filerec = record.create({type: 'customrecord_petition_file'});
    filerec.setValue({fieldId: 'name', value: casenum});
    filerec.setValue({fieldId: 'owner', value: 2299863});
    filerec.setText({fieldId: 'custrecord_petitionfile_statecounty', text:county});
    filerec.setValue({fieldId: 'custrecord_petitionfile_origfilename', value: result.name});
    filerec.setValue({fieldId: 'custrecord_petitionfile_filename', value: result.name});
    filerec.setValue({fieldId: 'custrecord_petitionfile_url', value: result.url});
    filerec.setValue({fieldId: 'custrecord_petitionfile_fileid', value: result.id});
    filerec.setValue({fieldId: 'custrecord_petitionfile_filesize', value: result.filesize});
    filerec.setValue({fieldId: 'custrecord_petitionfile_casenum', value: casenum});
    filerec.setValue({fieldId: 'custrecord_petitionfile_folderid', value: result.folder});
    var filerecid = filerec.save();
    log.debug({title:'logged file '+result.name+' with internalid '+filerecid});
    return;
  }

  return {getInputData: getInputData, map: map};
});