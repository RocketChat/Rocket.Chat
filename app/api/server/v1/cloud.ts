import { check } from 'meteor/check';

import { API } from '../api';
import { hasRole, hasPermission } from '../../../authorization/server';
import { saveRegistrationData } from '../../../cloud/server/functions/saveRegistrationData';
import { retrieveRegistrationStatus } from '../../../cloud/server/functions/retrieveRegistrationStatus';
import { startRegisterWorkspace } from '../../../cloud/server/functions/startRegisterWorkspace';
import { getConfirmationPoll } from '../../../cloud/server/functions/getConfirmationPoll';

API.v1.addRoute('cloud.manualRegister', { authRequired: true }, {
	post() {
		check(this.bodyParams, {
			cloudBlob: String,
		});

		if (!hasRole(this.userId, 'admin')) {
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
});

API.v1.addRoute('cloud.createRegistrationIntent', { authRequired: true }, {
	post() {
		check(this.bodyParams, {
			// cloudBlob: String,
		});

		if (!hasPermission(this.userId, 'manage-cloud')) {
			return API.v1.unauthorized();
		}

		const intentData = startRegisterWorkspace();

		if (intentData) {
			return API.v1.success({ intentData });
		}

		return API.v1.failure('Invalid query');
	},
});

API.v1.addRoute('cloud.confirmationPoll', { authRequired: true }, {
	get() {
		const { deviceCode } = this.queryParams;
		// check(this.bodyParams, {
		// 	// cloudBlob: String,
		// });

		if (!hasPermission(this.userId, 'manage-cloud')) {
			return API.v1.unauthorized();
		}

		const pollData = getConfirmationPoll(deviceCode);

		if (pollData) {
			return API.v1.success({ pollData });
		}

		return API.v1.failure('Invalid query');
	},
});
