import { check } from 'meteor/check';

import { API } from '../api';
import { hasPermission } from '../../../authorization/server';
import { saveRegistrationData } from '../../../cloud/server/functions/saveRegistrationData';
import { retrieveRegistrationStatus } from '../../../cloud/server/functions/retrieveRegistrationStatus';

API.v1.addRoute(
	'cloud.manualRegister',
	{ authRequired: true },
	{
		post() {
			check(this.bodyParams, {
				cloudBlob: String,
			});

			if (!hasPermission(this.userId, 'register-on-cloud')) {
				return API.v1.unauthorized();
			}

			const registrationInfo = retrieveRegistrationStatus();

			if (registrationInfo.workspaceRegistered) {
				return API.v1.failure('Workspace is already registered');
			}

			const settingsData = JSON.parse(Buffer.from(this.bodyParams.cloudBlob, 'base64').toString());

			Promise.await(saveRegistrationData(settingsData));

			return API.v1.success();
		},
	},
);
