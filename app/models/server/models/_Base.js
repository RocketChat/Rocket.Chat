import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import objectPath from 'object-path';
import _ from 'underscore';

import { BaseDb } from './_BaseDb';

export class Base {
	constructor(nameOrModel) {
		this._db = new BaseDb(nameOrModel, this);
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

	roleBaseQuery() {

	}

	findRolesByUserId(userId) {
		const query = this.roleBaseQuery(userId);
		return this.find(query, { fields: { roles: 1 } });
	}

	isUserInRole(userId, roleName, scope) {
		const query = this.roleBaseQuery(userId, scope);

		if (query == null) {
			return false;
		}

		query.roles = roleName;
		return !_.isUndefined(this.findOne(query, { fields: { roles: 1 } }));
	}

	isUserInRoleScope(uid, scope) {
		const query = this.roleBaseQuery(uid, scope);
		if (!query) {
			return false;
		}

		const options = {
			fields: { _id: 1 },
		};

		const found = this.findOne(query, options);
		return !!found;
	}

	addRolesByUserId(userId, roles, scope) {
		roles = [].concat(roles);
		const query = this.roleBaseQuery(userId, scope);
		const update = {
			$addToSet: {
				roles: { $each: roles },
			},
		};
		return this.update(query, update);
	}

	removeRolesByUserId(userId, roles, scope) {
		roles = [].concat(roles);
		const query = this.roleBaseQuery(userId, scope);
		const update = {
			$pullAll: {
				roles,
			},
		};
		return this.update(query, update);
	}

	findUsersInRoles() {
		throw new Meteor.Error('overwrite-function', 'You must overwrite this function in the extended classes');
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
			},
		};
	}

	setUpdatedAt(...args/* record, checkQuery, query*/) {
		return this._db.setUpdatedAt(...args);
	}

	find(...args) {
		try {
			return this[this.origin].find(...args);
		} catch (e) {
			console.error('Exception on find', e, ...args);
		}
	}

	findOne(...args) {
		try {
			return this[this.origin].findOne(...args);
		} catch (e) {
			console.error('Exception on find', e, ...args);
		}
	}

	findOneById(...args) {
		try {
			return this[this.origin].findOneById(...args);
		} catch (e) {
			console.error('Exception on find', e, ...args);
		}
	}

	findOneByIds(ids, options, ...args) {
		check(ids, [String]);

		try {
			return this[this.origin].findOneByIds(ids, options);
		} catch (e) {
			console.error('Exception on find', e, [ids, options, ...args]);
		}
	}

	insert(...args/* record*/) {
		return this._db.insert(...args);
	}

	update(...args/* query, update, options*/) {
		return this._db.update(...args);
	}

	upsert(...args/* query, update*/) {
		return this._db.upsert(...args);
	}

	remove(...args/* query*/) {
		return this._db.remove(...args);
	}

	insertOrUpsert(...args) {
		return this._db.insertOrUpsert(...args);
	}

	allow(...args) {
		return this._db.allow(...args);
	}

	deny(...args) {
		return this._db.deny(...args);
	}

	ensureIndex(...args) {
		return this._db.ensureIndex(...args);
	}

	dropIndex(...args) {
		return this._db.dropIndex(...args);
	}

	tryEnsureIndex(...args) {
		return this._db.tryEnsureIndex(...args);
	}

	tryDropIndex(...args) {
		return this._db.tryDropIndex(...args);
	}

	trashFind(...args/* query, options*/) {
		return this._db.trashFind(...args);
	}

	trashFindOneById(...args/* _id, options*/) {
		return this._db.trashFindOneById(...args);
	}

	trashFindDeletedAfter(...args/* deletedAt, query, options*/) {
		return this._db.trashFindDeletedAfter(...args);
	}

	trashFindDeleted(...args) {
		return this._db.trashFindDeleted(...args);
	}

	processQueryOptionsOnResult(result, options = {}) {
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

					return null;
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
