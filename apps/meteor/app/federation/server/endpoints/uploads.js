import { Uploads } from '@rocket.chat/models';

import { API } from '../../../api/server';
import { FileUpload } from '../../../file-upload/server';
import { apiDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { isFederationEnabled } from '../lib/isFederationEnabled';

API.v1.addRoute(
	'federation.uploads',
	{ authRequired: false },
	{
		async get() {
			/*
			The legacy federation has been deprecated for over a year
			and no longer receives any updates. This feature also has
			relevant security issues that weren't addressed.
			Workspaces should migrate to the newer matrix federation.
			*/
			apiDeprecationLogger.endpoint(this.request.route, '8.0.0', this.response, 'Use Matrix Federation instead.');

			if (!process.env.ENABLE_INSECURE_LEGACY_FEDERATION) {
				return API.v1.failure('Deprecated. ENABLE_INSECURE_LEGACY_FEDERATION environment variable is needed to enable it.');
			}

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
