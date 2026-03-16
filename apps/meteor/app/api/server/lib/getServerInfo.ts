import type { IWorkspaceInfo } from '@rocket.chat/core-typings';

import { getTrimmedServerVersion } from './getTrimmedServerVersion';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import {
	getCachedSupportedVersionsToken,
	wrapPromise,
} from '../../../cloud/server/functions/supportedVersionsToken/supportedVersionsToken';
import { settings } from '../../../settings/server';
import { Info, minimumClientVersions } from '../../../utils/rocketchat.info';

export async function getServerInfo(userId?: string): Promise<IWorkspaceInfo> {
	const hasPermissionToViewStatistics = userId && (await hasPermissionAsync(userId, 'view-statistics'));
	const supportedVersionsToken = await wrapPromise(getCachedSupportedVersionsToken());
	const cloudWorkspaceId = settings.get<string | undefined>('Cloud_Workspace_Id');

	return {
		version: getTrimmedServerVersion(),
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

		cloudWorkspaceId,
	};
}
