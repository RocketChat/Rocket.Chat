import _ from 'underscore';
import s from 'underscore.string';
import { InstanceStatus } from 'meteor/konecty:multiple-instances-status';

import { Base } from './_Base';

const fillTypeGroup = (fileData) => {
	if (!fileData.type) {
		return;
	}

	fileData.typeGroup = fileData.type.split('/').shift();
};

export class Uploads extends Base {
	constructor() {
		super('uploads');

		this.model.before.insert((userId, doc) => {
			doc.instanceId = InstanceStatus.id();
		});

		this.tryEnsureIndex({ rid: 1 });
		this.tryEnsureIndex({ uploadedAt: 1 });
		this.tryEnsureIndex({ typeGroup: 1 });
	}

	findNotHiddenFilesOfRoom(roomId, searchText, fileType, limit) {
		const fileQuery = {
			rid: roomId,
			complete: true,
			uploading: false,
			_hidden: {
				$ne: true,
			},
		};

		if (searchText) {
			fileQuery.name = { $regex: new RegExp(RegExp.escape(searchText), 'i') };
		}

		if (fileType && fileType !== 'all') {
			fileQuery.typeGroup = fileType;
		}

		const fileOptions = {
			limit,
			sort: {
				uploadedAt: -1,
			},
			fields: {
				_id: 1,
				userId: 1,
				rid: 1,
				name: 1,
				description: 1,
				type: 1,
				url: 1,
				uploadedAt: 1,
				typeGroup: 1,
			},
		};

		return this.find(fileQuery, fileOptions);
	}

	insert(fileData, ...args) {
		fillTypeGroup(fileData);
		return super.insert(fileData, ...args);
	}

	update(filter, update, ...args) {
		if (update.$set) {
			fillTypeGroup(update.$set);
		} else if (update.type) {
			fillTypeGroup(update);
		}

		return super.update(filter, update, ...args);
	}

	insertFileInit(userId, store, file, extra) {
		const fileData = {
			userId,
			store,
			complete: false,
			uploading: true,
			progress: 0,
			extension: s.strRightBack(file.name, '.'),
			uploadedAt: new Date(),
		};

		_.extend(fileData, file, extra);

		if (this.model.direct && this.model.direct.insert != null) {
			fillTypeGroup(fileData);
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
			userId,
		};

		const update = {
			$set: {
				complete: true,
				uploading: false,
				progress: 1,
			},
		};

		update.$set = _.extend(file, update.$set);

		if (this.model.direct && this.model.direct.update != null) {
			fillTypeGroup(update.$set);

			result = this.model.direct.update(filter, update);
		} else {
			result = this.update(filter, update);
		}

		return result;
	}

	deleteFile(fileId) {
		if (this.model.direct && this.model.direct.remove != null) {
			return this.model.direct.remove({ _id: fileId });
		}
		return this.remove({ _id: fileId });
	}
}

export default new Uploads();
