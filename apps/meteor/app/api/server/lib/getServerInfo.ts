import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import {
	getCachedSupportedVersionsToken,
	wrapPromise,
} from '../../../cloud/server/functions/supportedVersionsToken/supportedVersionsToken';
import { Info, minimumClientVersions } from '../../../utils/rocketchat.info';

type ServerInfo = {
	info?: typeof Info;
	supportedVersions?: { signed: string };
	minimumClientVersions: typeof minimumClientVersions;
	version: string;
};

const removePatchInfo = (version: string): string => version.replace(/(\d+\.\d+).*/, '$1');

export async function getServerInfo(userId?: string): Promise<ServerInfo> {
	const hasPermissionToViewStatistics = userId && (await hasPermissionAsync(userId, 'view-statistics'));
	const supportedVersionsToken = await wrapPromise(getCachedSupportedVersionsToken());

	return {
		version: removePatchInfo(Info.version),

		...(hasPermissionToViewStatistics && {
			info: {
				...Info,
			},
			version: Info.version,
		}),

		minimumClientVersions,
		...(supportedVersionsToken.success &&
			supportedVersionsToken.result && {
				supportedVersions: { signed: supportedVersionsToken.result },
			}),
	};
}
