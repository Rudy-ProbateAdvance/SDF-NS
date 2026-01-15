/**
 *@NApiVersion 2.1
 *@NScriptType restlet
 */

define(['N/record', 'N/search', 'N/log'], function (record, search, log) {

    function post(context) {

        var pagedData = search
            .create({
                type: context.recordType,
            })
            .runPaged({
                pageSize: context.limit,
            });

        context.totalResults = pagedData.count;

        var ids = pagedData.fetch({
            index: context.offset / context.limit,
        }).data.map(r => r.id);

        context.results = [];

        for (var i = 0; i < ids.length; i++) {

            var id = ids[i];

            try {
                context.results.push(record.load({
                    type: context.recordType,
                    id: id,
                }));
            } catch (e) {
                log.debug("can't load " + id);
            }
            
        }

        return context;
    }

    return {
        post: post
    }
});