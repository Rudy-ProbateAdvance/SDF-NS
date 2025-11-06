/**
 *@NApiVersion 2.x
 *@NScriptType restlet
 */

define(['N/record', 'N/search', 'N/error', 'N/log'], function (record, search, error, log) {

    function findById(type, id) {
        return record.load({
            type: type,
            id: id,
        });
    }

    function post(context) {

        context.errors = [];

        for (var i = 0; i < context.records.length; i++) {
            var r = context.records[i];
            var rec = null;

            try {
                if (!!r.id) {
                    rec = findById(context.recordType, r.id);
                } else {
                    rec = record.create({
                        type: context.recordType,
            			isDynamic: true
                    });
                }

                for (var field in r) {
                    if (field !== 'id') {
                      
                      var f = rec.getField({ fieldId: field });
                      
                      if (f) {
                        if (f && f.type === 'date') {
                            rec.setValue(field, new Date(r[field]));
                        } else {
                            rec.setValue(field, r[field]);
                        }
                      } else {
                        var list = rec.getSublist({sublistId: field})
                        if (list) {
                        
                          var items = JSON.parse(r[field]);
                          
                          for (var j = 0; j < items.length; j++)
                          {
                              rec.selectNewLine({sublistId: field});
                              for (var subField in items[j])
                                {
                                  rec.setCurrentSublistValue({
                                    sublistId: field,
                                    fieldId: subField,
                                    value: items[j][subField],
                                  });
                                }
                           	  rec.commitLine({sublistId: field});
                          }
                        }
                        
                      }
                      	
                    }
                }

                rec.save();


            } catch (e) {
                context.errors.push(e);

                if (!context.continueOnError) {
                    break;
                }
            }
            
        }
        context.records = null;

        return context;
    }

    return {
        post: post
    }
});