import type { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';

import { getWorkspaceAccessToken } from '../../../../app/cloud/server';
import { settings } from '../../../../app/settings/server';
import { Info } from '../../../../app/utils/rocketchat.info';
import { Apps } from '../orchestrator';

type MarketplaceNotificationType = 'install' | 'update' | 'uninstall';

/**
 * Notify the marketplace about an app install, update, or uninstall event.
 *
 * Attempts to POST a notification to the marketplace client at `v1/apps/{id}/install` containing the action, app metadata, Rocket.Chat and engine versions, and site URL. If a workspace access token is available it is included in the Authorization header. Any errors encountered while obtaining the token, reading settings, or sending the request are ignored.
 *
 * @param action - The marketplace event type: 'install', 'update', or 'uninstall'
 * @param appInfo - App metadata (including `id`, `name`, `nameSlug`, and `version`) to include in the notification
 */
export async function notifyMarketplace(action: MarketplaceNotificationType, appInfo: IAppInfo): Promise<void> {
	const headers: { Authorization?: string } = {};

	try {
		const token = await getWorkspaceAccessToken();
		headers.Authorization = `Bearer ${token}`;

		// eslint-disable-next-line no-empty
	} catch {}

	let siteUrl = '';
	try {
		siteUrl = settings.get<string>('Site_Url');

		// eslint-disable-next-line no-empty
	} catch {}

	const data = {
		action,
		appName: appInfo.name,
		appSlug: appInfo.nameSlug,
		appVersion: appInfo.version,
		rocketChatVersion: Info.version,
		engineVersion: Info.marketplaceApiVersion,
		siteUrl,
	};

	const pendingSentUrl = `v1/apps/${appInfo.id}/install`;

	try {
		await Apps.getMarketplaceClient().fetch(pendingSentUrl, {
			method: 'POST',
			headers,
			body: data,
		});

		// eslint-disable-next-line no-empty
	} catch {}
}
