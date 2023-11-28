import { CloudWorkspaceRegistrationError } from '../../../../../lib/errors/CloudWorkspaceRegistrationError';
import { SystemLogger } from '../../../../../server/lib/logger/system';
import { CloudWorkspaceAccessTokenError } from '../getWorkspaceAccessToken';
import { getCachedSupportedVersionsToken } from '../supportedVersionsToken/supportedVersionsToken';
import { announcementSync } from './announcementSync';
import { legacySyncWorkspace } from './legacySyncWorkspace';
import { syncCloudData } from './syncCloudData';

/**
 * Syncs the workspace with the cloud
 * @returns {Promise<void>}
 * @throws {Error} - If there is an unexpected error during sync like a network error
 */
export async function syncWorkspace() {
	try {
		await syncCloudData();
		await announcementSync();
		await getCachedSupportedVersionsToken.reset();
	} catch (err) {
		switch (true) {
			case err instanceof CloudWorkspaceRegistrationError:
			case err instanceof CloudWorkspaceAccessTokenError: {
				// There is no access token, so we can't sync
				SystemLogger.info('Workspace does not have a valid access token, sync aborted');
				break;
			}
			default: {
				SystemLogger.error({ msg: 'Error during workspace sync', err });
				SystemLogger.info({
					msg: 'Falling back to legacy sync',
					function: 'syncCloudData',
				});
				try {
					await legacySyncWorkspace();
					await getCachedSupportedVersionsToken.reset();
				} catch (err) {
					switch (true) {
						case err instanceof CloudWorkspaceRegistrationError:
						case err instanceof CloudWorkspaceAccessTokenError: {
							// There is no access token, so we can't sync
							break;
						}
						default: {
							SystemLogger.error({ msg: 'Error during fallback workspace sync', err });
							throw err;
						}
					}
				}
			}
		}
	}
}
