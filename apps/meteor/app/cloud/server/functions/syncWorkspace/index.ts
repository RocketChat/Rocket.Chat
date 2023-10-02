import { CloudWorkspaceAccessTokenError } from '../getWorkspaceAccessToken';
import { getWorkspaceLicense } from '../getWorkspaceLicense';
import { getCachedSupportedVersionsToken } from '../supportedVersionsToken/supportedVersionsToken';
import { syncCloudData } from './syncCloudData';

export async function syncWorkspace() {
	try {
		await syncCloudData();
		await getWorkspaceLicense();
	} catch (error) {
		if (error instanceof CloudWorkspaceAccessTokenError) {
			// TODO: Remove License if there is no access token
		}
	}

	await getCachedSupportedVersionsToken.reset();
}
