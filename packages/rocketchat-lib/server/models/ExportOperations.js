import _ from 'underscore';

RocketChat.models.ExportOperations = new class ModelExportOperations extends RocketChat.models._Base {
	constructor() {
		super('exportOperations');

		this.tryEnsureIndex({ 'userId': 1 });
		this.tryEnsureIndex({ 'status': 1 });
	}

	// FIND
	findById(id) {
		const query = {_id: id};

		return this.find(query);
	}

	findLastOperationByUser(userId, options = {}) {
		const query = {
			userId
		};

		options.sort = {'createdAt' : -1};
		return this.findOne(query, options);
	}

	findPendingByUser(userId, options) {
		const query = {
			userId,
			status: {
				$in: ['pending', 'exporting']
			}
		};

		return this.find(query, options);
	}

	findAllPending(options) {
		const query = {
			status: { $in: ['pending', 'exporting'] }
		};

		return this.find(query, options);
	}

	// UPDATE
	updateOperation(data) {
		const update = {
			$set: {
				roomList: data.roomList,
				status: data.status,
				fileList: data.fileList,
				generatedFile: data.generatedFile
			}
		};

		return this.update(data._id, update);
	}


	// INSERT
	create(data) {
		const exportOperation = {
			createdAt: new Date
		};

		_.extend(exportOperation, data);

		return this.insert(exportOperation);
	}


	// REMOVE
	removeById(_id) {
		return this.remove(_id);
	}
};
