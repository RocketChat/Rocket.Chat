import { API } from '../../../api/server';
import { Uploads } from '../../../models/server/raw';
import { FileUpload } from '../../../file-upload/server';
import { isFederationEnabled } from '../lib/isFederationEnabled';

API.v1.addRoute(
	'federation.uploads',
	{ authRequired: false },
	{
		get() {
			if (!isFederationEnabled()) {
				return API.v1.failure('Federation not enabled');
			}

			const { upload_id } = this.requestParams();

			const upload = Promise.await(Uploads.findOneById(upload_id));

			if (!upload) {
				return API.v1.failure('There is no such file in this server');
			}

			const buffer = FileUpload.getBufferSync(upload);

			return API.v1.success({ upload, buffer });
		},
	},
);
