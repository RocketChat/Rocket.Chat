import { Uploads } from '@rocket.chat/models';

import { API } from '../../../api/server';
import { FileUpload } from '../../../file-upload/server';
import { isFederationEnabled } from '../lib/isFederationEnabled';

API.v1.addRoute(
	'federation.uploads',
	{ authRequired: false },
	{
		async get() {
			if (!isFederationEnabled()) {
				return API.v1.failure('Federation not enabled');
			}

			const { upload_id } = this.queryParams;

			const upload = await Uploads.findOneById(upload_id);

			if (!upload) {
				return API.v1.failure('There is no such file in this server');
			}

			const buffer = await FileUpload.getBuffer(upload);

			return API.v1.success({ upload, buffer });
		},
	},
);
