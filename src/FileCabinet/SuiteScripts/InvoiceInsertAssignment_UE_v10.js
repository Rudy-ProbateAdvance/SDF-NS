/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       16 Feb 2021     Administrator
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only) 
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function insertAssignmentAfterSubmit(type){
    var invoice_id = nlapiGetRecordId();
    var invoice_rec = nlapiGetNewRecord();

    customerId = invoice_rec.getFieldValue("entity");
    customer = nlapiLoadRecord("customer",customerId);            
    estateId = customer.getFieldValue("parent");

	if(type == "create") {
        
        var assign_rec = nlapiCreateRecord('customrecord_existing_assignment');
        
        assign_rec.setFieldValue("name", "Probate Advance #"+invoice_rec.getFieldValue("tranid"));
        assign_rec.setFieldValue("custrecord_existing_assignment_invoice", invoice_id);
        assign_rec.setFieldValue("custrecord_existing_assignment_customer", customerId);
        assign_rec.setFieldValue("custrecord_existing_assignment_estate", estateId);
        assign_rec.setFieldValue("custrecord_existing_assignment_date", invoice_rec.getFieldValue("trandate"));
        assign_rec.setFieldValue("custrecord_existing_assignment_amount", parseInt(invoice_rec.getFieldValue("custbody_assignment_size")));
        
        var id = nlapiSubmitRecord(assign_rec, true, true);
        nlapiLogExecution("debug","Added Assignment", id);    
    }else
    if(type == "edit" ){
        
        var filters = [];
        filters.push(new nlobjSearchFilter("custrecord_existing_assignment_invoice",null,"is",invoice_id));
        var cols = [];
        cols.push(new nlobjSearchColumn("name"));
        cols.push(new nlobjSearchColumn("custrecord_existing_assignment_date"));
        cols.push(new nlobjSearchColumn("custrecord_existing_assignment_amount"));
        var results = nlapiSearchRecord("customrecord_existing_assignment", null, filters, cols);
        
        if(results == null )
        {
            var assign_rec = nlapiCreateRecord('customrecord_existing_assignment');
            
            assign_rec.setFieldValue("name", "Probate Advance #"+invoice_rec.getFieldValue("tranid"));
            assign_rec.setFieldValue("custrecord_existing_assignment_invoice", invoice_id);
            assign_rec.setFieldValue("custrecord_existing_assignment_customer", customerId);
            assign_rec.setFieldValue("custrecord_existing_assignment_estate", estateId);
            assign_rec.setFieldValue("custrecord_existing_assignment_date", invoice_rec.getFieldValue("trandate"));
            assign_rec.setFieldValue("custrecord_existing_assignment_amount", parseInt(invoice_rec.getFieldValue("custbody_assignment_size")));

            var id = nlapiSubmitRecord(assign_rec, true, true);
        }else
            nlapiLogExecution("debug","Existing Assignment", "");    
    }
}
