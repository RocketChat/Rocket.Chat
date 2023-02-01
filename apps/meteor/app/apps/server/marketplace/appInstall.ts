import type { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';

import { getWorkspaceAccessToken } from '../../../cloud/server';
import { settings } from '../../../settings/server';
import { Info } from '../../../utils/server';

export type installAction = 'install' | 'update' | 'uninstall';

export async function notifyAppInstall(marketplaceBaseUrl: string, action: installAction, appInfo: IAppInfo): Promise<void> {
	let headers = {
		Authorization: '',
	};

	try {
		const token = await getWorkspaceAccessToken();
		headers = {
			Authorization: `Bearer ${token}`,
		};
	} catch {}

	let siteUrl = '';
	try {
		siteUrl = settings.get<string>('Site_Url');
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

	const pendingSentUrl = `${marketplaceBaseUrl}/v1/apps/${appInfo.id}/install`;

	try {
		HTTP.post(pendingSentUrl, {
			headers,
			data,
		});
	} catch {}
}
