import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { getCachedSupportedVersionsToken, wrapPromise } from '../../../cloud/server/functions/supportedVersionsToken';
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
		const supportedVersionsToken = await wrapPromise(getCachedSupportedVersionsToken());

		return {
			info: {
				...Info,
				...(supportedVersionsToken.success && {
					supportedVersions: supportedVersionsToken.result,
				}),
			},
		};
	}

	return {
		version: removePatchInfo(Info.version),
	};
}
