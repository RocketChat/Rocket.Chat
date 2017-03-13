export class ClientResultFactory{
	getInstance (creator, endpointUrl){
		switch(creator){
			case 'dbsearch': return new SolrProvider(creator, endpointUrl);
		}
	}
}

class SolrProvider{
	constructor(creator, endpointUrl){
		this.creator = creator;
		this.endpointUrl = endpointUrl;
	}

	/**
	 * Executes an asynchronous data retrieval and hands it over to the callback as single parameter
	 * @param cb
	 */
	executeSearch(queryParameters, cb){
		console.log("executeSearch " + this.endpointUrl);
		$.ajax({
			url: this.endpointUrl,
			dataType: "jsonp",
			jsonp: 'json.wrf',
			success: function (data) {

				for (var j = 0; j < data.response.docs.length; j++) {
					var doc = data.response.docs[j];
					var hl = data.highlighting[doc.id];
					var body = "";
					if (hl && hl['dbsearch_highlight_t_de'] && hl['dbsearch_highlight_t_de'].length > 0) {
						for (var i = 0; i < hl['dbsearch_highlight_t_de'].length; i++) {
							body += hl['dbsearch_highlight_t_de'][i] + " ";
						}
					}
					doc['body'] = body;
				}
				console.log(data);
				cb(data);
			}
		});
	}
}
