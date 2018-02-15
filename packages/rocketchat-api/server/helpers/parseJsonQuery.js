RocketChat.API.helperMethods.set('parseJsonQuery', function _parseJsonQuery() {
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

	// Verify the user's selected fields only contains ones which their role allows
	if (typeof fields === 'object') {
		let nonSelectableFields = Object.keys(RocketChat.API.v1.defaultFieldsToExclude);
		if (!RocketChat.authz.hasPermission(this.userId, 'view-full-other-user-info') && this.request.route.includes('/v1/users.')) {
			nonSelectableFields = nonSelectableFields.concat(Object.keys(RocketChat.API.v1.limitedUserFieldsToExclude));
		}

		Object.keys(fields).forEach((k) => {
			if (nonSelectableFields.includes(k) || nonSelectableFields.includes(k.split(RocketChat.API.v1.fieldSeparator)[0])) {
				delete fields[k];
			}
		});
	}

	// Limit the fields by default
	fields = Object.assign({}, fields, RocketChat.API.v1.defaultFieldsToExclude);
	if (!RocketChat.authz.hasPermission(this.userId, 'view-full-other-user-info') && this.request.route.includes('/v1/users.')) {
		fields = Object.assign(fields, RocketChat.API.v1.limitedUserFieldsToExclude);
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

	// Verify the user has permission to query the fields they are
	if (typeof query === 'object') {
		let nonQuerableFields = Object.keys(RocketChat.API.v1.defaultFieldsToExclude);
		if (!RocketChat.authz.hasPermission(this.userId, 'view-full-other-user-info') && this.request.route.includes('/v1/users.')) {
			nonQuerableFields = nonQuerableFields.concat(Object.keys(RocketChat.API.v1.limitedUserFieldsToExclude));
		}

		Object.keys(query).forEach((k) => {
			if (nonQuerableFields.includes(k) || nonQuerableFields.includes(k.split(RocketChat.API.v1.fieldSeparator)[0])) {
				delete query[k];
			}
		});
	}

	return {
		sort,
		fields,
		query
	};
});
