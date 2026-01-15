/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/query', 'SuiteScripts/Libraries/calculateMaxAdvance.js', 'SuiteScripts/Libraries/RM-functions.js'], function (record, query, calcmaxadv, rmfunc) {

  function getInputData() {
    log.debug('-BEGIN-');

    var estatequery = `
      select 
    	id as estintid, 
        entityid || ' ' || altname as estid, 
    	custentity_specific_bequests_due_to_heir as bequestdue
      from 
    	customer 
      where 
--        category=2 and
--        custentity_tobeupdated='T' and
--    	id in (
--    	  select custrecord_property_estate as id from customrecord_property 
--    	  union 
--    	  select custrecord_claim_estate as id from customrecord_claim 
--    	  union 
--    	  select custrecord_asset_estate as id from customrecord_asset
--        )
        id=871292
      `;

    var results={};
    var estlst=[];

    var rs=rmfunc.getQueryResults(estatequery);
    rs.forEach(function (result) {
      estintid = result.estintid;
      estlst.push(estintid);
      if (!results.hasOwnProperty(estintid)) {
        results[estintid] = {
          customers: {},
          estid: result.estid,
          estintid: estintid
        };
        results[estintid].estate = {
          assettotal: 0,
          bequestduetoheirs: result.bequestdue || 0,
          claimtotal: 0,
          propertytotal: 0
        };
      }
    });

    var estatelist="'"+estlst.join("', '")+"'";

    var estatepropertyquery = `
      select 
          p.custrecord_property_estate as estintid, 
          sum(p.custrecord_property_total) as propertytotal, 
          sum(p.custrecord_property_value*p.custrecord_property_percent_owned) as propertyclosing
      from 
          customrecord_property p
  	  join 
          customer e on e.id=p.custrecord_property_estate
      where 
          p.custrecord_property_estate in (${estatelist})
      group by 
          p.custrecord_property_estate
      order by 
          p.custrecord_property_estate
  `;

    var estateassetquery = `
      select 
          a.custrecord_asset_estate as estintid, 
          e.entityid || ' ' || e.altname as estid, 
          sum(a.custrecord_asset_value) as assetvalue 
      from 
          customrecord_asset a
  	  join 
          customer e on e.id=a.custrecord_asset_estate
      where 
          a.custrecord_asset_estate in (${estatelist})
      group by 
          a.custrecord_asset_estate, e.entityid, e.altname
      order by 
          a.custrecord_asset_estate
    `;

    var estateclaimquery = `
      select 
          c.custrecord_claim_estate as estintid, 
          e.entityid || ' ' || e.altname as estid, 
          sum(c.custrecord_claim_value) as claimvalue 
      from 
          customrecord_claim c
  	  join 
          customer e on e.id=c.custrecord_claim_estate
      where 
          c.custrecord_claim_estate in (${estatelist})
      group by 
          c.custrecord_claim_estate, e.entityid, e.altname
      order by 
          c.custrecord_claim_estate
    `;

    var rs=rmfunc.getQueryResults(estatepropertyquery);
    rs.forEach(function (result) {
      var estintid = result.estintid;
      results[estintid].estate.propertytotal = result.propertytotal||0;
      results[estintid].estate.propertyclosing = result.propertyclosing||0;
    });

    var rs=rmfunc.getQueryResults(estateassetquery);
    rs.forEach(function (result) {
      estintid = result.estintid;
      results[estintid].estate.assettotal = result.assetvalue||0;
    });

    var rs=rmfunc.getQueryResults(estateclaimquery);
    rs.forEach(function (result) {
      estintid = result.estintid;
      results[estintid].estate.claimtotal = result.claimvalue||0;
    });

    log.debug("done with queries");
//    log.debug("random result", results[Object.keys(results)[parseInt(Math.random() * Object.keys(results).length)]]);
//    log.debug("planned result", results[448899]);
    log.debug("begin calculations");

    var retval = {};
    for (i in results) {
      var estintid = i;
      var currentestate = {};
      currentestate.estate = {};
      currentestate.customers = {};
      var result = results[estintid];
      currentestate.estintid = estintid;
      currentestate.estid = result.estid;

      var propertytotal = result.estate.propertytotal;
      currentestate.estate.custentity_estate_total_property = parseInt(propertytotal)||0;
      var assettotal = result.estate.assettotal;
      currentestate.estate.custentity_estate_total_assets = parseInt(assettotal)||0;
      var claimtotal = result.estate.claimtotal;
      currentestate.estate.custentity_estate_total_claims = parseInt(claimtotal)||0;
      var fee = parseInt((propertytotal + assettotal) * 0.06);
      currentestate.estate.custentity_estate_attorneyfee = parseInt(fee > 3000 ? fee : 3000);
      var closingcosts = (result.estate.propertyclosing||0) * 0.06;
      currentestate.estate.custentity_estate_closingcosts = parseInt(closingcosts)||0;
      var bequestduetoheirs = result.estate.bequestduetoheirs||0;
      var netequity = propertytotal + assettotal - claimtotal - bequestduetoheirs - closingcosts - fee;
      currentestate.estate.custentity_estate_net_equity = parseInt(netequity);
      retval[i] = currentestate;
    }
    log.audit(Object.keys(retval).length+' estates preprocessed.');
    return retval;
  }

  function map(context) {
    log.debug('begin map: context', JSON.stringify(context));
    var val=JSON.parse(context.value);
    log.debug({title:'context values', details:JSON.stringify(val)});

    log.debug({title:'defining queries...'});
    var customerquery = `
      select 
        id as custintid, 
        parent as estintid, 
        entityid || ' ' || altname as custid,
        custentity_specific_bequest_due_to_cust as bequestdue,
        custentity_percent_estate_due_to_custome as pctestatedue,
        custentity_advance_to_value_ratio as advtovalratio
      from 
        customer 
      where 
        parent = ${context.key}
      `;

    var customerlienquery = `
      select 
  		custrecord_lein_judgement_customer as custintid, 
  		custrecord_lein_judgement_estate as estintid, 
  		sum(custrecord_lein_judgement_amount) as amount
  	  from 
  		customrecord_lein_judgement
  	  where 
  		custrecord_lein_judgement_estate = ${context.key}
      group by 
        custrecord_lein_judgement_customer, custrecord_lein_judgement_estate
--      order by 
--        custrecord_lein_judgement_estate, custrecord_lein_judgement_customer
    `;

    var customerassignmentquery = `
  	  select 
  		custrecord_existing_assignment_customer as custintid, 
  		custrecord_existing_assignment_estate as estintid, 
  		sum(custrecord_existing_assignment_amount) as amount 
  	  from 
  		customrecord_existing_assignment
  	  where 
  		custrecord_existing_assignment_estate = ${context.key}
  	  group by 
        custrecord_existing_assignment_customer, custrecord_existing_assignment_estate
--  	  order by 
--        custrecord_existing_assignment_estate, custrecord_existing_assignment_customer
    `;
    log.debug({title:'running customer query...'});
    try {
    var rs=rmfunc.getQueryResults(customerquery);
    log.debug('customer results', JSON.stringify(rs));
    rs.forEach(function (result) {
      custintid = result.custintid;
      estintid = result.estintid;
      if (context.key==estintid) {
        val.customers[custintid] = {
          custid: result.custid,
          custintid: custintid,
          bequestdue: result.bequestdue || 0,
          pctestatedue: (result.pctestatedue==null || result.pctestatedue=='')? 1.0:parseFloat(result.pctestatedue),
          advtovalratio: (result.advtovalratio==null||result.advtovalratio=='')? 0.36:parseFloat(result.advtovalratio),
          lientotal: 0,
          assignmenttotal: 0
        }
      }
    });
    } catch(e) {
      log.debug(e.name, e.message);
    }

    try {
    log.debug({title:'running customer lien query...'});
    var rs=rmfunc.getQueryResults(customerlienquery);
    rs.forEach(function (result) {
      var custintid = result.custintid;
      var estintid = result.estintid;
      val.customers[custintid].lientotal = result.amount||0;
    });
    } catch(e) {
      log.debug(e.name, e.message);
    }

    try {
    log.debug({title:'running customer assignment query...'});
    var rs=rmfunc.getQueryResults(customerassignmentquery);
    rs.forEach(function (result) {
      var custintid = result.custintid;
      var estintid = result.estintid;
      val.customers[custintid].assignmenttotal = result.amount||0;
    });
    } catch(e) {
      log.debug(e.name, e.message);
    }

    log.debug({title:'estate/customer values before calculation', details:JSON.stringify(val)});

    try {
    var currentestate={customers:{}, estate:val.estate};
    
    for (customerid in val.customers) {
      log.debug('customerid', customerid);
      currentestate.customers[customerid] = {};
      var assignmenttotal = val.customers[customerid].assignmenttotal;
      log.debug('assignments', assignmenttotal);
      currentestate.customers[customerid].custentity_customer_totalassignments = parseInt(assignmenttotal);
      var lientotal = val.customers[customerid].lientotal;
      log.debug('liens', lientotal);
      currentestate.customers[customerid].custentity_customer_totalliens = parseInt(lientotal);
      var pctestatedue = val.customers[customerid].pctestatedue||0;
      log.debug('perce1nt estate due to customer', pctestatedue);
//      currentestate.customers[customerid].custentity_percent_estate_due_to_custome = parseFloat(pctestatedue);
      var netequity = val.estate.custentity_estate_net_equity;
      log.debug('estate net equity', netequity);
      var residueestatedue = pctestatedue * netequity;
      log.debug('residue of estate due', residueestatedue);
      currentestate.customers[customerid].custentity_customer_residueestatedue = parseInt(residueestatedue);
      var bequest = val.customers[customerid].bequestdue;
      log.debug('bequest due to customer', bequest);
      var customertotaldue = residueestatedue + bequest;
      log.debug('total due to customer from estate', customertotaldue);
      currentestate.customers[customerid].custentity_customer_totalduefromestate = parseInt(customertotaldue);
      var netdue = customertotaldue - lientotal - assignmenttotal;
      log.debug('net due to customer', netdue);
      currentestate.customers[customerid].custentity_customer_netduefromestate = parseInt(netdue);
      var advtovalratio = val.customers[customerid].advtovalratio||0.36;
      log.debug('advance to value ratio', advtovalratio);
//      currentestate.customers[customerid].custentity_advance_to_value_ratio = parseFloat(advtovalratio);
      var maxadvance = netdue * advtovalratio;
      log.debug('max advance size', maxadvance);
      currentestate.customers[customerid].custentity_customer_maxadvancesize = parseInt(maxadvance);
    }
    } catch(e) {
      log.debug(e.name, e.message);
    }

    log.debug({title:'complete estate/customer values', details:JSON.stringify(currentestate)});


    try {
      var updateresult=record.submitFields({type:'customer', id:estintid, options:{enablesourcing:false, ignoreMandatoryFields:true}, values:val.estate});
      log.debug('successfully updated estate '+updateresult);
    } catch(e) {
      log.debug({title:'error updating estate '+estintid+': '+e.name, details:e.message+' - '+JSON.stringify(currentestate)});
      return true;
    }
    for(var i in currentestate.customers) {
      try {
        var updateresult=record.submitFields({type:'customer', id:i, options:{enablesourcing:false, ignoreMandatoryFields:true}, values:val.customers[i]});
//        log.debug('successfully updated customer '+updateresult);
      } catch(e) {
        log.debug({title:'error updating customer '+i+': '+e.name, details:e.message});
        continue;
      }
    }
    return true;
  }

  function summarize(context) {
    log.debug('--END--');
    return true;
  }

  return {
    getInputData: getInputData,
    map: map,
    summarize: summarize
  };
});
