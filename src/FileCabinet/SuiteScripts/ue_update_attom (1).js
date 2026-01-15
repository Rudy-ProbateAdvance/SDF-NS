/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/https', 'N/search', 'N/format', 'SuiteScripts/Libraries/GeocodeAddressParse.js'],
  /**
   * @param{search} search
  @param{record} record
   */
  (record, https, search, format, addrp) => {
  /**
   * Defines the function definition that is executed before record is submitted.
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {Record} scriptContext.oldRecord - Old record
   * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
   * @since 2015.2
   */
  const beforeSubmit = (scriptContext) => {
    try {}
    catch (e) {
      log.error('e', error);
    }
  }
  /**
   * Defines the function definition that is executed after record is submitted.
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {Record} scriptContext.oldRecord - Old record
   * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
   * @since 2015.2
   */
  const afterSubmit = (scriptContext) => {
    log.debug("-BEGIN-");
    try {
      var msg;
      var attom_error;
      var recObj = scriptContext.newRecord;
      let recordObj = record.load({
        type: recObj.type,
        id: recObj.id
      });
      if(recordObj.getValue({fieldId: 'name'}).trim().toUpperCase()=='RP')
        return true;
      log.debug('scriptContext type', scriptContext.type);
      var note = recordObj.getValue({
        fieldId: 'custrecord_notes'
      });
      var sole = recordObj.getValue({
        fieldId: 'custrecord_sold'
      });
      var escrow = recordObj.getValue({
        fieldId: 'custrecord_escrow'
      });
      log.debug('sold: ' + sole, 'note: ' + note);

//      if (scriptContext.type == 'xedit' && (note != '' || sole || escrow == true || escrow == false)) {
//        return;
//      }
      var saleAmount;

      try {
        var propertyname = recordObj.getValue({
          fieldId: 'name'
        }).replace(/["']/g, '').replace(/\(.*\)/g, ' ').replace(/\[.*\]/g, ' ').trim();
        var gcaddress=recordObj.getValue('custrecord_property_address');
        var gccity=recordObj.getValue('custrecord_property_city');
        var gcstate=recordObj.getValue('custrecord_property_state');
        var needsupdate=recordObj.getValue('custrecord_property_address_to_update');
//        recordObj.setValue({fieldId:'custrecord_property_reviewaddress', value:false});
        if(!needsupdate) {
          log.debug('validate address unchecked - skipping lookup');
//          if(gcaddress && gccity && gcstate)
//            propertyname = `${gcaddress}, ${gccity}, ${gcstate}`;
        } else {
          try { /*************************************************
                 ******* Do Google Maps Address Validation *******
                 *************************************************/
            var gcdata=addrp.parse(propertyname);
            log.debug({title:'parsed address results', details:JSON.stringify(gcdata)});
            if (!gcdata.error) {
              var gcaddr = gcdata.parsedaddress;
              gcdata.origname=propertyname;
              log.debug('geocode parsed name', JSON.stringify(gcdata));
              recordObj.setValue({fieldId:'name', value:gcaddr});
              log.debug('set name to '+gcaddr);
              recordObj.setValue({fieldId: 'custrecord_property_address', value: gcdata.components.streetaddress});
              log.debug('set address to: ' + gcdata.components.streetaddress);
              recordObj.setValue({fieldId: 'custrecord_property_city', value: gcdata.components.city});
              log.debug('set city to: ' + gcdata.components.city);
              recordObj.setValue({fieldId: 'custrecord_property_state', value: gcdata.components.state});
              log.debug('set state to: ' + gcdata.components.state);
              recordObj.setValue({fieldId: 'custrecord_property_zipcode', value: gcdata.components.zip});
              log.debug('set state to: ' + gcdata.components.zip);
              recordObj.setValue({fieldId:'custrecord_property_geocode_error', value:'Successful - no error'});
              recordObj.setValue({fieldId:'custrecord_property_lat', value:gcdata.latlon.latitude});
              log.debug('set latitude to: ' + gcdata.latlon.latitude);
              recordObj.setValue({fieldId:'custrecord_property_lon', value:gcdata.latlon.longitude});
              log.debug('set longitude to: ' + gcdata.latlon.longitude);
              recordObj.setValue({fieldId:'custrecord_property_zillowlink', value:gcdata.zillow});
              log.debug('set zillow link to '+gcdata.zillow);
              recordObj.setValue({fieldId:'custrecord_property_googlemapslink', value:gcdata.googlemaps});
              log.debug('set google link to '+gcdata.googlemaps);
              propertyname = gcaddr;
              recordObj.setValue({fieldId:'custrecord_property_address_to_update', value:false});
            } else {
              if(gcdata.error.message=='no address provided') {
                recordObj.setValue({fieldId:'custrecord_property_address_to_update', value:false});
              } else {
                email.send({author:2410713, recipients:2299863, subject:'Error validating address', body:JSON.stringify(gcdata.error)});
              }
              recordObj.setValue({fieldId: 'custrecord_property_geocode_error',value: JSON.stringify(gcdata.error)});
              var error=true;
            }
            if(!!gcdata.response.result.verdict.hasUnconfirmedComponents || !!gcdata.error) {
              recordObj.setValue({fieldId: 'custrecord_property_reviewaddress', value: true});
              log.debug('checked "review Address"');
            }
          } catch(e) {
            log.debug('ERROR: '+e.message, JSON.stringify(e));
          }
        }
        recordObj.setValue({fieldId: 'custrecord_property_geocode_response', value: JSON.stringify(gcdata)});

        // split the address with comm based Swagger addresss format
        var name = propertyname.split(',');
        log.debug('name', name);
        log.debug('raw name', recordObj.getValue({
            fieldId: 'name'
          }));
        if (name.length > 1) {
          var city = name[1];
          var address = name[0];
          let headerObj2 = {
            "apikey": "4e2ccfc66bc3b3a6cf4aca699f2360e6", /*"24927cbc58d02f7074c8cd7fe97a0df9",*/
            "accept": "application/json"
          };
          let headerObj1 = {
            "apikey": "4e2ccfc66bc3b3a6cf4aca699f2360e6", /*"24927cbc58d02f7074c8cd7fe97a0df9",*/
            "accept": "application/json"
          };
          //var url2 = 'https://api.gateway.attomdata.com/propertyapi/v1.0.0/sale/detail?address1=' + name[0];
          var url2 = 'https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/basicprofile?address1=' + name[0];
          var url1 = 'https://api.gateway.attomdata.com/propertyapi/v1.0.0/valuation/homeequity?address1=' + name[0];

          if (name.length > 2) {
            url1 += '&address2=' + name[1] + name[2];
            url2 += '&address2=' + name[1] + name[2];
          } else if (name.length > 1) {
            url1 += '&address2=' + name[1];
            url2 += '&address2=' + name[1]
          }
          try {
            var response = https.get({
              url: url2,
              headers: headerObj1
            });
            var response1 = https.get({
              url: url1,
              headers: headerObj2
            });
            let repbody = JSON.parse(response.body);
            var responseStatus = (repbody);
            let repbody1 = JSON.parse(response1.body);
            var statuscode = response.code;
            var statuscode1 = response1.code;

            log.debug('statuscode', statuscode);

            if (statuscode == 401) {
              attom_error = responseStatus.Response.status.msg;
            } else if (statuscode == 400) {
              attom_error = repbody.status.msg
            }
            if (statuscode == 200 || statuscode == 0) {
              attom_error = 'Success';
              try {
                let property = repbody.property;
                log.debug('property', property);
                let apn = property[0].identifier.apn
                  let sale = property[0].sale;
                saleAmount = sale.saleAmountData.saleAmt;
                let saletranstype = sale.saleAmountData.saleTransType;
                let attomaddress = property[0].address.oneLine;
                let propType = property[0].summary.propType;
                let saledate = sale.saleAmountData.saleRecDate;
                if (saledate)
                  recordObj.setValue({
                    fieldId: 'custrecord_last_sale_date_attom',
                    value: saledate
                  });

                //let attomaddress = address.line1 + ',' + address.line2;
                log.debug('saledate', saledate);
                log.debug('saleAmount' + saletranstype, saleAmount);
                if (saleAmount) {
                  recordObj.setValue({
                    fieldId: 'custrecord_saleamount',
                    value: saleAmount
                  });
                }
                if (propType) {
                  recordObj.setValue({
                    fieldId: 'custrecord_property_type',
                    value: propType
                  });
                }
                let ownerdeatils = property[0].assessment.owner;
                log.debug('ownerdeatils', ownerdeatils)
                if (ownerdeatils) {
                  let owner_name = ownerdeatils.owner1.firstNameAndMi + ' ' + ownerdeatils.owner1.lastName
                    if (owner_name) {
                      recordObj.setValue({
                        fieldId: 'custrecord_owner_name',
                        value: owner_name
                      });
                    }
                }

                if (apn) {
                  recordObj.setValue({
                    fieldId: 'custrecord_apn',
                    value: apn
                  });
                }
                log.debug('attomaddress', attomaddress);
                if (attomaddress) {
                  recordObj.setValue({
                    fieldId: 'custrecord_attom_address',
                    value: attomaddress
                  });
                }
              } catch (e) {
                log.error('ERROR', e)
              }
            }
            try {
              if (statuscode1 == 401) {
                attom_error = repbody1.Response.status.msg;
              } else if (statuscode1 == 400) {
                attom_error = repbody1.Response.status.msg;
              }
              if (statuscode1 == 200) {
                let property1 = repbody1.property;
                log.debug('property1', property1);
                let homeEquity = property1[0].homeEquity;
                let totalEstimatedLoanBalance = homeEquity.totalEstimatedLoanBalance;
                let recordLastUpdated = homeEquity.recordLastUpdated;
                if (totalEstimatedLoanBalance)
                  recordObj.setValue({
                    fieldId: 'custrecord_est_mortage_amt_attom',
                    value: totalEstimatedLoanBalance
                  });
                if (recordLastUpdated)
                  recordObj.setValue({
                    fieldId: 'custrecord_est_mortage_amt_last_update',
                    value: recordLastUpdated
                  })
                  log.debug('homeEquity', homeEquity);
              }
            } catch (e) {
              log.error('ERROR', e)
            }
          } catch (e) {
            log.error('ERROR', e)
          }
        } else {
          attom_error = 'Must provide proper address'
        }
      } catch (e) {

        log.debug('ERROR', e);
      }
      if (attom_error != 'undefined' || (attom_error == 'SuccessWithResult' && saleAmount != '')) {
        recordObj.setValue({
          fieldId: 'custrecord_attom_error',
          value: attom_error
        });
      }
      let recordId = recordObj.save({
        enableSourcing: true,
        ignoreMandatoryFields: true
      });
      log.debug('recordId', recordId);
    } catch (e) {
      log.debug('ERROR', JSON.stringify(e));
    }
  }

  return {
    afterSubmit
  }

});
