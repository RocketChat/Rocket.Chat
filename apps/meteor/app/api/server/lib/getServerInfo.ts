import { serverFetch as fetch } from '@rocket.chat/server-fetch';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { getWorkspaceAccessToken } from '../../../cloud/server';
import { Info } from '../../../utils/rocketchat.info';

type ServerInfo =
	| {
			info: typeof Info;
	  }
	| {
			version: string | undefined;
	  };

const removePatchInfo = (version: string): string => version.replace(/(\d+\.\d+).*/, '$1');

export async function getServerInfo(userId?: string): Promise<ServerInfo> {
	if (userId && (await hasPermissionAsync(userId, 'get-server-info'))) {
		const token = await getWorkspaceAccessToken();
		const headers = {
			...(token && { Authorization: `Bearer ${token}` }),
		};
		try {
			const response = await fetch('https://releases.rocket.chat/supported/server', {
				headers,
			});
			const data = await response.json();
			const { signed: supportedVersions } = data;

			return {
				info: {
					...Info,
					supportedVersions,
				},
			};
		} catch (e) {
			return {
				info: Info,
			};
		}
	}
	return {
		version: removePatchInfo(Info.version),
	};
}
