import { SyncedCron } from 'meteor/littledata:synced-cron';
import { Apps, AppsManager } from '@rocket.chat/core-services';

import { settings } from '../../../app/settings/server';
import { getWorkspaceAccessToken } from '../../../app/cloud/server';
import { appRequestNotififyForUsers } from './marketplace/appRequestNotifyUsers';
import { fetch } from '../../../server/lib/http/fetch';

const appsNotifyAppRequests = async function _appsNotifyAppRequests() {
	try {
		const installedApps = await AppsManager.get({ enabled: true });
		if (!installedApps || installedApps.length === 0) {
			return;
		}

		const workspaceUrl = settings.get<string>('Site_Url');
		const token = await getWorkspaceAccessToken();

		if (!token) {
			Apps.rocketChatLoggerDebug(`could not load workspace token to send app requests notifications`);
			return;
		}

		const baseUrl = await Apps.getMarketplaceUrl();
		if (!baseUrl) {
			Apps.rocketChatLoggerDebug(`could not load marketplace base url to send app requests notifications`);
			return;
		}

		const options = {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		};

		const pendingSentUrl = `${baseUrl}/v1/app-request/sent/pending`;
		const result = await fetch(pendingSentUrl, options);
		const data = (await result.json()).data?.data;
		const filtered = installedApps.filter((app) => data.indexOf(app?.getID()) !== -1);

		for await (const app of filtered) {
			if (!app) continue;

			const appId = app.getID();
			const appName = app.getName();

			const usersNotified = await appRequestNotififyForUsers(baseUrl, workspaceUrl, appId, appName)
				.then(async (response) => {
					// Mark all app requests as sent
					await fetch(`${baseUrl}/v1/app-request/markAsSent/${appId}`, { ...options, method: 'POST' });
					return response;
				})
				.catch((err) => {
					Apps.rocketChatLoggerDebug(`could not send app request notifications for app ${appId}. Error: ${err}`);
					return err;
				});

			const errors = (usersNotified as (string | Error)[]).filter((batch) => batch instanceof Error);
			if (errors.length > 0) {
				Apps.rocketChatLoggerDebug(`Some batches of users could not be notified for app ${appId}. Errors: ${errors}`);
			}
		}
	} catch (err) {
		Apps.rocketChatLoggerDebug(err);
	}
};

// Scheduling as every 12 hours to avoid multiple instances hiting the marketplace at the same time
SyncedCron.add({
	name: 'Apps-Request-End-Users:notify',
	schedule: (parser) => parser.text('every 12 hours'),
	async job() {
		await appsNotifyAppRequests();
	},
});
