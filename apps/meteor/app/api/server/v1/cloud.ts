import { check } from 'meteor/check';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { hasRoleAsync } from '../../../authorization/server/functions/hasRole';
import { getConfirmationPoll } from '../../../cloud/server/functions/getConfirmationPoll';
import { registerPreIntentWorkspaceWizard } from '../../../cloud/server/functions/registerPreIntentWorkspaceWizard';
import { retrieveRegistrationStatus } from '../../../cloud/server/functions/retrieveRegistrationStatus';
import { saveRegistrationData } from '../../../cloud/server/functions/saveRegistrationData';
import { startRegisterWorkspaceSetupWizard } from '../../../cloud/server/functions/startRegisterWorkspaceSetupWizard';
import { API } from '../api';

API.v1.addRoute(
	'cloud.manualRegister',
	{ authRequired: true },
	{
		async post() {
			check(this.bodyParams, {
				cloudBlob: String,
			});

			if (!(await hasPermissionAsync(this.userId, 'register-on-cloud'))) {
				return API.v1.unauthorized();
			}

			const registrationInfo = await retrieveRegistrationStatus();

			if (registrationInfo.workspaceRegistered) {
				return API.v1.failure('Workspace is already registered');
			}

			const settingsData = JSON.parse(Buffer.from(this.bodyParams.cloudBlob, 'base64').toString());

			await saveRegistrationData(settingsData);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'cloud.createRegistrationIntent',
	{ authRequired: true },
	{
		async post() {
			check(this.bodyParams, {
				resend: Boolean,
				email: String,
			});

			if (!(await hasPermissionAsync(this.userId, 'manage-cloud'))) {
				return API.v1.unauthorized();
			}

			const intentData = await startRegisterWorkspaceSetupWizard(this.bodyParams.resend, this.bodyParams.email);

			if (intentData) {
				return API.v1.success({ intentData });
			}

			return API.v1.failure('Invalid query');
		},
	},
);

API.v1.addRoute(
	'cloud.registerPreIntent',
	{ authRequired: true },
	{
		async post() {
			if (!(await hasPermissionAsync(this.userId, 'manage-cloud'))) {
				return API.v1.unauthorized();
			}

			return API.v1.success({ offline: !(await registerPreIntentWorkspaceWizard()) });
		},
	},
);

API.v1.addRoute(
	'cloud.confirmationPoll',
	{ authRequired: true },
	{
		async get() {
			const { deviceCode } = this.queryParams;
			check(this.queryParams, {
				deviceCode: String,
			});

			if (!(await hasPermissionAsync(this.userId, 'manage-cloud'))) {
				return API.v1.unauthorized();
			}

			if (!deviceCode) {
				return API.v1.failure('Invalid query');
			}

			const pollData = await getConfirmationPoll(deviceCode);
			if (pollData) {
				if ('successful' in pollData && pollData.successful) {
					await saveRegistrationData(pollData.payload);
				}
				return API.v1.success({ pollData });
			}

			return API.v1.failure('Invalid query');
		},
	},
);

API.v1.addRoute(
	'cloud.registrationStatus',
	{ authRequired: true },
	{
		async get() {
			if (!(await hasRoleAsync(this.userId, 'admin'))) {
				return API.v1.unauthorized();
			}

			const registrationStatus = await retrieveRegistrationStatus();

			return API.v1.success({ registrationStatus });
		},
	},
);
