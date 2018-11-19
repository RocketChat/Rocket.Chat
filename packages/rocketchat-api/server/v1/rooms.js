import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';
import { FileUpload } from 'meteor/rocketchat:file-upload';
import Busboy from 'busboy';

function findRoomByIdOrName({ params, checkedArchived = true }) {
	if ((!params.roomId || !params.roomId.trim()) && (!params.roomName || !params.roomName.trim())) {
		throw new Meteor.Error('error-roomid-param-not-provided', 'The parameter "roomId" or "roomName" is required');
	}

	const fields = { ...RocketChat.API.v1.defaultFieldsToExclude };

	let room;
	if (params.roomId) {
		room = RocketChat.models.Rooms.findOneById(params.roomId, { fields });
	} else if (params.roomName) {
		room = RocketChat.models.Rooms.findOneByName(params.roomName, { fields });
	}
	if (!room) {
		throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "roomName" param provided does not match any channel');
	}
	if (checkedArchived && room.archived) {
		throw new Meteor.Error('error-room-archived', `The channel, ${ room.name }, is archived`);
	}

	return room;
}

RocketChat.API.v1.addRoute('rooms.get', { authRequired: true }, {
	get() {
		const { updatedSince } = this.queryParams;

		let updatedSinceDate;
		if (updatedSince) {
			if (isNaN(Date.parse(updatedSince))) {
				throw new Meteor.Error('error-updatedSince-param-invalid', 'The "updatedSince" query parameter must be a valid date.');
			} else {
				updatedSinceDate = new Date(updatedSince);
			}
		}

		let result;
		Meteor.runAsUser(this.userId, () => result = Meteor.call('rooms/get', updatedSinceDate));

		if (Array.isArray(result)) {
			result = {
				update: result,
				remove: [],
			};
		}

		return RocketChat.API.v1.success({
			update: result.update.map((room) => this.composeRoomWithLastMessage(room, this.userId)),
			remove: result.remove.map((room) => this.composeRoomWithLastMessage(room, this.userId)),
		});
	},
});

RocketChat.API.v1.addRoute('rooms.upload/:rid', { authRequired: true }, {
	post() {
		const room = Meteor.call('canAccessRoom', this.urlParams.rid, this.userId);

		if (!room) {
			return RocketChat.API.v1.unauthorized();
		}

		const busboy = new Busboy({ headers: this.request.headers });
		const files = [];
		const fields = {};

		Meteor.wrapAsync((callback) => {
			busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
				if (fieldname !== 'file') {
					return files.push(new Meteor.Error('invalid-field'));
				}

				const fileDate = [];
				file.on('data', (data) => fileDate.push(data));

				file.on('end', () => {
					files.push({ fieldname, file, filename, encoding, mimetype, fileBuffer: Buffer.concat(fileDate) });
				});
			});

			busboy.on('field', (fieldname, value) => fields[fieldname] = value);

			busboy.on('finish', Meteor.bindEnvironment(() => callback()));

			this.request.pipe(busboy);
		})();

		if (files.length === 0) {
			return RocketChat.API.v1.failure('File required');
		}

		if (files.length > 1) {
			return RocketChat.API.v1.failure('Just 1 file is allowed');
		}

		const file = files[0];

		const fileStore = FileUpload.getStore('Uploads');

		const details = {
			name: file.filename,
			size: file.fileBuffer.length,
			type: file.mimetype,
			rid: this.urlParams.rid,
			userId: this.userId,
		};

		Meteor.runAsUser(this.userId, () => {
			const uploadedFile = Meteor.wrapAsync(fileStore.insert.bind(fileStore))(details, file.fileBuffer);

			uploadedFile.description = fields.description;

			delete fields.description;

			RocketChat.API.v1.success(Meteor.call('sendFileMessage', this.urlParams.rid, null, uploadedFile, fields));
		});

		return RocketChat.API.v1.success();
	},
});

RocketChat.API.v1.addRoute('rooms.saveNotification', { authRequired: true }, {
	post() {
		const saveNotifications = (notifications, roomId) => {
			Object.keys(notifications).forEach((notificationKey) =>
				Meteor.runAsUser(this.userId, () =>
					Meteor.call('saveNotificationSettings', roomId, notificationKey, notifications[notificationKey])
				)
			);
		};
		const { roomId, notifications } = this.bodyParams;

		if (!roomId) {
			return RocketChat.API.v1.failure('The \'roomId\' param is required');
		}

		if (!notifications || Object.keys(notifications).length === 0) {
			return RocketChat.API.v1.failure('The \'notifications\' param is required');
		}

		saveNotifications(notifications, roomId);

		return RocketChat.API.v1.success();
	},
});

RocketChat.API.v1.addRoute('rooms.favorite', { authRequired: true }, {
	post() {
		const { favorite } = this.bodyParams;

		if (!this.bodyParams.hasOwnProperty('favorite')) {
			return RocketChat.API.v1.failure('The \'favorite\' param is required');
		}

		const room = findRoomByIdOrName({ params: this.bodyParams });

		Meteor.runAsUser(this.userId, () => Meteor.call('toggleFavorite', room._id, favorite));

		return RocketChat.API.v1.success();
	},
});

RocketChat.API.v1.addRoute('rooms.cleanHistory', { authRequired: true }, {
	post() {
		const findResult = findRoomByIdOrName({ params: this.bodyParams });

		if (!this.bodyParams.latest) {
			return RocketChat.API.v1.failure('Body parameter "latest" is required.');
		}

		if (!this.bodyParams.oldest) {
			return RocketChat.API.v1.failure('Body parameter "oldest" is required.');
		}

		const latest = new Date(this.bodyParams.latest);
		const oldest = new Date(this.bodyParams.oldest);

		const inclusive = this.bodyParams.inclusive || false;

		Meteor.runAsUser(this.userId, () => Meteor.call('cleanRoomHistory', {
			roomId: findResult._id,
			latest,
			oldest,
			inclusive,
			limit: this.bodyParams.limit,
			excludePinned: this.bodyParams.excludePinned,
			filesOnly: this.bodyParams.filesOnly,
			fromUsers: this.bodyParams.users,
		}));

		return RocketChat.API.v1.success();
	},
});

RocketChat.API.v1.addRoute('rooms.info', { authRequired: true }, {
	get() {
		const room = findRoomByIdOrName({ params: this.requestParams() });
		const { fields } = this.parseJsonQuery();
		if (!Meteor.call('canAccessRoom', room._id, this.userId, {})) {
			return RocketChat.API.v1.failure('not-allowed', 'Not Allowed');
		}
		return RocketChat.API.v1.success({ room: RocketChat.models.Rooms.findOneByIdOrName(room._id, { fields }) });
	},
});

RocketChat.API.v1.addRoute('rooms.leave', { authRequired: true }, {
	post() {
		const room = findRoomByIdOrName({ params: this.bodyParams });
		Meteor.runAsUser(this.userId, () => {
			Meteor.call('leaveRoom', room._id);
		});

		return RocketChat.API.v1.success();
	},
});
