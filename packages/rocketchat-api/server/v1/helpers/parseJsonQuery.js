RocketChat.API.v1.helperMethods.set('parseJsonQuery', function _parseJsonQuery() {
	let sort;
	if (this.queryParams.sort) {
		try {
			sort = JSON.parse(this.queryParams.sort);
		} catch (e) {
			this.logger.warn(`Invalid sort parameter provided "${ this.queryParams.sort }":`, e);
			throw new Meteor.Error('error-invalid-sort', `Invalid sort parameter provided: "${ this.queryParams.sort }"`, { helperMethod: 'parseJsonQuery' });
		}
	}

	let fields;
	if (this.queryParams.fields) {
		try {
			fields = JSON.parse(this.queryParams.fields);
		} catch (e) {
			this.logger.warn(`Invalid fields parameter provided "${ this.queryParams.fields }":`, e);
			throw new Meteor.Error('error-invalid-fields', `Invalid fields parameter provided: "${ this.queryParams.fields }"`, { helperMethod: 'parseJsonQuery' });
		}
	}

	let query;
	if (this.queryParams.query) {
		try {
			query = JSON.parse(this.queryParams.query);
		} catch (e) {
			this.logger.warn(`Invalid query parameter provided "${ this.queryParams.query }":`, e);
			throw new Meteor.Error('error-invalid-query', `Invalid query parameter provided: "${ this.queryParams.query }"`, { helperMethod: 'parseJsonQuery' });
		}
	}

	return {
		sort,
		fields,
		query
	};
});
