/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define(['N/record', 'N/https', 'N/search', 'N/ui/serverWidget', 'N/runtime'],
  /**
   * @param{record} record
   * @param{https } https 
   * @param{search} search
   * @param{serverWidget} serverWidget
   */
  (record, https, search, serverWidget, runtime) => {

    const onRequest = (scriptContext) => {
      try {
        var invoices = scriptContext.request.parameters.invoices;
invoices=invoices.split(",")
        try {
          var form = serverWidget.createForm({
            title: 'STAMPED ASSIGNMENT ',
            hideNavBar: false
          });
          if (scriptContext.request.method == 'GET') {
            var userObj = runtime.getCurrentUser();
            log.debug('Internal ID of current user: ' + userObj.id);
            var user = userObj.id;
            form.addFieldGroup({
              id: 'custpage_fieldgroup_filters',
              label: 'Filters'
            });
            form.addSubtab({
              id: 'custpage_subtab1',
              label: 'STAMPED ASSIGNMENT'
            });
            var sublist = form.addSublist({
              id: 'custpage_sublist',
              type: serverWidget.SublistType.LIST, //INLINEEDITOR
              label: 'STAMPED ASSIGNMENT',
              tab: 'custpage_subtab1'
            });
            var internalId = sublist.addField({
              id: 'custpage_invoice',
              type: serverWidget.FieldType.TEXT,
              label: 'Invoice'
            })
            var internalId = sublist.addField({
              id: 'custpage_stamped',
              type: serverWidget.FieldType.TEXT,
              label: 'STAMPED ASSIGNMENT'
            })


            var invoiceSearchObj = search.create({
              type: "invoice",
              filters: [
                ["type", "anyof", "CustInvc"],
                "AND",
                ["mainline", "is", "T"],
                "AND",
                ["internalid", "anyof", invoices]
              ],
              columns: [
                search.createColumn({
                  name: "trandate",
                  sort: search.Sort.ASC,
                  label: "Date"
                }),
                search.createColumn({
                  name: "tranid",
                  label: "Document Number"
                }),
                search.createColumn({
                  name: "custbody_stamped_assignment",
                  label: "Stamped Assignment"
                })
              ]
            });
            let documettJson = {};
            var searchResultCount = invoiceSearchObj.runPaged().count;
            let documents = [];
            invoiceSearchObj.run().each(function (result) {
              documents.push(result.getValue({
                name: 'custbody_stamped_assignment'
              }));
              return true;
            });
            log.debug("invoiceSearchObj result count", searchResultCount);
            if (documents.length > 0) {
              var fileSearchObj = search.create({
                type: "file",
                filters: [
                  ["internalid", "anyof", documents]
                ],
                columns: [
                  search.createColumn({
                    name: "name",
                    sort: search.Sort.ASC,
                    label: "Name"
                  }),
                  search.createColumn({
                    name: "url",
                    label: "URL"
                  }),
                ]
              });
              fileSearchObj.run().each(function (result) {
                documettJson[result.id] = {
                  'url': result.getValue({
                    name: 'url'
                  }),
                  'name': result.getValue({
                    name: 'name'
                  })
                }
                return true;
              });
            }
            let i = 0;
            invoiceSearchObj.run().each(function (result) {
              let fieldId = result.getValue({
                name: 'custbody_stamped_assignment'
              });
              if(documettJson.hasOwnProperty(fieldId)){
              let fileurl = "<a href=" + documettJson[fieldId].url + " target='_blank'>" + documettJson[fieldId].name + "</a>";
                sublist.setSublistValue({
                  id: 'custpage_invoice',
                  line: i,
                  value: result.getValue({
                    name: 'tranid'
                  })
                });
              sublist.setSublistValue({
                id: 'custpage_stamped',
                line: i,
                value: fileurl
              });
              i++;}
              return true;
            });

            scriptContext.response.writePage(form);

          }

        } catch (e) {
          log.error('ERROR IS', e)
        }




      } catch (e) {
        log.error("Caught exception in onRequest ", e + " " + e.stack)
      }
    }
    return {
      onRequest
    }

  });