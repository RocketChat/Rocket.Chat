import { CloudWorkspaceAccessTokenError } from '../getWorkspaceAccessToken';
import { getCachedSupportedVersionsToken } from '../supportedVersionsToken/supportedVersionsToken';
import { announcementSync } from './announcementSync';
import { syncCloudData } from './syncCloudData';

export async function syncWorkspace() {
	try {
		await syncCloudData();
		await announcementSync();
	} catch (error) {
		if (error instanceof CloudWorkspaceAccessTokenError) {
			// TODO: Remove License if there is no access token
		}
	}

	await getCachedSupportedVersionsToken.reset();
}
