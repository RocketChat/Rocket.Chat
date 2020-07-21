export class BaseRaw {
	constructor(col) {
		this.col = col;
	}

	_ensureDefaultFields(options) {
		if ((options?.fields == null || Object.keys(options?.fields).length === 0) && this.defaultFields) {
			options.fields = this.defaultFields;
		}
	}

	findOneById(_id, options = {}) {
		return this.findOne({ _id }, options);
	}

	findOne(query = {}, options = {}) {
		this._ensureDefaultFields(options);
		return this.col.findOne(query, options);
	}

	findUsersInRoles() {
		throw new Error('overwrite-function', 'You must overwrite this function in the extended classes');
	}

	find(query = {}, options = {}) {
		this._ensureDefaultFields(options);
		return this.col.find(query, options);
	}

	update(...args) {
		return this.col.update(...args);
	}

	removeById(_id) {
		return this.col.deleteOne({ _id });
	}
}
