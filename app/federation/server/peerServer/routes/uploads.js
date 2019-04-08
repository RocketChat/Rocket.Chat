import { Meteor } from 'meteor/meteor';
import { API } from '../../../../api';
import { Uploads } from '../../../../models';
import { FileUpload } from '../../../../file-upload';

import peerServer from '../peerServer';

API.v1.addRoute('federation.uploads', { authRequired: false }, {
	get() {
		if (!peerServer.enabled) {
			return API.v1.failure('Not found');
		}

		const { upload_id } = this.requestParams();

		const upload = Uploads.findOneById(upload_id);

		if (!upload) {
			return API.v1.failure('There is no such file in this server');
		}

		const getFileBuffer = Meteor.wrapAsync(FileUpload.getBuffer, FileUpload);

		const buffer = getFileBuffer(upload);

		return API.v1.success({ upload, buffer });
	},
});
