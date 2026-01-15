/**
 *@NApiVersion 2.1
 */
define(['N/record', 'N/search', 'N/query'], function(record, search, query){

  function doSearch(options) {
    var custintid=options.custintid;
    log.debug({title:'custintid: '+custintid});
    if(!custintid) {
      return {error:'ERROR - No Customer Supplied'};
    }
    var columns=[];
    var filters=[
      ["name","anyof",custintid],
      "AND",
      ["account", "anyof", "230"],
      "AND",
      ["memorized", "is", "F"]
    ];

    columns.push(search.createColumn({name:'entity'}));
    columns.push(search.createColumn({name:'trandate'}));
    columns.push(search.createColumn({name:'type'}));
    columns.push(search.createColumn({name:'internalid'}));
    columns.push(search.createColumn({name:'tranid'}));
    columns.push(search.createColumn({name:'amount'}));
    columns.push(search.createColumn({name:'tranid', join:'custbody_invoice'}));
    var s=search.create({type:'transaction', columns:columns, filters:filters});
    var rc=s.runPaged().count;
    log.debug({title:'initial result count:'+rc});
    var results=[];
    var pagedData=s.runPaged({pageSize:1000});
    for(i=0;i<pagedData.pageRanges.length; i++) {
      var page=pagedData.fetch(i);
      page.data.forEach(function(result) {
        var tranid=result.getValue(tranid);
        log.debug('tranid:'+tranid);
        if(tranid!='Memorized') {
          var data={};
          data.entity=result.getValue('entity');
          data.trandate=result.getValue('trandate');
          data.type=result.getValue('type');
          data.tranintid=result.getValue('internalid');
          data.tranid=result.getValue('tranid');
          data.invoice=result.getValue({name:'tranid', join:'custbody_invoice'});
          data.amount=result.getValue('amount');
          results.push(data);
        }
        return true;
      });
    }
    log.debug({title:'results', details:JSON.stringify(results)});
    return results;
  }

  /*
   * takes a netsuite search object as an argument.
   * returns an array of netsuite search.result objects,
   * overriding the 4000 result limit
   */
  function getAllResults(s) {
    var rs=s.run();
    var rc=s.runPaged().count;
//    log.debug({title:'resultcount:'+rc});
    var start=0;
    var step=1000;
    var end=start+step;
    var allresults=[];
    do {
//      log.debug({title:'start/step/end', details:start+'/'+step+'/'+end});
      var r=[];
      r=rs.getRange({start:start, end:end});
      r.forEach(function(result){
        allresults.push(result.getAllValues());
        return true;
      });
      start+=step;
      end=start+step;
    } while(start < rc);
    return allresults;
  }

  /*
   * takes search object as primary argument.
   * if secondary argument is 'o' then it returns an object, otherwise returns an array.
   * Each property/array member is an object consisting of one search result row and its properties.
   */
  function getSearchResults(s,ao) {
    if(ao=='o')
      var results={};
    else
      var results=[];
    var rc=s.runPaged().count;
    var pd=s.runPaged({pageSize:1000});
    for(var i=0; i<pd.pageRanges.length; i++) {
      var page=pd.fetch(i);
      page.data.forEach(function(result) {
        var r={};
        r['internalid']={label:'Internal Id', name:'internalid', text:result.id, value:result.id};
        for(var i=0; i<result.columns.length; i++) {
          var join=result.columns[i].join;
          if(join)
            label=join+'_'+result.columns[i].label;
          else
            var label=result.columns[i].label;
          if(join)
            var name=join+'_'+result.columns[i].name;
          else 
            var name=result.columns[i].name;
          var summary=result.columns[i].summary;
          var fn=result.columns[i].function;
          var text=result.getText({name:result.columns[i].name, summary:summary, join:join, function:fn});
          var value=result.getValue({name:result.columns[i].name, summary:summary, join:join, function:fn});
          r[name]={label:label, name:name, text:text, value:value};
        }
        if(ao=='o')
          results[result.id]=r;
        else
          results.push(r);
        return true;
      });
    }
    return results;
  }
  
  function getDate(date) {
    var d;
    if(date) {
      d=new Date(date);
    } else {
      d=new Date();
    }
    var date=d.getMonth()+1+'/'+d.getDate()+'/'+d.getFullYear();
    return date;
  }

  function getDateTime(date) {
    console.log(date);
    var d;
    if(!!date)
      d=new Date(date);
    else
      d=new Date();
    var datestring=`${d.getFullYear()}${(d.getMonth()+1).toString().padStart(2,'0')}${(d.getDate()).toString().padStart(2,'0')}-${(d.getHours()).toString().padStart(2,'0')}${(d.getMinutes()).toString().padStart(2,'0')}${(d.getSeconds()).toString().padStart(2,'0')}`;
    return datestring;
  }


  function getQueryResults(q,ao=false, key='estintid') {
    var pageddata=query.runSuiteQLPaged({query:q, pageSize:1000});
    if(ao=='o')
      var results={};
    else
      var results=[];
    pageddata.pageRanges.forEach(function(pagerange) {
      pageddata.fetch(pagerange).data.results.forEach(function(result) {
        if(ao=='o') {
          var r=result.asMap();
          var estintid=r[key];
          results[estintid]=r;
        }
        else
          results.push(result.asMap());
      });
    });
    return results;
  }


  function sublistToArray(sublistid, columnmap, rec) {
    var columns=Object.keys(columnmap);
    var headers=[];
    var lines=[];
    for(i in columnmap){
      var col=columnmap[i];
      headers.push(col.name);
    }
    lines.push(headers);
    var lc=rec.getLineCount({sublistId:sublistid});
    var cc=columns.length;
    for(var i=0; i<lc; i++) {
      var row=[];
      for(var j=0; j<cc; j++) {
        row.push(rec.getSublistValue({sublistId:sublistid, fieldId:columns[j], line:i}).toString().trim());
      }
      lines.push(row);
    }
    return lines;
  }


  function arrayToCsv(lines, hasHeaders) {
    var startIndex = 0;
    var csvstring='';
    if (hasHeaders) {
      var headers = lines[0]
      csvstring = '"' + headers.join('","') + '"\n';
      startIndex = 1;
    }
    for (var i = startIndex; i < lines.length; i++) {
      var row=lines[i];
      row = row.map(function (field) {
        if (field.match(/href/))
          field = field.replace(/<[^>]*>/g, '');
        field=field.toString().trim().replace(/,/,' ').replace(/"/g,"'");
        return field;
      });
      csvstring += '"' + row.join('","') + '"\n';
    }
    return csvstring;
  }

  function downloadFile(wnd, contents, filename, ext) {
    var d=new Date();
    var datestring=rmfunc.getDateTime();
    var element = wnd.document.createElement('rmdownloadfile');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(contents));
    element.setAttribute('download', `${filename} - ${datestring}.${ext}`);
    element.style.display = 'none';
    wnd.document.body.appendChild(element);
    element.click();
    wnd.document.body.removeChild(element);
    return true;
  }

  function unflatten(items) {
    var tree = [],
        mappedArr = {}
        
    items.forEach(function(item) {
      var id = item.Id;
      if (!mappedArr.hasOwnProperty(id)) { 
        mappedArr[id] = item; 
        mappedArr[id].children = [];
      }
    })
    
    for (var id in mappedArr) { 
      if (mappedArr.hasOwnProperty(id)) {
        mappedElem = mappedArr[id];
        
        if (mappedElem.Parent) { 
          var parentId = mappedElem.Parent;
          mappedArr[parentId].children.push(mappedElem); 
        }
        
        else { 
          tree.push(mappedElem);
        } 
      }
    }
    
    return tree;
    
  }

  function arrayToObject(arr, key) {
    // converts an array of objects to a single object with subobjects, 
    // keyed on the property named {key}
    var obj={};
    arr.forEach(function(item) {
      var id=item[key];
      obj[id]=item;
    });
    return obj;
  }


  function getcsvdata(sublistId) {
    tables=document.getElementsByTagName('table');
    var mytable=null;
    for(var i=0; i<tables.length; i++) {
      var table=tables[i];
      if(table.id.match(sublistId)) {
        mytable=table;
      }
    }    var b=mytable.getElementsByTagName('tbody');
    var rows=b[0].childNodes;
    var data=[];
    data[0]=rows[0].innerText.split(/\n\t\n/);
    for(var i=2; i<rows.length; i+=2) {
      try {
        data.push(rows[i].innerText.split(/\t/));
      } catch(e) {
        log.debug('.');
      }
    }
    return data;
  }

  function csvexport(sublistId, filename="CSV Export Results (PLEASE RENAME) ", mapfunction) {
//    alert(`sublistId:${sublistId}, filename:${filename}, mapfunction:${mapfunction}`);
    var data=getcsvdata(sublistId);
    var xmlstring='';
    for(var i=0; i<data.length; i++) {
      data[i]=data[i].map(field=>field.trim());
      data[i]=data[i].map(field=>field.replace(/"/g,'""'));
      if(mapfunction!=null && mapfunction!=undefined) {
        data[i]=data[i].map(mapfunction);
      }
      xmlstring += '"' + data[i].join('","') + '"\r\n';
    }
//    return xmlstring.trim();
    var d = new Date();
    var datestring = getDateTime();
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(xmlstring));
    element.setAttribute('download', filename + " - " + datestring + ".csv");
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    return true;
  }


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
    }[statename.toLowerCase()];
  }

  var netrevenuetemplate= '`invoicetotal(${fn(val.invoicetotal)})\n - invoicedue(${fn(val.invoicedue)})\n - cashadvanced(${fn(val.cashadvanced)})\n - discounttotal(${fn(val.discounttotal)})\n - checkstotal(${fn(val.checkstotal)})\n + rebatetotal(${fn(val.rebatetotal)})\n - baddebttotal(${fn(val.baddebttotal)})\n - completedassignmentstotal(${fn(val.completedassignmentstotal)})\n + recoveryonwriteofftotal(${fn(val.recoveryonwriteofftotal)})\n + recoveredattyfeestotal(${fn(val.recoveredattyfeestotal)})\n + courtfeestotal(${fn(val.courtfeestotal)})\n - additionaldepositstotal(${fn(val.additionaldepositstotal)})\n = netrevenue2(${fn(val.netrevenue2)})`';

  function calc(val,option) {
    var retval='';
    var template1 = netrevenuetemplate;
    var template2 = template1.replace(/\)}\)\n /g,'})').replace(/ .*?fn\(/g,'(${').replace(/`.+?fn\(/,'`(${').replace(/=.*`/,'`');
    var template3 = template2.replace(/[`()${}]/g,'').replace(/val\./g,'').replace(/([-+])/g,' $1 ');
    if(option==0) {
      retval=Math.round(100*eval(eval(template2)), 2)/100;
    }
    if(option==1) {
      retval=eval(template1);
    }
    if(option==2)
      retval=template3;
    return retval;
  }

  function fn(number) {
    return '$ '+number.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  }

  function addField2(params, fields) {
    if (!params.form || !params.id || !params.label || !params.type) {
      throw new Error('addField: form, id, label, and type are required');
    }

    var form = params.form;
    var fieldId = params.id;
    var label = params.label;
    var type = params.type.toLowerCase();
    var sublistId = params.sublistId;
    var field;

    // Map common aliases → official serverWidget constants
    var typeMap = {
      // 'text'        : sw.FieldType.TEXT,
      // 'textarea'    : sw.FieldType.TEXTAREA,
      // 'checkbox'    : sw.FieldType.CHECKBOX,
      // 'date'        : sw.FieldType.DATE,
      // 'datetime'    : sw.FieldType.DATETIMETZ,
      // 'currency'    : sw.FieldType.CURRENCY,
      // 'decimal'     : sw.FieldType.FLOAT,
      // 'integer'     : sw.FieldType.INTEGER,
      // 'select'      : sw.FieldType.SELECT,
      // 'multiselect' : sw.FieldType.MULTISELECT,
      // 'url'         : sw.FieldType.URL,
      // 'email'       : sw.FieldType.EMAIL,
      // 'phone'       : sw.FieldType.PHONE,
      // 'inline'      : sw.FieldType.INLINEHTML,
      // 'help'        : sw.FieldType.HELP,
      // 'label'       : sw.FieldType.LABEL,
      // 'radio'       : sw.FieldType.RADIO,
      // 'file'        : sw.FieldType.FILE
       'text'        : 'text',
       'textarea'    : 'textarea',
       'checkbox'    : 'checkbox',
       'date'        : 'date',
       'datetime'    : 'datetimetz',
       'currency'    : 'currency',
       'decimal'     : 'float',
       'integer'     : 'integer',
       'select'      : 'select',
       'multiselect' : 'multiselect',
       'url'         : 'url',
       'email'       : 'email',
       'phone'       : 'phone',
       'inline'      : 'inline',
       'help'        : 'help',
       'label'       : 'label',
       'radio'       : 'radio',
       'file'        : 'file'
    };

    var fieldType = typeMap[type] || type; // fallback if already a constant

    if (sublistId) {
      var sublist = form.getSublist({id: sublistId});
      if (!sublist) {
        throw new Error('Invalid sublistId: ' + sublistId);
      }
      field = sublist.addField({
        id: fieldId,
        label: label,
        type: fieldType
      });
      if (params.tab) {
        field.updateTab({tab: params.tab});
      }
    } else {
      field = form.addField({
        id: fieldId,
        label: label,
        type: fieldType,
        source: params.source || null,
        container: params.container || params.tab || null
      });
    }

    if (params.defaultValue !== undefined && params.defaultValue !== null) {
      field.defaultValue = params.defaultValue;
    }
    if (params.mandatory) {
      field.isMandatory = true;
    }
    if (params.displayType) {
      var dt = params.displayType.toLowerCase();
      if (dt === 'readonly') dt = 'disabled';
//      field.updateDisplayType({displayType: sw.FieldDisplayType[dt.toUpperCase()] || sw.FieldDisplayType.NORMAL});
      field.updateDisplayType({displayType: dt || 'normal'});
    }
    if (params.layoutType) {
      field.updateLayoutType({layoutType: params.layoutType});
    }
    if (params.breakType) {
      field.updateBreakType({breakType: params.breakType});
    }
    if (params.helpText) {
      field.setHelpText({help: params.helpText});
    }
    if (params.maxLength && (type === 'text' || type === 'textarea')) {
      field.maxLength = params.maxLength;
    }

    if (type === 'url') {
      field.linkText = label;
      if (params.openNewWindow !== false) {
        field.openInNewWindow = true;
      }
    }

    if (type === 'select' || type === 'multiselect') {
      if (params.source) {
        field.addSelectOption({value: '', text: ' '}); // optional blank
      }
    }

    if (type === 'checkbox' && params.defaultChecked === true) {
      field.defaultValue = true;
    }

    if (typeof (fields) == 'object') {
      var container = params.sublistId || 'body';
      var temp = {id: params.id, label: params.label};
      if (!fields.hasOwnProperty(container)) {
        fields[container] = [];
      }
      fields[container].push(temp);
    }

    return field;
  }

  function toTitleCase(str) {
    return str.toLowerCase().replace(/(?:^|\s)\w/g, function(match) {
      return match.toUpperCase();
    });
  }





  return {
    addField2:addField2,
    toTitleCase:toTitleCase,
    getcsvdata:getcsvdata,
    csvexport:csvexport,
    doSearch:doSearch,
    getAllResults:getAllResults,
    getSearchResults:getSearchResults,
    getDate:getDate,
    getDateTime:getDateTime,
    getQueryResults:getQueryResults,
    sublistToArray:sublistToArray,
    arrayToCsv:arrayToCsv,
    downloadFile:downloadFile,
    unflatten:unflatten,
    arrayToObject:arrayToObject,
    stateToAbbrev:stateToAbbrev,
    netrevenuecalc:calc,
    formatnumber:fn,
  };
});

//      [[["type","anyof","Deposit"],"AND",["account","anyof","230"]],"OR",[["type","anyof","CustInvc"],"AND",["item","anyof","7"]]]
