/**
 *@NApiVersion 2.1
 */
define(['N/https'], function(https){

  function parseAddress(address) {
    if(!address || address.trim().toUpperCase().slice(0,2)=='RP') {
      return {error:{message:'no address provided'}};
    }
    return geocodeget(address);


  }

  function geocodeget(address, type) {
//    log.debug('geocodeget() entry');
    var request={};
    var retval={success:false};
    try {
      var f=file.load('660199');
      var security=JSON.parse(f.getContents());
      log.debug('key:'+security.pa-gmaps-key);
    } catch(e) {
      log.error({title:"unable to load apikeys from file", details:JSON.stringify(e)});
    }
//    var apikey="AIzaSyBlAKixNRLrv4OpguDveUoogkubWHw-i50"; // my personal API key
    var apikey="AIzaSyAjAjI1ii7gWPPzAxs33v7uYmfR8gtW2bk"; // PA API key
    var addr=address;
    var request={url:`https://addressvalidation.googleapis.com/v1:validateAddress?key=${apikey}`}
    request.body=JSON.stringify({"address": {/*"regionCode":"US",*/ "addressLines": [addr]}});
    var response=https.post(request);
    var rsp=JSON.parse(response.body);
    if(!!!rsp.error) {
      retval.success=true;
      retval.parsedaddress=rsp.result.address.formattedAddress;
      retval.components=rsp.result.address.addressComponents;
      retval.latlon=rsp.result.geocode.location;
      retval.response=rsp;
      var addrcomponents={};
      retval.components.forEach(function(component) {
        if(!!component.componentName && !!component.componentName.text)
          addrcmptxt=component.componentName.text;
        else
          addrcmptxt="no value";
        addrcomponents[component.componentType]=addrcmptxt;
      });
      addrcomponents.streetaddress=addrcomponents.street_number + ' ' + addrcomponents.route;
      addrcomponents.city=addrcomponents.locality;
      addrcomponents.state=addrcomponents.administrative_area_level_1;
      addrcomponents.shortzip=addrcomponents.postal_code;
      if(!!addrcomponents.postal_code_suffix) {
        addrcomponents.zip = addrcomponents.shortzip + '-' + addrcomponents.postal_code_suffix;
      } else {
        addrcomponents.zip = addrcomponents.shortzip;
      }
      retval.components=addrcomponents;
      za=`${retval.components.streetaddress}, ${retval.components.city}, ${retval.components.state}, ${retval.components.shortzip}, ${retval.components.country}`;
      retval.components=addrcomponents;
      retval.zillow=zillowsearchurl(za);
      retval.googlemaps=googlemaplink(retval.latlon);
    } else {
      retval={error:rsp.error};
    }



    return retval;
  }

  function googlemaplink(location) {
    return `https://www.google.com/maps/place/${location.latitude},${location.longitude}`
  }

  function zillowsearchurl(a) {
    var addr=a.replace(/ /g, '-');
    return 'https://www.zillow.com/homes/'+addr+'_rb/';
  }


  return {
    parse: parseAddress,
  };
});