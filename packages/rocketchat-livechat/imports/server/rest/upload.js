import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';
import { FileUpload } from 'meteor/rocketchat:file-upload';
import { API } from 'meteor/rocketchat:api';
import Busboy from 'busboy';
import filesize from 'filesize';
import LivechatVisitors from '../../../server/models/LivechatVisitors';
let maxFileSize;

RocketChat.settings.get('FileUpload_MaxFileSize', function(key, value) {
	try {
		maxFileSize = parseInt(value);
	} catch (e) {
		maxFileSize = RocketChat.models.Settings.findOneById('FileUpload_MaxFileSize').packageValue;
	}
});

API.v1.addRoute('livechat/upload/:rid', {
	post() {
		if (!this.request.headers['x-visitor-token']) {
			return API.v1.unauthorized();
		}

		const visitorToken = this.request.headers['x-visitor-token'];
		const visitor = LivechatVisitors.getVisitorByToken(visitorToken);

		if (!visitor) {
			return API.v1.unauthorized();
		}

		const room = RocketChat.models.Rooms.findOneOpenByRoomIdAndVisitorToken(this.urlParams.rid, visitorToken);
		if (!room) {
			return API.v1.unauthorized();
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
			return API.v1.failure('File required');
		}

		if (files.length > 1) {
			return API.v1.failure('Just 1 file is allowed');
		}

		const file = files[0];

		if (!RocketChat.fileUploadIsValidContentType(file.mimetype)) {
			return API.v1.failure({
				reason: 'error-type-not-allowed',
			});
		}

		// -1 maxFileSize means there is no limit
		if (maxFileSize > -1 && file.fileBuffer.length > maxFileSize) {
			return API.v1.failure({
				reason: 'error-size-not-allowed',
				sizeAllowed: filesize(maxFileSize),
			});
		}

		const fileStore = FileUpload.getStore('Uploads');

		const details = {
			name: file.filename,
			size: file.fileBuffer.length,
			type: file.mimetype,
			rid: this.urlParams.rid,
			visitorToken,
		};

		const uploadedFile = Meteor.wrapAsync(fileStore.insert.bind(fileStore))(details, file.fileBuffer);

		uploadedFile.description = fields.description;

		delete fields.description;
		API.v1.success(Meteor.call('sendFileLivechatMessage', this.urlParams.rid, visitorToken, uploadedFile, fields));
	},
});
