import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import _ from 'underscore';

import { BaseDb } from './_BaseDb';

export class Base {
	constructor(nameOrModel, options) {
		this._db = new BaseDb(nameOrModel, this, options);
		this.model = this._db.model;
		this.collectionName = this._db.collectionName;
		this.name = this._db.name;

		this.db = this;
	}

	get origin() {
		return '_db';
	}

	roleBaseQuery() {}

	findRolesByUserId(userId) {
		const query = this.roleBaseQuery(userId);
		return this.find(query, { fields: { roles: 1 } });
	}

	/**
	 * @param {string} userId
	 * @param {IRole['_id']} roleId
	 * @param {string} scope the value for the role scope (room id)
	 */
	isUserInRole(userId, roleId, scope) {
		const query = this.roleBaseQuery(userId, scope);

		if (query == null) {
			return false;
		}

		query.roles = roleId;
		return !_.isUndefined(this.findOne(query, { fields: { roles: 1 } }));
	}

	/**
	 * @param {string} uid
	 * @param {string} scope the value for the role scope (room id)
	 */
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

	/**
	 * @param {string} userId
	 * @param {IRole['_id'][]} roles the list of role ids
	 * @param {string} scope the value for the role scope (room id)
	 */
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

	/**
	 * @param {string} userId
	 * @param {IRole['_id'][]} roles the list of role ids
	 * @param {string} scope the value for the role scope (room id)
	 */
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

	setUpdatedAt(...args /* record, checkQuery, query*/) {
		return this._db.setUpdatedAt(...args);
	}

	find(...args) {
		try {
			return this[this.origin].find(...args);
		} catch (e) {
			console.error('Exception on find', e, ...args);
		}
	}

	findById(...args) {
		try {
			return this[this.origin].findById(...args);
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

	insert(...args /* record*/) {
		return this._db.insert(...args);
	}

	update(...args /* query, update, options*/) {
		return this._db.update(...args);
	}

	upsert(...args /* query, update*/) {
		return this._db.upsert(...args);
	}

	remove(...args /* query*/) {
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

	trashFind(...args /* query, options*/) {
		return this._db.trashFind(...args);
	}

	trashFindOneById(...args /* _id, options*/) {
		return this._db.trashFindOneById(...args);
	}

	trashFindDeletedAfter(...args /* deletedAt, query, options*/) {
		return this._db.trashFindDeletedAfter(...args);
	}

	trashFindDeleted(...args) {
		return this._db.trashFindDeleted(...args);
	}
}
