import { check } from 'meteor/check';
// import { HTTP } from 'meteor/http';

import { API } from '../api';
import { hasRole, hasPermission } from '../../../authorization/server';
import { saveRegistrationData } from '../../../cloud/server/functions/saveRegistrationData';
import { retrieveRegistrationStatus } from '../../../cloud/server/functions/retrieveRegistrationStatus';
import { startRegisterWorkspaceSetupWizard } from '../../../cloud/server/functions/startRegisterWorkspaceSetupWizard';
import { getConfirmationPoll } from '../../../cloud/server/functions/getConfirmationPoll';
// import { getWorkspaceAccessToken } from '../../../cloud/server/functions/getWorkspaceAccessToken';
import { getLicenses } from '../../../../ee/app/license/server/license';
import { getUpgradeTabType } from '../../../../lib/getUpgradeTabType';
// import { settings } from '../../../settings/server';

API.v1.addRoute(
	'cloud.manualRegister',
	{ authRequired: true },
	{
		async post() {
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

			if (!hasPermission(this.userId, 'manage-cloud')) {
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
	'cloud.confirmationPoll',
	{ authRequired: true },
	{
		async get() {
			const { deviceCode } = this.queryParams;
			check(this.queryParams, {
				deviceCode: String,
			});

			if (!hasPermission(this.userId, 'manage-cloud')) {
				return API.v1.unauthorized();
			}

			if (!deviceCode) {
				return API.v1.failure('Invalid query');
			}

			const pollData = await getConfirmationPoll(deviceCode);
			if (pollData) {
				if ('successful' in pollData && pollData.successful) {
					Promise.await(saveRegistrationData(pollData.payload));
				}
				return API.v1.success({ pollData });
			}

			return API.v1.failure('Invalid query');
		},
	},
);

API.v1.addRoute(
	'cloud.getUpgradeTabType',
	{ authRequired: true },
	{
		async get() {
			if (!hasRole(this.userId, 'admin')) {
				return API.v1.unauthorized();
			}

			const { workspaceRegistered /* , workspaceId*/ } = retrieveRegistrationStatus();

			const hadExpiredTrials = false;

			// if (workspaceRegistered) {
			// 	const accessToken = getWorkspaceAccessToken(true);

			// 	console.log('\ntoken: ', accessToken);

			// 	if (accessToken) {
			// 		try {
			// 			const cloudUrl = settings.get('Cloud_Url');

			// 			const url = `${cloudUrl}/api/v2/my/workspaces/${workspaceId}`;
			// 			console.log(url);

			// 			const result = HTTP.get(url, {
			// 				headers: { Authorization: `Bearer ${accessToken}` },
			// 			});
			// 			console.log(result);
			// 			// 	hadExpiredTrials = result.trialId;
			// 		} catch (e) {
			// 			console.log(e.response);
			// 		}
			// 	}
			// }

			const licenses = getLicenses()
				.filter(({ valid }) => valid)
				.map(({ license }) => license);

			// TODO update license type to include META
			// Depends on implementation on cloud side.
			const isTrial = !licenses.map(({ meta }) => meta?.trial).includes(false);
			const hasGoldLicense = licenses.map(({ tag }) => tag?.name === 'gold').includes(true);

			const upgradeTabType = getUpgradeTabType({
				registered: workspaceRegistered,
				hasValidLicense: licenses.length > 0,
				hadExpiredTrials,
				isTrial,
				hasGoldLicense,
			});

			return API.v1.success({ tabType: upgradeTabType });
		},
	},
);
