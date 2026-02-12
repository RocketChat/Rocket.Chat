import { cronJobs } from '@rocket.chat/cron';
import type { ExtendedFetchOptions } from '@rocket.chat/server-fetch';

import { appRequestNotififyForUsers } from './marketplace/appRequestNotifyUsers';
import { Apps } from './orchestrator';
import { getWorkspaceAccessToken } from '../../../app/cloud/server';
import { settings } from '../../../app/settings/server';

const appsNotifyAppRequests = async function _appsNotifyAppRequests() {
	try {
		const installedApps = await Apps.installedApps({ enabled: true });
		if (!installedApps || installedApps.length === 0) {
			return;
		}

		const workspaceUrl = settings.get<string>('Site_Url');
		const token = await getWorkspaceAccessToken();

		if (!token) {
			Apps.debugLog(`could not load workspace token to send app requests notifications`);
			return;
		}

		const options = {
			headers: {
				Authorization: `Bearer ${token}`,
			},
			// SECURITY: the URL is a default hardcoded value or an envvar/setting set by an admin. It's safe to disable this check.
			ignoreSsrfValidation: true,
		} as ExtendedFetchOptions;

		const pendingSentUrl = `v1/app-request/sent/pending`;
		const result = await Apps.getMarketplaceClient().fetch(pendingSentUrl, options);
		const { data } = await result.json();
		const filtered = installedApps.filter((app) => data.indexOf(app.getID()) !== -1);

		for await (const app of filtered) {
			const appId = app.getID();
			const appName = app.getName();

			const usersNotified = await appRequestNotififyForUsers(Apps.getMarketplaceClient().getMarketplaceUrl(), workspaceUrl, appId, appName)
				.then(async (response) => {
					// Mark all app requests as sent
					// SECURITY: the URL is a default hardcoded value or an envvar/setting set by an admin. It's safe to disable this check.
					await Apps.getMarketplaceClient().fetch(`v1/app-request/markAsSent/${appId}`, { ...options, method: 'POST' });
					return response;
				})
				.catch((err) => {
					Apps.debugLog(`could not send app request notifications for app ${appId}. Error: ${err}`);
					return err;
				});

			const errors = (usersNotified as (string | Error)[]).filter((batch) => batch instanceof Error);
			if (errors.length > 0) {
				Apps.debugLog(`Some batches of users could not be notified for app ${appId}. Errors: ${errors}`);
			}
		}
	} catch (err) {
		Apps.debugLog(err);
	}
};

await cronJobs.add('Apps-Request-End-Users:notify', '0 */12 * * *', async () => appsNotifyAppRequests());
