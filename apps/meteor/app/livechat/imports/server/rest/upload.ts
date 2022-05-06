import { Meteor } from 'meteor/meteor';
import filesize from 'filesize';

import { FileUpload } from '../../../../file-upload/server/index.js';
import { settings } from '../../../../settings/server';
import { fileUploadIsValidContentType } from '../../../../utils/server';
import { LivechatRooms, LivechatVisitors } from '../../../../models/server/raw';
import { API } from '../../../../api/server';
import { getUploadFormData } from '../../../../api/server/lib/getUploadFormData';

API.v1.addRoute('livechat/upload/:rid', {
	async post() {
		const maxFileSize = settings.get<number>('FileUpload_MaxFileSize');
		if (!this.request.headers['x-visitor-token']) {
			return API.v1.unauthorized();
		}

		const visitorToken = this.request.headers['x-visitor-token'];
		const visitor = await LivechatVisitors.getVisitorByToken(visitorToken);

		if (!visitor) {
			return API.v1.unauthorized();
		}

		const room = await LivechatRooms.findOneOpenByRoomIdAndVisitorToken(this.urlParams.rid, visitorToken);
		if (!room) {
			return API.v1.unauthorized();
		}

		const { file, ...fields } = await getUploadFormData({
			request: this.request,
		});

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
			return API.v1.failure('Invalid file');
		}

		uploadedFile.description = fields.description;

		delete fields.description;
		return API.v1.success(Meteor.call('sendFileLivechatMessage', this.urlParams.rid, visitorToken, uploadedFile, fields));
	},
});
