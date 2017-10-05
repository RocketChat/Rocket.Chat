import ModelsBaseDb from './_BaseDb';
import ModelsBaseCache from './_BaseCache';

RocketChat.models._CacheControl = new Meteor.EnvironmentVariable();

class ModelsBase {
	constructor(nameOrModel, useCache) {
		this._db = new ModelsBaseDb(nameOrModel, this);
		this.model = this._db.model;
		this.collectionName = this._db.collectionName;
		this.name = this._db.name;

		this._useCache = useCache === true;

		this.cache = new ModelsBaseCache(this);
		// TODO_CACHE: remove
		this.on = this.cache.on.bind(this.cache);
		this.emit = this.cache.emit.bind(this.cache);
		this.getDynamicView = this.cache.getDynamicView.bind(this.cache);
		this.processQueryOptionsOnResult = this.cache.processQueryOptionsOnResult.bind(this.cache);
		// END_TODO_CACHE

		this.db = this;

		if (this._useCache) {
			this.db = new this.constructor(this.model, false);
		}
	}

	get useCache() {
		if (RocketChat.models._CacheControl.get() === false) {
			return false;
		}

		return this._useCache;
	}

	get origin() {
		return this.useCache === true ? 'cache' : '_db';
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

	trashFindDeletedAfter(/*deletedAt, query, options*/) {
		return this._db.trashFindDeletedAfter(...arguments);
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
