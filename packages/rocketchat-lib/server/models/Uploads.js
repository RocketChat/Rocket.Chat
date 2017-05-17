RocketChat.models.Uploads = new class extends RocketChat.models._Base {
	constructor() {
		super('uploads');

		this.tryEnsureIndex({ 'rid': 1 });
		this.tryEnsureIndex({ 'uploadedAt': 1 });
	}

	findNotHiddenFilesOfRoom(roomId, limit) {
		const fileQuery = {
			rid: roomId,
			complete: true,
			uploading: false,
			_hidden: {
				$ne: true
			}
		};

		const fileOptions = {
			limit,
			sort: {
				uploadedAt: -1
			},
			fields: {
				_id: 1,
				userId: 1,
				rid: 1,
				name: 1,
				description: 1,
				type: 1,
				url: 1,
				uploadedAt: 1
			}
		};

		return this.find(fileQuery, fileOptions);
	}

	insertFileInit(roomId, userId, store, file, extra) {
		const fileData = {
			rid: roomId,
			userId,
			store,
			complete: false,
			uploading: true,
			progress: 0,
			extension: s.strRightBack(file.name, '.'),
			uploadedAt: new Date()
		};

		_.extend(fileData, file, extra);

		if ((this.model.direct != null ? this.model.direct.insert : undefined) != null) {
			file = this.model.direct.insert(fileData);
		} else {
			file = this.insert(fileData);
		}

		return file;
	}

	updateFileComplete(fileId, userId, file) {
		let result;
		if (!fileId) {
			return;
		}

		const filter = {
			_id: fileId,
			userId
		};

		const update = {
			$set: {
				complete: true,
				uploading: false,
				progress: 1
			}
		};

		update.$set = _.extend(file, update.$set);

		if ((this.model.direct != null ? this.model.direct.insert : undefined) != null) {
			result = this.model.direct.update(filter, update);
		} else {
			result = this.update(filter, update);
		}

		return result;
	}
};
