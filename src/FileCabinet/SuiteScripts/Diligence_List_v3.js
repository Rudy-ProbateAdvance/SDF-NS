/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define([
    'N/ui/serverWidget',
    'N/search',
    'N/url',
    'N/format',
    'N/runtime',
    'N/log'
], (
    serverWidget,
    search,
    url,
    format,
    runtime,
    log
) => {

    const onRequest = (context) => {
        try {
            const request = context.request;
            const response = context.response;

            if (request.method !== 'GET') {
                response.write({ output: 'This Suitelet only supports GET requests.' });
                return;
            }

            // Create Form
            const form = serverWidget.createForm({
                title: 'Diligence List'
            });

//            form.clientScriptModulePath = 'SuiteScripts/customscript_deal_backlog_cs'; // Keep your CS

            // Add CSV Download Button
            form.addButton({
                id: 'custpage_download_csv',
                label: 'Download CSV',
                functionName: 'csvexport'
            });

            // Create Sublist
            const list = form.addSublist({
                id: 'custpage_deals',
                type: serverWidget.SublistType.LIST,
                label: 'Deals'
            });

            // Hidden Fields
            addField(list, 'custpage_customer_internalid', serverWidget.FieldType.TEXT, 'Customer Internal ID').updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
            addField(list, 'custpage_estate_internalid', serverWidget.FieldType.TEXT, 'Estate Internal ID').updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
            addField(list, 'custpage_decedent_name_text', serverWidget.FieldType.TEXT, 'Decedent Name').updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
            addField(list, 'custpage_invoice_list_text', serverWidget.FieldType.TEXTAREA, 'List of Invoices').updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

            // Visible Fields
            addField(list, 'custpage_decedent_name', serverWidget.FieldType.TEXT, 'Decedent Name....................................'); //.updateDisplaySize({ width: 75 });
            addField(list, 'custpage_total_assignment', serverWidget.FieldType.CURRENCY, 'Total Assignment'); //.updateDisplaySize({ width: 75 });
            addField(list, 'custpage_est_date_of_distr', serverWidget.FieldType.DATE, 'Est Date of Distr'); //.updateDisplaySize({ width: 50 });
            addField(list, 'custpage_invoice_list', serverWidget.FieldType.TEXTAREA, 'List of Invoices...............................................................'); //.updateDisplaySize({ width: 75 });
            addField(list, 'custpage_invoice_list_of', serverWidget.FieldType.TEXTAREA, 'List of Invoices (overflow).....................................................'); //.updateDisplaySize({ width: 75 });
            addField(list, 'custpage_county', serverWidget.FieldType.TEXT, 'County'); //.updateDisplaySize({ width: 75 });
            addField(list, 'custpage_last_phone_date', serverWidget.FieldType.DATE, 'Last Phone Call Date'); //.updateDisplaySize({ width: 75 });
            addField(list, 'custpage_last_phone_subject', serverWidget.FieldType.TEXT, 'Subject....................'); //.updateDisplaySize({ width: 75 });
            addField(list, 'custpage_last_phone_message', serverWidget.FieldType.TEXTAREA, 'Message'); //.updateDisplaySize({ width: 75 });
            addField(list, 'custpage_next_event_date', serverWidget.FieldType.DATE, 'Next Event Date'); //.updateDisplaySize({ width: 75 });
            addField(list, 'custpage_next_event_subject', serverWidget.FieldType.TEXT, 'Subject............................................'); //.updateDisplaySize({ width: 75 });
            addField(list, 'custpage_estate_status_part', serverWidget.FieldType.TEXTAREA, 'Estate Status'); //.updateDisplaySize({ width: 75 });

            // New Fields
            addField(list, 'custpage_dot', serverWidget.FieldType.TEXT, 'DOT');
            addField(list, 'custpage_escrow', serverWidget.FieldType.TEXT, 'Escrow');
            addField(list, 'custpage_lispendens', serverWidget.FieldType.TEXT, 'Lis Pendens');
            addField(list, 'custpage_moi', serverWidget.FieldType.TEXT, 'MOI');
            addField(list, 'custpage_blocked_account', serverWidget.FieldType.TEXT, 'BLOCKED ACCOUNT LETTER');
            addField(list, 'custpage_signed_blocked_account', serverWidget.FieldType.TEXT, 'Signed Blocked Account');
            addField(list, 'custpage_obtained_blocked_account', serverWidget.FieldType.TEXT, 'Obtained Blocked Account');
            addField(list, 'custpage_problem_case', serverWidget.FieldType.TEXT, 'PROBLEM CASE');
            addField(list, 'custpage_last_phone_message_author', serverWidget.FieldType.TEXT, 'Last Message Author');
            addField(list, 'custpage_county_court_url', serverWidget.FieldType.TEXT, 'Court URL');
            addField(list, 'custpage_expected_rebate', serverWidget.FieldType.TEXTAREA, 'Expected Rebate................................................................'); //.updateDisplaySize({ width: 75 });

            // Helper to add fields
            function addField(sublist, id, type, label) {
                return sublist.addField({ id, type, label });
            }

            // Data Arrays
            const estateIds = [];
            const customerIds = [];
            const data = [];

            // Step 1: Invoice Search (Main Data)
            const invoiceFilters = [
                ['mainline', 'is', 'T'],
                'AND',
                ['status', 'anyof', 'CustInvc:A']
            ];

            const invoiceColumns = [
                { name: 'entity' },
                { name: 'tranid' },
                { name: 'trandate' },
                { name: 'amount' },
                { name: 'amountremaining' },
                { name: 'custbody_county' },
                { name: 'custbody_state_of_case' },
                { name: 'custbody_decedent_name' },
                { name: 'parent', join: 'customer' },
                { name: 'firstname', join: 'customer' },
                { name: 'lastname', join: 'customer' },
                { name: 'custbody_estate_status_part' },
                { name: 'custentity_blocked_account_letter', join: 'customer' },
                { name: 'custentity_problem_case', join: 'customer' },
                { name: 'custentity_dot', join: 'customer' },
                { name: 'custentity_escrow', join: 'customer' }
            ];

            runPagedSearch('invoice', invoiceFilters, invoiceColumns, (result) => {
                const estateId = result.getValue({ name: 'parent', join: 'customer' });
                const customerId = result.getValue('entity');

                if (!estateId || !customerId) return;

                estateIds.push(estateId);
                customerIds.push(customerId);

                const decedentName = result.getText({ name: 'parent', join: 'customer' });
                if (decedentName === '20741 Gale Blankenship') return; // Skip

                const found = data.find(d => d.estateId === estateId);
                const invoice = {
                    internalid: result.id,
                    tranid: result.getValue('tranid'),
                    customerId,
                    customerName: `${result.getValue({ name: 'firstname', join: 'customer' })} ${result.getValue({ name: 'lastname', join: 'customer' })}`.trim(),
                    trandate: result.getValue('trandate'),
                    amount: result.getValue('amountremaining'),
                    estate: result.getValue('custbody_estate_status_part')
                };

                if (found) {
                    found.invoices.push(invoice);
                } else {
                    data.push({
                        estateId,
                        decedent_name: decedentName,
                        county: result.getText('custbody_county'),
                        estate_status_part: result.getText('custbody_estate_status_part'),
                        invoice_total: '',
                        invoice_link: '',
                        invoice_link_text: '',
                        invoice_link_overflow: '',
                        invoices: [invoice],
                        last_phone_call_date: '',
                        last_phone_call_subject: '',
                        last_phone_call_message: '',
                        last_phone_call_author: '',
                        next_event_date: '',
                        next_event_subject: '',
                        est_date_of_distr: '',
                        blocked_account: 'F',
                        blocked_account_signed: 'F',
                        blocked_account_obtained: 'F',
                        problem_case: 'F',
                        lispendens: 'F',
                        moi: 'F',
                        dot: 'F',
                        escrow: 'F'
                    });
                }
            });

            // Step 2: Expected Rebate Data
            const rebatedata = {};
            if (estateIds.length > 0) {
                const rebateFilters = [
                    ['internalid', 'anyof', customerIds],
                    'OR',
                    ['parentcustomer.internalid', 'anyof', estateIds]
                ];

                const rebateColumns = [
                    { name: 'internalid' },
                    { name: 'entityid' },
                    { name: 'altname' },
                    { name: 'parent' },
                    { name: 'custentity_rebate' }
                ];

                runPagedSearch('customer', rebateFilters, rebateColumns, (result) => {
                    const estateId = result.getValue('parent') || result.getValue('internalid');
                    const customerName = result.getText('altname')?.split(' : ')[1] || result.getText('entityid');
                    const rebate = Math.abs(parseInt(result.getValue('custentity_rebate') || 0));
                    const formatted = formatCurrency(rebate);

                    if (!rebatedata[estateId]) rebatedata[estateId] = [];
                    rebatedata[estateId].push(`${customerName} (${formatted})`);
                });
            }

            // Step 3: Estate-Level Data (Parent Customer)
            if (estateIds.length > 0) {
                const estateFilters = [['internalid', 'anyof', estateIds]];
                const estateColumns = [
                    { name: 'custentity2' },
                    { name: 'custentity_est_date_of_distribution' },
                    { name: 'custentity_est_status' },
                    { name: 'custentity_blocked_account_letter' },
                    { name: 'custentity_client_signed_blocked_account' },
                    { name: 'custentity_courtapproved_blocked_account' },
                    { name: 'custentity_problem_case' },
                    { name: 'custentity_lispendens' },
                    { name: 'custentity_moi' },
                    { name: 'custentity_dot' },
                    { name: 'custentity_escrow' },
                    { name: 'custrecord_county_court_url', join: 'CUSTENTITY2' }
                ];

                runPagedSearch('customer', estateFilters, estateColumns, (result) => {
                    const estateId = result.id;
                    const item = data.find(d => d.estateId === estateId);
                    if (!item) return;

                    item.county = result.getText('custentity2');
                    item.est_date_of_distr = result.getValue('custentity_est_date_of_distribution');
                    item.estate_status_part = result.getText('custentity_est_status');
                    item.county_court_url = result.getValue({ name: 'custrecord_county_court_url', join: 'CUSTENTITY2' });

                    if (item.blocked_account === 'F') item.blocked_account = result.getValue('custentity_blocked_account_letter');
                    if (item.blocked_account_signed === 'F') item.blocked_account_signed = result.getValue('custentity_client_signed_blocked_account');
                    if (item.blocked_account_obtained === 'F') item.blocked_account_obtained = result.getValue('custentity_courtapproved_blocked_account');
                    if (item.problem_case === 'F') item.problem_case = result.getValue('custentity_problem_case');
                    if (item.lispendens === 'F') item.lispendens = result.getValue('custentity_lispendens');
                    if (item.moi === 'F') item.moi = result.getValue('custentity_moi');
                    if (item.dot === 'F') item.dot = result.getValue('custentity_dot');
                    if (item.escrow === 'F') item.escrow = result.getValue('custentity_escrow');
                });
            }

            // Step 4: Last Phone Call
            if (estateIds.length > 0) {
                const phoneSearch = search.load({ id: 'customsearch_diligence_last_phone_call' });
                phoneSearch.filters.push(search.createFilter({
                    name: 'company',
                    operator: search.Operator.ANYOF,
                    values: estateIds
                }));

                runPagedSearch(phoneSearch, [], [], (result) => {
                    const estateId = result.getValue({ name: 'company', summary: search.Summary.GROUP });
                    const item = data.find(d => d.estateId === estateId);
                    if (!item) return;

                    item.last_phone_call_date = result.getValue({ name: 'startdate', summary: search.Summary.MAX });
                    item.last_phone_call_subject = result.getValue({ name: 'title', summary: search.Summary.MAX });
                    item.last_phone_call_message = result.getValue({ name: 'message', summary: search.Summary.MAX });
                    item.last_phone_call_author = result.getText({ name: 'createdby', summary: search.Summary.MAX });
                });
            }

            // Step 5: Next Event
            if (estateIds.length > 0) {
                const eventSearch = search.load({ id: 'customsearch_diligence_next_event_date' });
                eventSearch.filters.push(search.createFilter({
                    name: 'attendee',
                    operator: search.Operator.ANYOF,
                    values: estateIds
                }));

                runPagedSearch(eventSearch, [], [], (result) => {
                    const companyText = result.getText({ name: 'company', summary: search.Summary.GROUP });
                    const item = data.find(d => d.decedent_name === companyText);
                    if (!item) return;

                    item.next_event_date = result.getValue({ name: 'startdate', summary: search.Summary.MIN });
                    item.next_event_subject = result.getValue({ name: 'title', summary: search.Summary.MIN });
                });
            }

            // Step 6: Build Invoice Links & Totals
            const pdfUrlBase = url.resolveScript({
                scriptId: 'customscript_sl_stamped_assignment',
                deploymentId: 'customdeploy_sl_stamped_assignment',
                returnExternalUrl: false
            });

            const sublistData = data.map(item => {
                let invoiceLink = '';
                let invoiceLinkOverflow = '';
                const invoiceText = [];
                let total = 0;
                const invoiceIds = [];

                item.invoices.forEach(inv => {
                    const linkText = `${inv.customerName} - ${inv.tranid} (${inv.amount})`;
                    invoiceText.push(linkText);
                    invoiceIds.push(inv.internalid);
                    total += parseFloat(inv.amount || 0);

                    const html = `<a href="/app/accounting/transactions/custinvc.nl?id=${inv.internalid}" target="_blank">${linkText}</a><br/>`;
                    if ((invoiceLink + html).length < 3500) {
                        invoiceLink += html;
                    } else {
                        invoiceLinkOverflow += html;
                    }
                });

                const pdfUrl = `${pdfUrlBase}&invoices=${invoiceIds.join(',')}`;
                const decedentLink = `<a href="/app/site/hosting/scriptlet.nl?script=180&deploy=1&estate=${item.estateId}&native=T" target="_blank">${item.decedent_name}</a>`;

                return {
                    custpage_decedent_name_text: item.decedent_name,
                    custpage_decedent_name: decedentLink,
                    custpage_county: item.county,
                    custpage_invoice_list_text: invoiceText.join(', '),
                    custpage_invoice_list: invoiceLink,
                    custpage_invoice_list_of: invoiceLinkOverflow,
                    custpage_total_assignment: formatCurrency(total),
                    custpage_last_phone_date: item.last_phone_call_date,
                    custpage_last_phone_subject: item.last_phone_call_subject,
                    custpage_last_phone_message: item.last_phone_call_message,
                    custpage_next_event_date: item.next_event_date,
                    custpage_next_event_subject: item.next_event_subject,
                    custpage_est_date_of_distr: item.est_date_of_distr,
                    custpage_estate_status_part: item.estate_status_part,
                    custpage_blocked_account: item.blocked_account === 'T' ? 'Yes' : 'No',
                    custpage_signed_blocked_account: item.blocked_account_signed === 'T' ? 'Yes' : 'No',
                    custpage_obtained_blocked_account: item.blocked_account_obtained === 'T' ? 'Yes' : 'No',
                    custpage_problem_case: item.problem_case === 'T' ? 'Yes' : 'No',
                    custpage_lispendens: item.lispendens === 'T' ? 'Yes' : 'No',
                    custpage_moi: item.moi === 'T' ? 'Yes' : 'No',
                    custpage_dot: item.dot === 'T' ? 'Yes' : 'No',
                    custpage_escrow: item.escrow === 'T' ? 'Yes' : 'No',
                    custpage_stamped_assignment: `<a href="${pdfUrl}" target="top">Print</a>`,
                    custpage_last_phone_message_author: item.last_phone_call_author,
                    custpage_county_court_url: item.county_court_url,
                    custpage_expected_rebate: (rebatedata[item.estateId] || []).join('\n')
                };
            });

            list.setSublistValues({ values: sublistData });
            response.writePage({ page: form });

        } catch (e) {
            log.error({ title: 'Diligence_List Error', details: e });
            context.response.write({ output: `Error: ${e.message}` });
        }
    };

    // Helper: Run paged search
    const runPagedSearch = (typeOrId, filters, columns, callback) => {
        const s = typeof typeOrId === 'string' && typeOrId.includes('customsearch') ?
            search.load({ id: typeOrId }) :
            search.create({ type: typeOrId, filters, columns });

        let start = 0;
        const pageSize = 1000;
        let results;

        do {
            const pagedData = s.runPaged({ pageSize });
            const page = pagedData.fetch({ index: start / pageSize });
            results = page.data;

            results.forEach(callback);
            start += pageSize;
        } while (results.length === pageSize);
    };

    // Helper: Format currency
    const formatCurrency = (value) => {
        const num = parseFloat(value);
        if (isNaN(num)) return '$0.00';
        return `$${num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
    };

    return { onRequest };
});