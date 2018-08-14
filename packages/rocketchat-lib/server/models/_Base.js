import ModelsBaseDb from './_BaseDb';
import objectPath from 'object-path';
import _ from 'underscore';

class ModelsBase {
	constructor(nameOrModel) {
		this._db = new ModelsBaseDb(nameOrModel, this);
		this.model = this._db.model;
		this.collectionName = this._db.collectionName;
		this.name = this._db.name;

		this.on = this._db.on.bind(this._db);
		this.emit = this._db.emit.bind(this._db);

		this.db = this;
	}

	get origin() {
		return '_db';
	}

	arrayToCursor(data) {
		return {
			fetch() {
				return data;
			},
			count() {
				return data.length;
			},
			forEach(fn) {
				return data.forEach(fn);
			}
		};
	}

	setUpdatedAt(/*record, checkQuery, query*/) {
		return this._db.setUpdatedAt(...arguments);
	}

	find() {
		try {
			return this[this.origin].find(...arguments);
		} catch (e) {
			console.error('Exception on find', e, ...arguments);
		}
	}

	findOne() {
		try {
			return this[this.origin].findOne(...arguments);
		} catch (e) {
			console.error('Exception on find', e, ...arguments);
		}
	}

	findOneById() {
		try {
			return this[this.origin].findOneById(...arguments);
		} catch (e) {
			console.error('Exception on find', e, ...arguments);
		}
	}

	findOneByIds(ids, options) {
		check(ids, [String]);

		try {
			return this[this.origin].findOneByIds(ids, options);
		} catch (e) {
			console.error('Exception on find', e, ...arguments);
		}
	}

	insert(/*record*/) {
		return this._db.insert(...arguments);
	}

	update(/*query, update, options*/) {
		return this._db.update(...arguments);
	}

	upsert(/*query, update*/) {
		return this._db.upsert(...arguments);
	}

	remove(/*query*/) {
		return this._db.remove(...arguments);
	}

	insertOrUpsert() {
		return this._db.insertOrUpsert(...arguments);
	}

	allow() {
		return this._db.allow(...arguments);
	}

	deny() {
		return this._db.deny(...arguments);
	}

	ensureIndex() {
		return this._db.ensureIndex(...arguments);
	}

	dropIndex() {
		return this._db.dropIndex(...arguments);
	}

	tryEnsureIndex() {
		return this._db.tryEnsureIndex(...arguments);
	}

	tryDropIndex() {
		return this._db.tryDropIndex(...arguments);
	}

	trashFind(/*query, options*/) {
		return this._db.trashFind(...arguments);
	}

	trashFindOneById(/*_id, options*/) {
		return this._db.trashFindOneById(...arguments);
	}

	trashFindDeletedAfter(/*deletedAt, query, options*/) {
		return this._db.trashFindDeletedAfter(...arguments);
	}

	processQueryOptionsOnResult(result, options={}) {
		if (result === undefined || result === null) {
			return undefined;
		}

		if (Array.isArray(result)) {
			if (options.sort) {
				result = result.sort((a, b) => {
					let r = 0;
					for (const field in options.sort) {
						if (options.sort.hasOwnProperty(field)) {
							const direction = options.sort[field];
							let valueA;
							let valueB;
							if (field.indexOf('.') > -1) {
								valueA = objectPath.get(a, field);
								valueB = objectPath.get(b, field);
							} else {
								valueA = a[field];
								valueB = b[field];
							}
							if (valueA > valueB) {
								r = direction;
								break;
							}
							if (valueA < valueB) {
								r = -direction;
								break;
							}
						}
					}
					return r;
				});
			}

			if (typeof options.skip === 'number') {
				result.splice(0, options.skip);
			}

			if (typeof options.limit === 'number' && options.limit !== 0) {
				result.splice(options.limit);
			}
		}

		if (!options.fields) {
			options.fields = {};
		}

		const fieldsToRemove = [];
		const fieldsToGet = [];

		for (const field in options.fields) {
			if (options.fields.hasOwnProperty(field)) {
				if (options.fields[field] === 0) {
					fieldsToRemove.push(field);
				} else if (options.fields[field] === 1) {
					fieldsToGet.push(field);
				}
			}
		}

		if (fieldsToRemove.length > 0 && fieldsToGet.length > 0) {
			console.warn('Can\'t mix remove and get fields');
			fieldsToRemove.splice(0, fieldsToRemove.length);
		}

		if (fieldsToGet.length > 0 && fieldsToGet.indexOf('_id') === -1) {
			fieldsToGet.push('_id');
		}

		const pickFields = (obj, fields) => {
			const picked = {};
			fields.forEach((field) => {
				if (field.indexOf('.') !== -1) {
					objectPath.set(picked, field, objectPath.get(obj, field));
				} else {
					picked[field] = obj[field];
				}
			});
			return picked;
		};

		if (fieldsToRemove.length > 0 || fieldsToGet.length > 0) {
			if (Array.isArray(result)) {
				result = result.map((record) => {
					if (fieldsToRemove.length > 0) {
						return _.omit(record, ...fieldsToRemove);
					}

					if (fieldsToGet.length > 0) {
						return pickFields(record, fieldsToGet);
					}
				});
			} else {
				if (fieldsToRemove.length > 0) {
					return _.omit(result, ...fieldsToRemove);
				}

				if (fieldsToGet.length > 0) {
					return pickFields(result, fieldsToGet);
				}
			}
		}

		return result;
	}

	// dinamicTrashFindAfter(method, deletedAt, ...args) {
	// 	const scope = {
	// 		find: (query={}) => {
	// 			return this.trashFindDeletedAfter(deletedAt, query, { fields: {_id: 1, _deletedAt: 1} });
	// 		}
	// 	};

	// 	scope.model = {
	// 		find: scope.find
	// 	};

	// 	return this[method].apply(scope, args);
	// }

	// dinamicFindAfter(method, updatedAt, ...args) {
	// 	const scope = {
	// 		find: (query={}, options) => {
	// 			query._updatedAt = {
	// 				$gt: updatedAt
	// 			};

	// 			return this.find(query, options);
	// 		}
	// 	};

	// 	scope.model = {
	// 		find: scope.find
	// 	};

	// 	return this[method].apply(scope, args);
	// }

	// dinamicFindChangesAfter(method, updatedAt, ...args) {
	// 	return {
	// 		update: this.dinamicFindAfter(method, updatedAt, ...args).fetch(),
	// 		remove: this.dinamicTrashFindAfter(method, updatedAt, ...args).fetch()
	// 	};
	// }

}

RocketChat.models._Base = ModelsBase;
