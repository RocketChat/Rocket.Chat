export class BaseRaw {
	constructor(col) {
		this.col = col;
	}

	_ensureDefaultFields(options) {
		if (!this.defaultFields) {
			return options;
		}

		if (!options) {
			return { projection: this.defaultFields };
		}

		// TODO: change all places using "fields" for raw models and remove the additional condition here
		if ((options.projection != null && Object.keys(options.projection).length > 0)
		|| (options.fields != null && Object.keys(options.fields).length > 0)) {
			return options;
		}

		return {
			...options,
			projection: this.defaultFields,
		};
	}

	findOneById(_id, options = {}) {
		return this.findOne({ _id }, options);
	}

	findOne(query = {}, options = {}) {
		const optionsDef = this._ensureDefaultFields(options);
		return this.col.findOne(query, optionsDef);
	}

	findUsersInRoles() {
		throw new Error('overwrite-function', 'You must overwrite this function in the extended classes');
	}

	find(query = {}, options = {}) {
		const optionsDef = this._ensureDefaultFields(options);
		return this.col.find(query, optionsDef);
	}

	update(...args) {
		return this.col.update(...args);
	}

	removeById(_id) {
		return this.col.deleteOne({ _id });
	}
}
