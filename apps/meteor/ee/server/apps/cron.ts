import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import type { ProxiedApp } from '@rocket.chat/apps-engine/server/ProxiedApp';
import { cronJobs } from '@rocket.chat/cron';
import { Settings, Users } from '@rocket.chat/models';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';

import { Apps } from './orchestrator';
import { getWorkspaceAccessToken } from '../../../app/cloud/server';
import { i18n } from '../../../server/lib/i18n';
import { sendMessagesToAdmins } from '../../../server/lib/sendMessagesToAdmins';

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
	const link = '/marketplace/installed';

	await sendMessagesToAdmins({
		msgs: async ({ adminUser }) => ({
			msg: `*${i18n.t(title, { lng: adminUser.language || 'en' })}*\n${i18n.t('Invalid_apps_admin_message', {
				lng: adminUser.language || 'en',
				marketplace: i18n.t('Marketplace', { lng: adminUser.language || 'en' }),
				installed: i18n.t('Installed', { lng: adminUser.language || 'en' }),
			})}`,
		}),
		banners: async ({ adminUser }) => {
			await Users.removeBannerById(adminUser._id, id);

			return [
				{
					id,
					priority: 10,
					title,
					text: i18n.t('Invalid_apps_banner_text', { lng: adminUser.language || 'en' }),
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
		async (app) => (await app.getStatus()) === AppStatus.DISABLED && app.getPreviousStatus() === AppStatus.INVALID_LICENSE_DISABLED,
	);

	if (renewedApps.length === 0) {
		return;
	}

	await sendMessagesToAdmins({
		msgs: async ({ adminUser }) => ({
			msg: i18n.t('Disabled_apps_admin_message', {
				lng: adminUser.language || 'en',
				marketplace: i18n.t('Marketplace', { lng: adminUser.language || 'en' }),
				installed: i18n.t('Installed', { lng: adminUser.language || 'en' }),
			}),
		}),
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
