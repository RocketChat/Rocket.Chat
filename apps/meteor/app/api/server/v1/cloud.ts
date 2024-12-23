import { isCloudConfirmationPollProps, isCloudCreateRegistrationIntentProps, isCloudManualRegisterProps } from '@rocket.chat/rest-typings';

import { CloudWorkspaceRegistrationError } from '../../../../lib/errors/CloudWorkspaceRegistrationError';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { hasRoleAsync } from '../../../authorization/server/functions/hasRole';
import { getCheckoutUrl } from '../../../cloud/server/functions/getCheckoutUrl';
import { getConfirmationPoll } from '../../../cloud/server/functions/getConfirmationPoll';
import {
	CloudWorkspaceAccessTokenEmptyError,
	CloudWorkspaceAccessTokenError,
} from '../../../cloud/server/functions/getWorkspaceAccessToken';
import { registerPreIntentWorkspaceWizard } from '../../../cloud/server/functions/registerPreIntentWorkspaceWizard';
import { removeLicense } from '../../../cloud/server/functions/removeLicense';
import { retrieveRegistrationStatus } from '../../../cloud/server/functions/retrieveRegistrationStatus';
import { saveRegistrationData, saveRegistrationDataManual } from '../../../cloud/server/functions/saveRegistrationData';
import { startRegisterWorkspaceSetupWizard } from '../../../cloud/server/functions/startRegisterWorkspaceSetupWizard';
import { syncWorkspace } from '../../../cloud/server/functions/syncWorkspace';
import { API } from '../api';

API.v1.addRoute(
	'cloud.manualRegister',
	{ authRequired: true, permissionsRequired: ['register-on-cloud'], validateParams: isCloudManualRegisterProps },
	{
		async post() {
			const registrationInfo = await retrieveRegistrationStatus();

			if (registrationInfo.workspaceRegistered) {
				return API.v1.failure('Workspace is already registered');
			}

			const settingsData = JSON.parse(Buffer.from(this.bodyParams.cloudBlob, 'base64').toString());

			await saveRegistrationDataManual(settingsData);

			return API.v1.success();
		},
	},
);

API.v1.addRoute(
	'cloud.createRegistrationIntent',
	{ authRequired: true, permissionsRequired: ['manage-cloud'], validateParams: isCloudCreateRegistrationIntentProps },
	{
		async post() {
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
	{ authRequired: true, permissionsRequired: ['manage-cloud'] },
	{
		async post() {
			return API.v1.success({ offline: !(await registerPreIntentWorkspaceWizard()) });
		},
	},
);

API.v1.addRoute(
	'cloud.confirmationPoll',
	{ authRequired: true, permissionsRequired: ['manage-cloud'], validateParams: isCloudConfirmationPollProps },
	{
		async get() {
			const { deviceCode } = this.queryParams;

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
				return API.v1.forbidden();
			}

			const registrationStatus = await retrieveRegistrationStatus();

			return API.v1.success({ registrationStatus });
		},
	},
);

API.v1.addRoute(
	'cloud.syncWorkspace',
	{
		authRequired: true,
		permissionsRequired: ['manage-cloud'],
		rateLimiterOptions: { numRequestsAllowed: 2, intervalTimeInMS: 60000 },
	},
	{
		async post() {
			try {
				await syncWorkspace();

				return API.v1.success({ success: true });
			} catch (error) {
				return API.v1.failure('Error during workspace sync');
			}
		},
	},
);

API.v1.addRoute(
	'cloud.removeLicense',
	{
		authRequired: true,
		permissionsRequired: ['manage-cloud'],
		rateLimiterOptions: { numRequestsAllowed: 2, intervalTimeInMS: 60000 },
	},
	{
		async post() {
			try {
				await removeLicense();
				return API.v1.success({ success: true });
			} catch (error) {
				switch (true) {
					case error instanceof CloudWorkspaceRegistrationError:
					case error instanceof CloudWorkspaceAccessTokenEmptyError:
					case error instanceof CloudWorkspaceAccessTokenError: {
						SystemLogger.info({
							msg: 'Manual license removal failed',
							endpoint: 'cloud.removeLicense',
							error,
						});
						break;
					}
					default: {
						SystemLogger.error({
							msg: 'Manual license removal failed',
							endpoint: 'cloud.removeLicense',
							error,
						});
						break;
					}
				}
			}
			return API.v1.failure('License removal failed');
		},
	},
);

/**
 * Declaring endpoint here because we don't want this available to the sdk client
 */
declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface Endpoints {
		'/v1/cloud.checkoutUrl': {
			GET: () => { url: string };
		};
	}
}

API.v1.addRoute(
	'cloud.checkoutUrl',
	{ authRequired: true, permissionsRequired: ['manage-cloud'] },
	{
		async get() {
			const checkoutUrl = await getCheckoutUrl();

			if (!checkoutUrl.url) {
				return API.v1.failure();
			}

			return API.v1.success({ url: checkoutUrl.url });
		},
	},
);
