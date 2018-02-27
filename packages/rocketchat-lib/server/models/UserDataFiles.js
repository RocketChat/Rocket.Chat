import _ from 'underscore';

RocketChat.models.UserDataFiles = new class ModelUserDataFiles extends RocketChat.models._Base {
	constructor() {
		super('userDataFiles');

		this.tryEnsureIndex({ 'userId': 1 });
	}

	// FIND
	findById(id) {
		const query = {_id: id};
		return this.find(query);
	}

	findLastFileByUser(userId, options = {}) {
		const query = {
			userId
		};

		options.sort = {'_updatedAt' : -1};
		return this.findOne(query, options);
	}

	// INSERT
	create(data) {
		const userDataFile = {
			createdAt: new Date
		};

		_.extend(userDataFile, data);

		return this.insert(userDataFile);
	}

	// REMOVE
	removeById(_id) {
		return this.remove(_id);
	}
};
