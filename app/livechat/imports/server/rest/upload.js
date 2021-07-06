import { Meteor } from 'meteor/meteor';
import filesize from 'filesize';

import { settings } from '../../../../settings';
import { Settings, LivechatRooms, LivechatVisitors } from '../../../../models';
import { fileUploadIsValidContentType } from '../../../../utils/server';
import { FileUpload } from '../../../../file-upload';
import { API } from '../../../../api/server';
import { getUploadFormData } from '../../../../api/server/lib/getUploadFormData';

let maxFileSize;

settings.get('FileUpload_MaxFileSize', function(key, value) {
	try {
		maxFileSize = parseInt(value);
	} catch (e) {
		maxFileSize = Settings.findOneById('FileUpload_MaxFileSize').packageValue;
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

		const room = LivechatRooms.findOneOpenByRoomIdAndVisitorToken(this.urlParams.rid, visitorToken);
		if (!room) {
			return API.v1.unauthorized();
		}

		const { file, ...fields } = Promise.await(getUploadFormData({
			request: this.request,
		}));

		if (!fileUploadIsValidContentType(file.mimetype)) {
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

		const uploadedFile = fileStore.insertSync(details, file.fileBuffer);
		if (!uploadedFile) {
			return API.v1.error('Invalid file');
		}

		uploadedFile.description = fields.description;

		delete fields.description;
		API.v1.success(Meteor.call('sendFileLivechatMessage', this.urlParams.rid, visitorToken, uploadedFile, fields));
	},
});
