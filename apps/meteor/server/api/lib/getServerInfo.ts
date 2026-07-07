import type { IWorkspaceInfo } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';

import { getTrimmedServerVersion } from './getTrimmedServerVersion';
import { settings } from '../../../app/settings/server';
import { Info, minimumClientVersions } from '../../../app/utils/rocketchat.info';
import { hasPermissionAsync } from '../../lib/authorization/hasPermission';
import { getCachedSupportedVersionsToken, wrapPromise } from '../../lib/cloud/supportedVersionsToken/supportedVersionsToken';

export async function getServerInfo(userId?: string): Promise<IWorkspaceInfo> {
	const hasPermissionToViewStatistics = userId && (await hasPermissionAsync(userId, 'view-statistics'));
	const supportedVersionsToken = await wrapPromise(getCachedSupportedVersionsToken());
	const cloudWorkspaceId = settings.get<string | undefined>('Cloud_Workspace_Id');

	return {
		workspaceUrl: License.getWorkspaceUrl(),
		hashedWorkspaceUrl: License.getHashedWorkspaceUrl(),
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
