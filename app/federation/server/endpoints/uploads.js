import { Meteor } from 'meteor/meteor';

import { API } from '../../../../server/api';
import { Uploads } from '../../../models/server';
import { FileUpload } from '../../../file-upload/server';
import { isFederationEnabled } from '../lib/isFederationEnabled';

API.v1.addRoute('federation.uploads', { authRequired: false }, {
	get() {
		if (!isFederationEnabled()) {
			return API.v1.failure('Federation not enabled');
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
