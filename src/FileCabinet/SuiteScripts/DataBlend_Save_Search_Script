function GetSavedSearch(datain)
{
    try {

        var id = datain.id;
        var offset = parseInt(datain.offset) || 0;
        var limit = parseInt(datain.limit) || 1000;
        var type = datain.type;
        var useLabels = datain.useLabels === 'true';

        var search = nlapiLoadSearch(type, id);
        var columns = search.getColumns();
        var columnNames = [];

        var results = search.runSearch().getResults(offset, offset + limit);
        
        if (useLabels) {
            var regex = /[^a-zA-Z0-9]/g;

            for (var i = 0; i < columns.length; i++)
            {
                var column = columns[i];
                columnNames.push(column.getLabel().replace(regex, '_').toLowerCase());
            }

            var newResults = [];
            
            for (var i = 0; i < results.length; i++)
            {
                var result = results[i];
                var resultColumns = result.getAllColumns();

                var newResult = {columns: {}};

                for (var j = 0; j < resultColumns.length; j++)
                {
                    var resultColumn = resultColumns[j];
                    newResult.columns[resultColumn.getLabel().replace(regex, '_').toLowerCase()] = result.getValue(resultColumn);
                }

                newResults.push(newResult);
            }

            return { columns: columnNames, results: newResults };

        } else {
            for (var i = 0; i < columns.length; i++)
            {
                var column = columns[i];
                columnNames.push(column.getName());
            }

            return { columns: columnNames, results: results };
        }
    } catch (e) {

        nlapiLogExecution("ERROR", "Error running DataBlend Saved Search", e.message);

        return { error: "Error running DataBlend Saved Search " + e.message };
    }
}