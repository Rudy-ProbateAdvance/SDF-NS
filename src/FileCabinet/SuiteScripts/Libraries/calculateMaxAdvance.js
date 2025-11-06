define(['N/runtime', 'N/record', 'N/query', 'SuiteScripts/Libraries/RM-functions.js'], function(runtime, record, query, rmfunc){
  function getMaxAdvance(rec, newrec) {
    var changedfields=[];
    if(rec != null) {
      var parent=rec.getValue('parent');
      var recid=rec.id;
      newrec.getFields().forEach(function(fieldname){
        if(!['sys_id', '_submit_field_mode', 'stage', 'e', 'singleparam', 'id'].includes(fieldname)) {
          changedfields.push(fieldname);
        }
        return true;
      });
      var retval={customers:{}, estate:{}};
      var results;
      var estval=null;
      var custval=null;
      var custintid=null;
      var estintid=null;
      if(rec.getValue('category')==1) { // customer record
        custintid=rec.id;
        estintid=parent;
        custval=readcurrentcustomervalues(rec);
        changedfields.forEach(function(fieldname) {
          custval[fieldname]=newrec.getValue(fieldname);
          return true;
        });
        estval=lookupestatevalues(estintid);
        results=calculate(estval, custval);
        retval.estate=results.estate;
        retval.estintid=estintid;
        retval.customers[results.custintid]=results.customer;
      } else { // estate record
        estintid=rec.id;
        estval=readcurrentestatevalues(rec);
        changedfields.forEach(function(fieldname) {
          estval[fieldname]=newrec.getValue(fieldname);
          return true;
        });
        var custvals=lookupcustomervalues(estintid);
        for(var i in custvals) {
          custval=custvals[i];
          results=calculate(estval,custval);
          retval.estate=results.estate;
          retval.customers[results.custintid]=results.customer;
        }
      }
      return retval;
    }
  }
  
  function calculate(estval, custval) {
    var estintid=estval.estintid;
    var custintid=custval.custintid;
    var retval={};
    retval.customer={};
    retval.estate={};
    retval.custintid=custintid;
    retval.estintid=estintid;
    var properties=0.0;
    var assets=0.0;
    var claims=0.0;
    var closing=0.0;
    var assignments=0.0;
    var liens=0.0;
    var closingcosts=0.0;
    var fee=0.0;
    var attorneyFee=0.0;
    var netEquity=0.0;
    var percentDue=0.0;
    var residual=0.0;
    var bequest=0.0;
    var totalDueFromEstate=0.0;
    var netDue=0.0;
    var advToValRatio=0.0;
    var specificBequests=0.0;

    assignments=custval.custentity_customer_totalassignments;
    liens=custval.custentity_customer_totalliens;
    properties=estval.custentity_estate_total_property;
    assets=estval.custentity_estate_total_assets;
    claims=estval.custentity_estate_total_claims;
    closingcosts=estval.custentity_estate_closingcosts;
    specificBequests=estval.custentity_specific_bequests_due_to_heir||0;
    fee=(properties+assets)*0.06;
    attorneyFee=fee>3000?fee:3000;
    netEquity=properties+assets-claims-specificBequests-closingcosts-attorneyFee;
    percentDue=parseFloat(custval.custentity_percent_estate_due_to_custome/100);
    if(percentDue==null || percentDue=='') {
      percentDue=1.0;
    }
    residual=netEquity*percentDue;
    bequest=parseFloat(custval.custentity_specific_bequest_due_to_cust)||0;
    totalDueFromEstate=residual+bequest;
    netDue=totalDueFromEstate-liens-assignments;
    advToValRatio=(parseFloat(custval.custentity_advance_to_value_ratio)||36)/100;
    var maxAdvance=netDue*advToValRatio;
      
    retval.estate.custentity_estate_total_property=properties;
    retval.estate.custentity_estate_total_assets=assets;
    retval.estate.custentity_estate_total_claims=claims;
    retval.estate.custentity_estate_attorneyfee=attorneyFee;
    retval.estate.custentity_estate_closingcosts=closingcosts;
    retval.estate.custentity_specific_bequests_due_to_heir=specificBequests;
    retval.estate.custentity_estate_net_equity=netEquity;
    
    retval.customer.custentity_customer_totalassignments=assignments;
    retval.customer.custentity_customer_totalliens=liens;
    retval.customer.custentity_percent_estate_due_to_custome=percentDue;
    retval.customer.custentity_customer_residueestatedue=residual;
    retval.customer.specificBequestDueToCustomer=bequest;
    retval.customer.custentity_customer_totalduefromestate=totalDueFromEstate;
    retval.customer.custentity_customer_netduefromestate=netDue;
    retval.customer.custentity_advance_to_value_ratio=advToValRatio;
    retval.customer.custentity_customer_maxadvancesize=maxAdvance;

    return retval;

  }


  function readcurrentestatevalues(rec) {
    var estate={};
    try {
      estate.estintid=rec.id;
      estate.custentity_estate_total_property=rec.getValue('custentity_estate_total_property');
      estate.custentity_estate_total_assets=rec.getValue('custentity_estate_total_assets');
      estate.custentity_estate_total_claims=rec.getValue('custentity_estate_total_claims');
      estate.custentity_specific_bequests_due_to_heir=rec.getValue('custentity_specific_bequests_due_to_heir');
//      estate.custentity_estate_attorneyfee=rec.getValue('custentity_estate_attorneyfee');
//      estate.custentity_estate_closingcosts=rec.getValue('custentity_estate_closingcosts');
//      estate.custentity_estate_net_equity=rec.getValue('custentity_estate_net_equity');
    } catch(e) {
      estate.error={name:e.name, message:e.message};
    }
  
    return estate;
  }
  
  
  
  
  function lookupestatevalues(estintid) {
    var estatequery=`
      select 
  	    e.id as estintid,
          e.custentity_estate_total_property,
          e.custentity_estate_total_assets,
          e.custentity_estate_total_claims,
/*          e.custentity_estate_attorneyfee,  */
          e.custentity_estate_closingcosts, 
/*          e.custentity_estate_net_equity,   */
          e.custentity_specific_bequests_due_to_heir
      from
          customer e
      where
          e.id=${estintid}
    `;
    var rs=query.runSuiteQL({query:estatequery}).asMappedResults();
    var estate={};
    if(rs.length>0) {
      var result=rs[0];
      var custintid=result.custintid;
      estate=result;
    } else {
      estate.error="no estate found";
    }
    return estate;
  }
  
  function lookupproperties(estintid) {
    var propertyquery=`
      select
          e.id as estintid,
          sum(nvl(p.custrecord_property_total,0)) as properties,
          sum(nvl(p.custrecord_property_value,0)*nvl(p.custrecord_property_percent_owned,1.0)) as closing
      from
          customer e
          left outer join customrecord_property p on p.custrecord_property_estate = e.id
      where
          e.id=${estintid}
      group by
          e.id
    `;
    var propdata={};
    propdata.properties=0;
    propdata.closing=0;
    propdata.closingcosts=0;
    var rs=query.runSuiteQL({query:propertyquery}).asMappedResults();
    if(rs.length>0) {
      propdata.properties=rs[0].properties;
      propdata.closing=rs[0].closing;
      propdata.closingcosts=closing*0.06;
    }
    return propdata;
  }
  
  
  function lookupassets(estintid) {
    var assetquery=`
        select
          e.id as estintid,
          sum(nvl(a.custrecord_asset_value,0)) as assets,
        from
          customer e
          left outer join customrecord_asset a on a.custrecord_asset_estate = e.id
        where
          e.id = ${estintid}
        group by
          e.id
      `;
    var assets=0;
    var rs=query.runSuiteQL({query:assetquery}).asMappedResults();
    if(rs.length>0) {
      assets=rs[0].assets;
    }
    return assets;
  }
  
  
  function lookupclaims(estintid) {
      var claimquery=`
        select
          e.id as estintid,
          sum(nvl(c.custrecord_claim_value,0)) as claims,
        from
          customer e
          left outer join customrecord_claim c on c.custrecord_claim_estate = e.id
        where
          e.id = ${estintid}
        group by
          e.id
      `;
    var rs=query.runSuiteQL({query:claimquery}).asMappedResults();
    var claims=0;
    if(rs.length>0) {
      claims=rs[0].claims;
    }
    return claims;
  }
  
  
  
  function readcurrentcustomervalues(rec) {
    var customer={};
    try{
      customer.custintid=rec.id;
      customer.custentity_specific_bequest_due_to_cust=rec.getValue('custentity_specific_bequest_due_to_cust')||0;
      customer.custentity_percent_estate_due_to_custome=rec.getValue('custentity_percent_estate_due_to_custome')||100;
      customer.custentity_advance_to_value_ratio=rec.getValue('custentity_advance_to_value_ratio')||36;
      customer.custentity_customer_totalassignments=rec.getValue('custentity_customer_totalassignments')||0;
      customer.custentity_customer_totalliens=rec.getValue('custentity_customer_totalliens')||0;
//      customer.custentity_customer_residueestatedue=rec.getValue('custentity_customer_residueestatedue');
//      customer.custentity_customer_totalduefromestate=rec.getValue('custentity_customer_totalduefromestate');
//      customer.custentity_customer_netduefromestate=rec.getValue('custentity_customer_netduefromestate');
//      customer.custentity_customer_maxadvancesize=rec.getValue('custentity_customer_maxadvancesize');
    } catch(e) {
      customer.error={name:e.name, message:e.message};
    }
  
    return customer;
  }
  
  
  function lookupcustomervalues(estintid) {
    var customers={};  
    var customerquery=`
      select 
      	c.id as custintid,
      	nvl(c.custentity_specific_bequest_due_to_cust,0) as custentity_specific_bequest_due_to_cust,
      	nvl(c.custentity_percent_estate_due_to_custome,100) as custentity_percent_estate_due_to_custome,
      	nvl(c.custentity_advance_to_value_ratio,.36) as custentity_advance_to_value_ratio,
      	c.custentity_customer_totalassignments,
      	c.custentity_customer_totalliens,
      	c.custentity_customer_residueestatedue,
      	c.custentity_customer_totalduefromestate,
      	c.custentity_customer_netduefromestate,
      	c.custentity_customer_maxadvancesize
      from customer c
      where c.parent =${estintid}
    `;
    var rs=query.runSuiteQL({query:customerquery}).asMappedResults();
    if(rs.length>0) {
      rs.forEach(function(result) {
        var custintid=result.custintid;
        if(!customers.hasOwnProperty(custintid)) {
          customers[custintid]=result;
        }
      });
    } else {
      customers.error="no customers found";
    }
    return customers;
  }
  
  function lookupassignments(custintid) {
      var assignmentquery=`
        select
          c.id as custintid,
          sum(nvl(a.custrecord_existing_assignment_amount,0)) as assignments,
        from
          customer c
          join customrecord_existing_assignment a on a.custrecord_existing_assignment_customer = c.id
        where
          c.id = ${custintid}
        group by
          c.id
      `;
      var rs=query.runSuiteQL({query:assignmentquery}).asMappedResults();
      var assignments=0;
    if(rs.length>0) {
      assignments=parseInt(rs[0].assignments)||0;
    }
      return assignments;
  }
  
  
  function lookupliens(custintid) {
    var lienquery=`
      select
        c.id as custintid,
        sum(nvl(l.custrecord_lein_judgement_amount,0)) as liens
      from
        customer c
        join customrecord_lein_judgement l on l.custrecord_lein_judgement_customer=c.id
      where
        c.id=${custintid}
      group by
        c.id
    `;
    var rs=query.runSuiteQL({query:lienquery}).asMappedResults();
    var liens=0;
    if(rs.length>0) {
      liens=parseInt(rs[0].liens)||0;
    }
      return liens;
  }



  
  return {
	  getMaxAdvance:getMaxAdvance
  };
});


