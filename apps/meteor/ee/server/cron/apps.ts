import { cronJobs } from '@rocket.chat/cron';
import { License } from '@rocket.chat/license';
import { Settings, Users } from '@rocket.chat/models';

import { notifyAdminsAboutInvalidApps } from './notifyAdminsAboutInvalidApps';
import { notifyAdminsAboutRenewedApps } from './notifyAdminsAboutRenewedApps';
import { getWorkspaceAccessToken } from '../../../server/lib/cloud';
import { Apps } from '../lib/apps/orchestrator';

const appsUpdateMarketplaceInfo = async function _appsUpdateMarketplaceInfo() {
	if (License.hasOfflineLicense()) {
		return;
	}

	const token = await getWorkspaceAccessToken();
	const workspaceIdSetting = await Settings.getValueById('Cloud_Workspace_Id');

	const currentSeats = await Users.getActiveLocalUserCount();

	const fullUrl = `v1/workspaces/${workspaceIdSetting}/apps`;

	let data = [];

	try {
		const response = await Apps.getMarketplaceClient().fetch(fullUrl, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
			params: {
				seats: currentSeats,
			},
			// SECURITY: the URL is a default hardcoded value or an envvar/setting set by an admin. It's safe to disable this check.
			ignoreSsrfValidation: true,
		});

		const result = await response.json();

		if (Array.isArray(result)) {
			data = result;
		}
	} catch (err) {
		Apps.debugLog(err);
	}

	await Apps.updateAppsMarketplaceInfo(data).then(notifyAdminsAboutInvalidApps).then(notifyAdminsAboutRenewedApps);
};

await cronJobs.add('Apps-Engine:check', '0 4 * * *', async () => appsUpdateMarketplaceInfo());
