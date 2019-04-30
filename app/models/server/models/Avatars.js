import _ from 'underscore';
import s from 'underscore.string';
import { InstanceStatus } from 'meteor/konecty:multiple-instances-status';
import { Base } from './_Base';

export class Avatars extends Base {
	constructor() {
		super('avatars');

		this.model.before.insert((userId, doc) => {
			doc.instanceId = InstanceStatus.id();
		});

		this.tryEnsureIndex({ name: 1 });
	}

	insertAvatarFileInit(name, userId, store, file, extra) {
		const fileData = {
			_id: name,
			name,
			userId,
			store,
			complete: false,
			uploading: true,
			progress: 0,
			extension: s.strRightBack(file.name, '.'),
			uploadedAt: new Date(),
		};

		_.extend(fileData, file, extra);

		return this.insertOrUpsert(fileData);
	}

	updateFileComplete(fileId, userId, file) {
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

		if (this.model.direct && this.model.direct.update) {
			return this.model.direct.update(filter, update);
		}
		return this.update(filter, update);
	}

	findOneByName(name) {
		return this.findOne({ name });
	}

	updateFileNameById(fileId, name) {
		const filter = { _id: fileId };
		const update = {
			$set: {
				name,
			},
		};
		if (this.model.direct && this.model.direct.update) {
			return this.model.direct.update(filter, update);
		}
		return this.update(filter, update);
	}

	// @TODO deprecated
	updateFileCompleteByNameAndUserId(name, userId, url) {
		if (!name) {
			return;
		}

		const filter = {
			name,
			userId,
		};

		const update = {
			$set: {
				complete: true,
				uploading: false,
				progress: 1,
				url,
			},
		};

		if (this.model.direct && this.model.direct.update) {
			return this.model.direct.update(filter, update);
		}
		return this.update(filter, update);
	}

	deleteFile(fileId) {
		if (this.model.direct && this.model.direct.remove) {
			return this.model.direct.remove({ _id: fileId });
		}
		return this.remove({ _id: fileId });
	}
}

export default new Avatars();
