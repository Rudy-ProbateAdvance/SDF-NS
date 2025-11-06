/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
define(['N/http', 'N/error'], function(http, error) {
  function doGet(request) {
    log.debug({title:"request", details:JSON.stringify(request)});
    var unsubscribe=!!request.unsubscribe?request.unsubscribe:null;
    var casenum=!!request.casenum?request.casenum:null;
    var county=!!request.county?request.county:null;
    var state=!!request.state?request.state:null;
    
    // first: query unsubscribe code
    if(unsubscribe && unsubscribe!='undefined') {
      var query=`mailerRecordsUnsubscribeCode=${unsubscribe}`;
      var response=doQuery(query);
      log.debug({title:'unsubscribe response', details:JSON.stringify(response)});
      if(response.content.length>0) {
        return JSON.stringify(response);
      }
    }

    // second: query statename/county/casenum
    if(!!state && !!county && !!casenum && state!='undefined' && county!='undefined' && casenum!='undefined') {
      if(state.length==2) {
        var stname=stateToAbbrev(state);
        var stabbr=stateToAbbrev(stname);
      } else if(state.length>2) {
        var stabbr=stateToAbbrev(state);
        var stname=stateToAbbrev(stabbr);
      }
      if(state=='error - no state found') {
        throw("State name given is not valid. Please check spelling.");
      }
      var results=[];
      var query=`county=${county}&state=${stname}&caseNumber=${casenum}`;
      var response=doQuery(query);
      log.debug({title:'stname response', details:JSON.stringify(response)});
      if(response.content.length>0) {
        results=response.content.slice();
      }
      log.debug({title:'stname results', details:JSON.stringify(results)});
      query=`county=${county}&state=${stabbr}&caseNumber=${casenum}`;
      response=doQuery(query);
      log.debug({title:'stabbr response', details:JSON.stringify(response.content)});
      var rc=response.content.length;
      log.debug('stabbr result count: '+rc);

      if(rc==0 && results.length==0) {
        log.debug('no state name results, no state abbreviation results');
        throw("Searches returned no results. Proceed manually.");
      }
      if(rc==0 && results.length>0) {
        log.debug('found state name results, no state abbreviation results');
        return JSON.stringify({content:results});
      }
      if(rc>0 && results.length==0) {
        log.debug('no state name results, found state abbreviation results');
        return JSON.stringify(response);
      }

      log.debug('results found for state name and state abbreviation');
      for(var i in response.content) {
        var customer=response.content[i];
        var unsubscribe=customer.mr_unsubscribeCode;
        if(results.find((result)=>result.mr_unsubscribeCode==unsubscribe)) {
          continue;
        } else {
          results.push(customer);
        }
      }
      return JSON.stringify({content:results});
    } else {
      throw("Check search terms. Include either unsubscribe code OR state, county, and case number, and check spelling.");
    }
  }

  function doQuery(query) {
    var host='http://34.173.110.93';
    var url='/api/cases/search?';
    var apikey='NYRkn594vfJ2d0kavIGarKaj100Flr7Fm3COzou0QnZl8xjVilAqHEkaA8rGJ7FuwpbAfGFCfMDMzQSJnfTC38JUjSpZ41we4DNWKoqz1NkQzEIRgXdhIAwCY2Bdv6De';
    var request={url:host+url+query,headers:{"X-API-KEY":apikey, "Accept":"*/*"}};
    log.debug({title:'request', details:JSON.stringify(request)});
    var response=http.get(request);
    var responsebody=JSON.parse(response.body);
    return responsebody;
  }
  
  return {
    get:doGet
  };

});

function stateToAbbrev(statename) {
  return {
    'alabama':'AL',
    'al':'Alabama',
    'alaska':'AK',
    'ak':'Alaska',
    'arizona':'AZ',
    'az':'Arizona',
    'arkansas':'AR',
    'ar':'Arkansas',
    'california':'CA',
    'ca':'California',
    'colorado':'CO',
    'co':'Colorado',
    'connecticut':'CT',
    'ct':'Connecticut',
    'delaware':'DE',
    'de':'Delaware',
    'district of columbia':'DC',
    'dc':'District Of Columbia',
    'florida':'FL',
    'fl':'Florida',
    'georgia':'GA',
    'ga':'Georgia',
    'hawaii':'HI',
    'hi':'Hawaii',
    'idaho':'ID',
    'id':'Idaho',
    'illinois':'IL',
    'il':'Illinois',
    'indiana':'IN',
    'in':'Indiana',
    'iowa':'IA',
    'ia':'Iowa',
    'kansas':'KS',
    'ks':'Kansas',
    'kentucky':'KY',
    'ky':'Kentucky',
    'louisiana':'LA',
    'la':'Louisiana',
    'maine':'ME',
    'me':'Maine',
    'maryland':'MD',
    'md':'Maryland',
    'massachusetts':'MA',
    'ma':'Massachusetts',
    'missouri':'MI',
    'mi':'Missouri',
    'minnesota':'MN',
    'mn':'Minnesota',
    'mississippi':'MS',
    'ms':'Mississippi',
    'missouri':'MO',
    'mo':'Missouri',
    'montana':'MT',
    'mt':'Montana',
    'nebraska':'NE',
    'ne':'Nebraska',
    'nevada':'NV',
    'nv':'Nevada',
    'new hampshire':'NH',
    'nh':'New Hampshire',
    'new jersey':'NJ',
    'nj':'New Jersey',
    'new mexico':'NM',
    'nm':'New Mexico',
    'new york':'NY',
    'ny':'New York',
    'north carolina':'NC',
    'nc':'North Carolina',
    'north dakota':'ND',
    'nd':'North Dakota',
    'ohio':'OH',
    'oh':'Ohio',
    'oklahoma':'OK',
    'ok':'Oklahoma',
    'oregon':'OR',
    'or':'Oregon',
    'pennsylvania':'PA',
    'pa':'Pennsylvania',
    'puerto rico':'PR',
    'pr':'Puerto Rico',
    'rhode island':'RI',
    'ri':'Rhode Island',
    'south carolina':'SC',
    'sc':'South Carolina',
    'south dakota':'SD',
    'sd':'South Dakota',
    'tennessee':'TN',
    'tn':'Tennessee',
    'texas':'TX',
    'tx':'Texas',
    'utah':'UT',
    'ut':'Utah',
    'vermont':'VT',
    'vt':'Vermont',
    'virginia':'VA',
    'va':'Virginia',
    'washington':'WA',
    'wa':'Washington',
    'west virginia':'WV',
    'wv':'West Virginia',
    'wisconsin':'WI',
    'wi':'Wisconsin',
    'wyoming':'WY',
    'wy':'Wyoming',
  }[statename.toLowerCase()] || 'error - no state found';
}
