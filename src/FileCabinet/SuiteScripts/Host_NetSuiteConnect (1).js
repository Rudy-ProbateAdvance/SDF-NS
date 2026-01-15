/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/runtime'],

function(search, runtime) {
   
    /**
     * Function called upon sending a GET request to the RESTlet.
     *
     * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
     * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
     * @since 2015.1
     */
    function getSavedSearchColumnsAndSavedSearchIds(requestParams) {
    	log.debug({title:'Request Params', details: requestParams });	
		var resultArr = []
    search.load({
        id: 'customsearchplanful_transactions_saved_2'
    }).run().each(function(result){
        resultArr.push(result)
        return true;
    })
      log.debug('test',resultArr);
    return resultArr;
		
    }
	
    return {
        'get': getSavedSearchColumnsAndSavedSearchIds,       
    };
    
});
