/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/file', 'N/query', 'N/record'],
    /**
 * @param{file} file
 * @param{query} query
 * @param{record} record
 */
    (file, query, record) => {
        /**
         * Defines the function that is executed at the beginning of the map/reduce process and generates the input data.
         * @param {Object} inputContext
         * @param {boolean} inputContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Object} inputContext.ObjectRef - Object that references the input data
         * @typedef {Object} ObjectRef
         * @property {string|number} ObjectRef.id - Internal ID of the record instance that contains the input data
         * @property {string} ObjectRef.type - Type of the record instance that contains the input data
         * @returns {Array|Object|Search|ObjectRef|File|Query} The input data to use in the map/reduce process
         * @since 2015.2
         */

        const getInputData = (inputContext) => {
          var q=`
select pf.id as pfintid, pf.custrecord_petitionfile_filename as pfilename, f.name as filename, pf.custrecord_petitionfile_fileid as fileid, pf.custrecord_petitionfile_folderid as folderid 
from customrecord_petition_file pf
join file f on f.id=pf.custrecord_petitionfile_fileid
where custrecord_petitionfile_filename like 'AAA-TEST-%'
          `;
          var pageddata=query.runSuiteQLPaged({query:q, pageSize:1000});
          log.debug('results:'+pageddata.count);
          var results=[];
          for(i in pageddata.pageRanges) {
            var page=pageddata.fetch(i);
            results=results.concat(page.data.asMappedResults());
          }
          return results;
        }

        const map = (context) => {
          try {
            var val = JSON.parse(context.value);
//            log.debug('context', context.value);

            var rec=record.load({type:'customrecord_petition_file', id:val.pfintid});
            var newfilename = val.pfilename.replace(/AAA-TEST-/, '').replace(/\s/g,'');
            log.debug(val.pfilename + ' -> ' + newfilename);
            rec.setValue({fieldId:'custrecord_petitionfile_filename', value:newfilename});
            rec.save();

            var f = file.load({id: val.fileid});
//            log.debug('file details', JSON.stringify(f));
            f.name = newfilename;
            f.save();
          } catch(e) {
            log.debug(e.message, JSON.stringify(e));
          }
        }

        return {getInputData, map}

    });
