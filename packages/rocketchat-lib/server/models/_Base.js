import ModelsBaseDb from './_BaseDb';

class ModelsBase {
	constructor() {
		this.db = new ModelsBaseDb(...arguments);
		this.model = this.db.model;
		this.collectionName = this.db.collectionName;
		this.name = this.db.name;
	}

	setUpdatedAt(/*record, checkQuery, query*/) {
		return this.db.setUpdatedAt(...arguments);
	}

	find() {
		return this.db.find(...arguments);
	}

	findOne() {
		return this.db.findOne(...arguments);
	}

	insert(/*record*/) {
		return this.db.insert(...arguments);
	}

	update(/*query, update, options*/) {
		return this.db.update(...arguments);
	}

	upsert(/*query, update*/) {
		return this.db.upsert(...arguments);
	}

	remove(/*query*/) {
		return this.db.remove(...arguments);
	}

	insertOrUpsert() {
		return this.db.insertOrUpsert(...arguments);
	}

	allow() {
		return this.db.allow(...arguments);
	}

	deny() {
		return this.db.deny(...arguments);
	}

	ensureIndex() {
		return this.db.ensureIndex(...arguments);
	}

	dropIndex() {
		return this.db.dropIndex(...arguments);
	}

	tryEnsureIndex() {
		return this.db.tryEnsureIndex(...arguments);
	}

	tryDropIndex() {
		return this.db.tryDropIndex(...arguments);
	}

	trashFind(/*query, options*/) {
		return this.db.trashFind(...arguments);
	}

	trashFindDeletedAfter(/*deletedAt, query, options*/) {
		return this.db.trashFindDeletedAfter(...arguments);
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
