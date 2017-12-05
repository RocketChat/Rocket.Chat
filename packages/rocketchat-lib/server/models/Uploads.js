/* globals InstanceStatus */
import _ from 'underscore';
import s from 'underscore.string';

RocketChat.models.Uploads = new class extends RocketChat.models._Base {
	constructor() {
		super('uploads');

		this.model.before.insert((userId, doc) => {
			doc.instanceId = InstanceStatus.id();
		});

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

	insertFileInit(userId, store, file, extra) {
		const fileData = {
			userId,
			store,
			complete: false,
			uploading: true,
			progress: 0,
			extension: s.strRightBack(file.name, '.'),
			uploadedAt: new Date()
		};

		_.extend(fileData, file, extra);

		if (this.model.direct && this.model.direct.insert != null) {
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

		if (this.model.direct && this.model.direct.update != null) {
			result = this.model.direct.update(filter, update);
		} else {
			result = this.update(filter, update);
		}

		return result;
	}

	deleteFile(fileId) {
		if (this.model.direct && this.model.direct.remove != null) {
			return this.model.direct.remove({ _id: fileId });
		} else {
			return this.remove({ _id: fileId });
		}
	}
};
