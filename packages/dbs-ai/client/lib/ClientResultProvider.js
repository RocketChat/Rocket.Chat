export class ClientResultFactory{
	getInstance(creator, endpointUrl){
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
				console.log(data);
				cb(data);
			}
		});
	}
}
