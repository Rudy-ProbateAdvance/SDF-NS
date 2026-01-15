/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/search'], function (record, search) {

  function afterSubmit(context) {

    try {
      var crrRcd = context.newRecord;
      crrRcd = record.load({
        type: crrRcd.type,
        id: crrRcd.id
      });
      var cust_id = crrRcd.getValue("custrecord_property_estate");
      log.debug("estate id: "+ cust_id);

      if (cust_id) {
        var customrecord_propertySearchObj = search.create({
          type: "customrecord_property",
          filters: [
            ["custrecord_property_estate", "anyof", cust_id]
          ],
          columns: [
            search.createColumn({name: "name", sort: search.Sort.ASC, label: "Name"}),
            search.createColumn({name: "internalid", label: "Internal ID"}),
            search.createColumn({name: "custrecord_dot", label: "DOT"}),
            search.createColumn({name: "custrecord_property_lispendens", label: "Lis Pendens"}),
            search.createColumn({name: "custrecord_property_moi", label: "MOI"}),
            search.createColumn({name: "custrecord_escrow", label: "Escrow"})
          ]
        });
        var searchResultCount = customrecord_propertySearchObj.runPaged().count;
//        log.debug("customrecord_propertySearchObj result count", searchResultCount);
        var dot_arr = [];
        var escrow_arr = [];
        var lis_arr = [];
        var moi_arr = [];
        var count = 0;
        customrecord_propertySearchObj.run().each(function (result) {
          var dot_obj = result.getValue('custrecord_dot');
//          log.debug("dot_obj", dot_obj);
          var escrow_obj = result.getValue('custrecord_escrow');
//          log.debug("escrow_obj", escrow_obj);
          var lis_obj = result.getValue('custrecord_property_lispendens');
//          log.debug("lis_obj", lis_obj);
          var moi_obj = result.getValue('custrecord_property_moi');
//          log.debug("moi_obj", moi_obj);
          if (dot_obj == 1 || dot_obj == 2) {
            dot_arr.push(count);
          }
          if (escrow_obj == true) {
            escrow_arr.push(count);
          }
          if (lis_obj == true) {
            lis_arr.push(count);
          }
          if (moi_obj == true) {
            moi_arr.push(count);
          }
          return true;
        });

        var escval = (escrow_arr.length > 0) ? true : false;
        var lisval = (lis_arr.length > 0) ? true : false;
        var moival = (moi_arr.length > 0) ? true : false;
        var dotval = (dot_arr.length > 0) ? true : false;
        
        var valuesobj={
          custentity_escrow: escval,
          custentity_lispendens: lisval,
          custentity_moi: moival,
          custentity_dot: dotval
        };
        var optionsobj={
          enableSourcing: true,
          ignoreMandatoryFields: true
        };
        log.audit("values:", JSON.stringify(valuesobj));
        var cust_obj = record.submitFields({type: 'customer', id: cust_id, values: valuesobj, options: optionsobj});
        log.audit("updated estate " + cust_obj);


        var customerSearchObj = search.create({
          type: "customer",
          filters: [
            ["parentcustomer.internalidnumber", "equalto", cust_id]
          ]
        });
        customerSearchObj.run().each(function (result) {
          var custId = result.id;
          var cust_obj = record.submitFields({type: 'customer', id: custId, values: valuesobj, options: optionsobj});
          log.audit("updated customer " + cust_obj);
          return true;
        });
      }
    } catch (error) {
      log.error("error", error);
    }
  }

  return {
    afterSubmit: afterSubmit
  }
});