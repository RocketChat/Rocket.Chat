import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import type { ProxiedApp } from '@rocket.chat/apps-engine/server/ProxiedApp';
import { cronJobs } from '@rocket.chat/cron';
import { Settings, Users } from '@rocket.chat/models';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';

import { getWorkspaceAccessToken } from '../../../app/cloud/server';
import { i18n } from '../../../server/lib/i18n';
import { sendMessagesToAdmins } from '../../../server/lib/sendMessagesToAdmins';
import { Apps } from './orchestrator';

const notifyAdminsAboutInvalidApps = async function _notifyAdminsAboutInvalidApps(apps?: ProxiedApp[]) {
	if (!apps) {
		return;
	}

	const hasInvalidApps = !!apps.find((app) => app.getLatestLicenseValidationResult().hasErrors);

	if (!hasInvalidApps) {
		return;
	}

	const id = 'someAppInInvalidState';
	const title = 'Warning';
	const text = 'There is one or more apps in an invalid state. Click here to review.';
	const rocketCatMessage = 'There is one or more apps in an invalid state. Go to Administration > Apps to review.';
	const link = '/admin/apps';

	await sendMessagesToAdmins({
		msgs: async ({ adminUser }) => ({
			msg: `*${i18n.t(title, { lng: adminUser.language || 'en' })}*\n${i18n.t(rocketCatMessage, {
				lng: adminUser.language || 'en',
			})}`,
		}),
		banners: async ({ adminUser }) => {
			await Users.removeBannerById(adminUser._id, id);

			return [
				{
					id,
					priority: 10,
					title,
					text,
					modifiers: ['danger'],
					link,
				},
			];
		},
	});

	return apps;
};

const notifyAdminsAboutRenewedApps = async function _notifyAdminsAboutRenewedApps(apps?: ProxiedApp[]) {
	if (!apps) {
		return;
	}

	const renewedApps = apps.filter(
		(app) => app.getStatus() === AppStatus.DISABLED && app.getPreviousStatus() === AppStatus.INVALID_LICENSE_DISABLED,
	);

	if (renewedApps.length === 0) {
		return;
	}

	const rocketCatMessage = 'There is one or more disabled apps with valid licenses. Go to Administration > Apps to review.';

	await sendMessagesToAdmins({
		msgs: async ({ adminUser }) => ({ msg: `${i18n.t(rocketCatMessage, { lng: adminUser.language || 'en' })}` }),
	});
};

const appsUpdateMarketplaceInfo = async function _appsUpdateMarketplaceInfo() {
	const token = await getWorkspaceAccessToken();
	const baseUrl = Apps.getMarketplaceUrl();
	const workspaceIdSetting = await Settings.getValueById('Cloud_Workspace_Id');

	const currentSeats = await Users.getActiveLocalUserCount();

	const fullUrl = `${baseUrl}/v1/workspaces/${workspaceIdSetting}/apps`;
	const options = {
		headers: {
			Authorization: `Bearer ${token}`,
		},
		params: {
			seats: currentSeats,
		},
	};

	let data = [];

	try {
		const response = await fetch(fullUrl, options);

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
