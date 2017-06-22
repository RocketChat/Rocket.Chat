class SolrProvider {
	constructor(creator, endpointUrl) {
		this.creator = creator;
		this.endpointUrl = endpointUrl;
	}

	/**
	 * Executes an asynchronous data retrieval and hands it over to the callback as single parameter
	 * @return Promise
	 */
	executeSearch() {
		let customSuffix = RocketChat.settings.get('Assistify_AI_DBSearch_Suffix') || '';
		customSuffix = customSuffix.replace(/\r\n|\r|\n/g, '');
		console.log(`executeSearch ${ this.endpointUrl }${ customSuffix }`);
		const that = this;
		return new Promise(function(resolve, reject) {
			$.ajax({
				url: that.endpointUrl + customSuffix,
				dataType: 'jsonp',
				jsonp: 'json.wrf',
				success(data) {
					resolve(SolrProvider.transformResponse(data));
				},
				error(error) {
					console.log(error);
					reject(new Error('no-dbsearch-result'));
				}
			});
		});
	}

	static transformResponse(data) {
		for (let j = 0; j < data.response.docs.length; j++) {
			const doc = data.response.docs[j];
			const hl = data.highlighting[doc.id];
			const results = [];
			let body;
			if (hl && hl['dbsearch_highlight_t_de'] && hl['dbsearch_highlight_t_de'].length > 0) {
				body = hl['dbsearch_highlight_t_de'];
			} else {
				body = [doc.dbsearch_excerpt_s];
			}
			for (let i = 0; i < body.length; i++) {
				const message = {
					content: body[i],
					user: {
						displayName: 'provider'
					}
				};
				results.push(message);
			}
			doc['body'] = results;
		}
		console.log(data);
		return data;
	}
}

export class ClientResultFactory {
	//noinspection JSMethodCanBeStatic
	getInstance(creator, endpointUrl) {
		switch (creator) {
			case 'dbsearch':
				return new SolrProvider(creator, endpointUrl);
		}
	}
}
