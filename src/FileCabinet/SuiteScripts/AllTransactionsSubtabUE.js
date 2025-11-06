/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/search'], function(search){

  function beforeLoad(context){
    var form=context.form;
    var intid=context.newRecord.id;

    var form=context.form;
    var alltrans=form.addSubtab({id:'custpage_alltranstab', label:'All Transactions', tab:'rlrcdstab'});
    var translist=form.addSublist({type:'list', id:'custpage_alltransactions', label:'All Transactions', tab:'custpage_alltranstab'});
    translist.addField({type:'date', id:'custpage_trandate', label:'Date'});
    translist.addField({type:'text', id:'custpage_type', label:'Type'});
    translist.addField({type:'text', id:'custpage_tranid', label:'Number'});
    translist.addField({type:'text', id:'custpage_status', label:'Status'});
    translist.addField({type:'text', id:'custpage_account', label:'Account'});
    translist.addField({type:'currency', id:'custpage_amount', label:'Amount'});

    var s=search.create({
      type: "transaction",
      filters:
      [
        [[["type","anyof","Check"],"AND",["mainline","is","T"]],"OR",[["custcol_invoice","noneof","@NONE@"]],"OR",[["type","anyof","CustPymt"]], "OR", [["type", "anyof", "Deposit"]]], 
        "AND", 
        [["appliedtotransaction","anyof",intid],"OR",["custbody_invoice","anyof",intid],"OR",["custcol_invoice","anyof",intid]], 
      ],
      columns:
      [
        search.createColumn({
          name: "trandate",
          sort: search.Sort.ASC,
          label: "Date"
        }),
        search.createColumn({name: "type", label: "Type"}),
        search.createColumn({name: "tranid", label: "Document Number"}),
        search.createColumn({name: "statusref", label: "Status"}),
        search.createColumn({name: "account", label: "Account"}),
        search.createColumn({name: "amount", label: "Amount"})
      ]
    });
    linecount=0;
    s.run().each(function(result){
      var trandate=result.getValue('trandate')||null;
      var type=result.getValue('type')||null;
      var tranid=result.getValue('tranid')||null;
      var status=result.getValue('statusref')||null;
      var account=result.getText('account')||null;
      var amount=result.getValue('amount')||null;
      amount=type=='CustPymt'?-amount:amount;
      translist.setSublistValue({id:'custpage_trandate', value:trandate, line:linecount});
      translist.setSublistValue({id:'custpage_type', value:type, line:linecount});
      translist.setSublistValue({id:'custpage_tranid', value:tranid, line:linecount});
      translist.setSublistValue({id:'custpage_status', value:status, line:linecount});
      translist.setSublistValue({id:'custpage_account', value:account, line:linecount});
      translist.setSublistValue({id:'custpage_amount', value:amount, line:linecount++});
      return true;
    });
    return true;
  }

  return {
    beforeLoad:beforeLoad,
  };
});