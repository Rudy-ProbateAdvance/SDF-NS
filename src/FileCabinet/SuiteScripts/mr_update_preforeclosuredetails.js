/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/https', 'N/search', 'N/format', 'SuiteScripts/Libraries/GeocodeAddressParse.js'],
  /**
   * @param{record} record
   * @param{search} search
   */
  (record, https, search, format, addrp) => {
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
    log.debug('-BEGIN-');
    try {
      /*return search.load({
      id: 'customsearch_update_property_search'
      });*/
      var column = new Array();
      var filter;
      column.push(search.createColumn({
          name: "parent",
          join: "customer",
          summary: "GROUP",
          sort: search.Sort.ASC,

        }));
      filter = [
        ["type", "anyof", "CustInvc"], "AND", ["mainline", "is", "T"], "AND", ["status", "anyof", "CustInvc:A"]//                         , "AND", ["formulanumeric: ROWNUM", "lessthanorequalto", "10"]
      ];
      var searchObject = search.create({
        type: search.Type.INVOICE,
        columns: column,
        filters: filter
      });
      log.debug('search results: ' + searchObject.runPaged().count);
      var pagedData = searchObject.runPaged({
        pageSize: 1000
      });
      var estates = [];
      var estateJson = [];
      var searchResult;
      pagedData.pageRanges.forEach(function (pageRange) {
        var pageIndex = pageRange.index;
//        log.debug('pageIndex', pageIndex);
        var searchPage = pagedData.fetch({
          index: pageIndex
        });
        searchPage.data.forEach(function (result) {
          var estate = result.getValue(result.columns[0]);
          estates.push(estate);
        });
      });
      if (estates.length > 0) {
        var propertySearchObj = search.create({
          type: "customrecord_property",
          filters: [
            ["custrecord_property_estate", "anyof", estates]
          ],
          columns: [
            search.createColumn({
              name: "name",
              sort: search.Sort.ASC,
              label: "Name"
            }),
            search.createColumn({
              name: "internalid",
              sort: search.Sort.ASC,
              label: "internalid"
            })
          ]
        });
        var propertyresults = getSearchResult(propertySearchObj);
        propertyresults.forEach(function (result) {
          var id = result.getValue({
            name: 'internalid'
          });
          estateJson.push(id);
        });
      }
      //
      //estateJson.push( 5723);
      log.debug('estates count', estateJson.length);
      return estateJson

    } catch (e) {
      log.error('ERROR', JSON.stringify(e));
    }
  }

  /**
   * Defines the function that is executed when the map entry point is triggered. This entry point is triggered automatically
   * when the associated getInputData stage is complete. This function is applied to each key-value pair in the provided
   * context.
   * @param {Object} mapContext.write({key:'',value:}) - Data collection containing the key-value pairs to process in the map stage. This parameter
   *     is provided automatically based on the results of the getInputData stage.
   * @param {Iterator} mapContext.errors - Serialized errors that were thrown during previous attempts to execute the map
   *     function on the current key-value pair
   * @param {number} mapContext.executionNo - Number of times the map function has been executed on the current key-value
   *     pair
   * @param {boolean} mapContext.isRestarted - Indicates whether the current invocation of this function is the first
   *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
   * @param {string} mapContext.key - Key to be processed during the map stage
   * @param {string} mapContext.value - Value to be processed during the map stage
   * @since 2015.2
   */

  const map = (mapContext) => {
    try {
//      log.debug('mapContext', mapContext);
      //let recid = mapContext.key;
      let recid = mapContext.value;
      let recordObj = record.load({
        type: 'customrecord_property',
        id: recid
      });
      try {
        let name='';
        var propertyname = recordObj.getValue({
          fieldId: 'name'
        }).replace(/["']/g, '').replace(/\(.*\)/g, ' ').replace(/\[.*\]/g, ' ').trim();
        var estate = recordObj.getValue({
          fieldId: 'custrecord_property_estate'
        });
        log.debug('propertyname', propertyname);
        // try to process address with geocoder.ca
        var gcaddress=recordObj.getValue('custrecord_property_address');
        var gccity=recordObj.getValue('custrecord_property_city');
        var gcstate=recordObj.getValue('custrecord_property_state');
        var needsupdate=recordObj.getValue('custrecord_property_address_to_update');
        if(!needsupdate) {
          log.debug('geocode address present - skipping lookup');
          if(gcaddress && gccity && gcstate)
            propertyname = `${gcaddress}, ${gccity}, ${gcstate}`;
        } else {
          var gcname = addrp.parse(propertyname);
          log.debug('geocode parsed name', JSON.stringify(gcname));
          recordObj.setValue({fieldId:'custrecord_property_geocode_response', value:JSON.stringify(gcname)});
          if (!gcname.hasOwnProperty('error')) {
            propertyname = `${gcname.stnumber} ${gcname.staddress}, ${gcname.city}, ${gcname.prov}`;
            var gcaddr=gcname.stnumber+' '+gcname.staddress;
            recordObj.setValue({fieldId:'custrecord_property_address', value:gcaddr});
            log.debug('set address to: '+gcaddr);
            recordObj.setValue({fieldId:'custrecord_property_city', value:gcname.city});
            log.debug('set city to: '+gcname.city);
            recordObj.setValue({fieldId:'custrecord_property_state', value:gcname.prov});
            log.debug('set state to: '+gcname.prov);
            log.debug('name', name);
            recordObj.setValue({fieldId:'custrecord_property_geocode_error', value:''});
          } else {
            recordObj.setValue({fieldId:'custrecord_property_geocode_error', value:JSON.stringify(gcname.error)});
          }
        }
          // TO DO ---write geocoder error into property record---
          let myArray = propertyname.split("-");
          name = myArray[0];
          log.debug('name', name);
//        }
        let headerObj1 = {
          "apikey": "4e2ccfc66bc3b3a6cf4aca699f2360e6", //"24927cbc58d02f7074c8cd7fe97a0df9",//
          "accept": "application/json"
        };
        var url1 = 'https://api.gateway.attomdata.com/property/v3/preforeclosuredetails?combinedAddress=' + name;
        var response = https.get({
          url: url1,
          headers: headerObj1
        });

        let repbody = JSON.parse(response.body);
        var responseStatus = (repbody);
        var statuscode = response.code;
        log.debug('repbody', repbody);

        if (statuscode == 200 || statuscode == 0) {

          let preforeclosureDetails = repbody.PreforeclosureDetails;
          let preclosureDetails = preforeclosureDetails.Default
            //let recordLastUpdated=preclosureDetails[preclosureDetails.length - 1].recordLastUpdated;
            let foreclosureRecordingDate = preclosureDetails[preclosureDetails.length - 1].foreclosureRecordingDate;
          //   log.debug('recordLastUpdated',recordLastUpdated);
          log.debug('preclosureDetails', preclosureDetails[preclosureDetails.length - 1]);
          let defaultAmount = preclosureDetails[preclosureDetails.length - 1].defaultAmount;
          recordObj.setValue({
            fieldId: 'custrecord_default_amount',
            value: defaultAmount
          });
          log.debug('foreclosureRecordingDate' + defaultAmount, foreclosureRecordingDate);

          let auction = preforeclosureDetails.Auction;
          log.debug('preforeclosureDetails' + auction.length, auction);
          /* var date1 = new Date(foreclosureRecordingDate);
          var date2 = new Date(recordLastUpdated);
          log.debug('date1'+date1,'date2'+date2+'////'+date2.getDate()+'////////'+ date1.getDate())
          if( date2> date1){
          recordObj.setValue({
          fieldId: 'custrecord_foreclosure_event_date',
          value: new Date(recordLastUpdated)
          });
          }else {
          recordObj.setValue({
          fieldId: 'custrecord_foreclosure_event_date',
          value: new Date(foreclosureRecordingDate)
          });
          }*/

          recordObj.setValue({
            fieldId: 'custrecord_foreclosure_event_date',
            value: new Date(foreclosureRecordingDate)
          });
          if (auction.length > 0) {
            let auctiondateObj = auction[auction.length - 1];
            log.debug('auctiondateObj', auctiondateObj.auctionDate);
            if (auctiondateObj.auctionDate) {
              var column = new Array();
              var filter;
              column.push(search.createColumn({
                  name: "trandate",
                  summary: "GROUP",
                  sort: search.Sort.ASC,

                }));
              filter = [
                ["type", "anyof", "CustInvc"], "AND", ["mainline", "is", "T"],
                "AND",
                ["customer.parent", "anyof", estate]
              ];
              var searchObject = search.create({
                type: search.Type.INVOICE,
                columns: column,
                filters: filter
              });
              let dt1;
              var searchResultCount = searchObject.runPaged().count;
              log.debug("customrecord_propertySearchObj result count", searchResultCount);
              searchObject.run().each(function (result) {
                dt1 = result.getValue(result.columns[0]);
              });
              var d = new Date(dt1);
              var year = d.getFullYear();
              var month = d.getMonth();
              var day = d.getDate();
              var c = new Date(year - 1, month, day);
              log.debug('dt1' + c, dt1);
              var d1 = auctiondateObj.auctionDate;
              log.debug('auctiondateObj', d1)

              if (searchResultCount > 0) {
                var foreclosureDate = recordObj.getValue({
                  fieldId: 'custrecord_foreclosure_event_date'
                })
                  let dt2 = new Date(foreclosureDate);
                let dt3 = new Date(c);
                let dt4 = new Date(d1);

                log.debug(dt2, dt3);
                var diffDays = parseInt((dt2 - dt3) / (1000 * 60 * 60 * 24), 10);
                log.debug('dt2 < d1' + diffDays, dt2 >= dt3);
                if (dt2 >= dt3) {
                  recordObj.setValue({
                    fieldId: 'custrecord4',
                    value: 'YES'
                  });
                  recordObj.setValue({
                    fieldId: 'custrecord_auction_date',
                    value: auctiondateObj.auctionDate
                  });
                  /*}else if(dt4 >= dt3){
                  recordObj.setValue({
                  fieldId: 'custrecord4',
                  value: 'YES'
                  });
                  recordObj.setValue({
                  fieldId: 'custrecord_auction_date',
                  value: auctiondateObj.auctionDate
                  });
                   */
                } else {
                  recordObj.setValue({
                    fieldId: 'custrecord_foreclosure_event_date',
                    value: ''
                  });
                  recordObj.setValue({
                    fieldId: 'custrecord4',
                    value: 'NO'
                  });
                }
              }

            } else {
              recordObj.setValue({
                fieldId: 'custrecord_foreclosure_event_date',
                value: ''
              });
              recordObj.setValue({
                fieldId: 'custrecord4',
                value: 'NO'
              });
            }
          } else {
            recordObj.setValue({
              fieldId: 'custrecord_foreclosure_event_date',
              value: ''
            });
            recordObj.setValue({
              fieldId: 'custrecord4',
              value: 'NO'
            });
          }

        }

      } catch (e) {

        log.debug('ERROR', e);
      }

      let recordId = recordObj.save({
        enableSourcing: true,
        ignoreMandatoryFields: true
      });
      log.debug('record saved with Id: '+ recordId);
      mapContext.write({
        key: recordId,
        value: recordId
      })
    } catch (e) {
      log.error('ERROR (recordObj not saved)', JSON.stringify(e))
    }
  }

  /**
   * Defines the function that is executed when the summarize entry point is triggered. This entry point is triggered
   * automatically when the associated reduce stage is complete. This function is applied to the entire result set.
   * @param {Object} summaryContext - Statistics about the execution of a map/reduce script
   * @param {number} summaryContext.concurrency - Maximum concurrency number when executing parallel tasks for the map/reduce
   *     script
   * @param {Date} summaryContext.dateCreated - The date and time when the map/reduce script began running
   * @param {boolean} summaryContext.isRestarted - Indicates whether the current invocation of this function is the first
   *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
   * @param {Iterator} summaryContext.output - Serialized keys and values that were saved as output during the reduce stage
   * @param {number} summaryContext.seconds - Total seconds elapsed when running the map/reduce script
   * @param {number} summaryContext.usage - Total number of governance usage units consumed when running the map/reduce
   *     script
   * @param {number} summaryContext.yields - Total number of yields when running the map/reduce script
   * @param {Object} summaryContext.inputSummary - Statistics about the input stage
   * @param {Object} summaryContext.mapSummary - Statistics about the map stage
   * @param {Object} summaryContext.reduceSummary - Statistics about the reduce stage
   * @since 2015.2
   */
  const summarize = (summaryContext) => {
    try {
      let type = summaryContext.toString();
      let totalProcess = 0;
      summaryContext.output.iterator().each(function (key, value) {
        totalProcess++;
        return true;
      });
      // Log details about the total number of pairs saved.
      log.audit("Total Records:" + totalProcess, "Time:" + summaryContext.seconds + " | Yields : " + summaryContext.yields + "| Concurrency :" + summaryContext.concurrency + "| Usage: " + summaryContext.usage);

    } catch (e) {
      log.error('error', JSON.stringify(e));
    }

  }
  /**
   * Get the search result
   */
  var getSearchResult = (pagedDataObj) => {
    var pagedData = pagedDataObj.runPaged({
      pageSize: 1000
    });
    var resultDetails = new Array();
    pagedData.pageRanges.forEach(function (pageRange) {
      var myPage = pagedData.fetch({
        index: pageRange.index
      });
      myPage.data.forEach(function (result) {
        resultDetails.push(result);
      });
    });

    return resultDetails;
  };

  return {
    getInputData,
    map,
    summarize
  }

});
function getLastWeek() {
  var today = new Date();
  var lastWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 14);
  return lastWeek;
}
