import { DuplicatedLicenseError } from '@rocket.chat/license';
import { Settings } from '@rocket.chat/models';

import { callbacks } from '../../../../../lib/callbacks';
import { CloudWorkspaceAccessError } from '../../../../../lib/errors/CloudWorkspaceAccessError';
import { CloudWorkspaceRegistrationError } from '../../../../../lib/errors/CloudWorkspaceRegistrationError';
import { SystemLogger } from '../../../../../server/lib/logger/system';
import { buildWorkspaceRegistrationData } from '../buildRegistrationData';
import { CloudWorkspaceAccessTokenEmptyError, getWorkspaceAccessToken } from '../getWorkspaceAccessToken';
import { retrieveRegistrationStatus } from '../retrieveRegistrationStatus';
import { fetchWorkspaceSyncPayload } from './fetchWorkspaceSyncPayload';

export async function syncCloudData() {
	try {
		const { workspaceRegistered } = await retrieveRegistrationStatus();
		if (!workspaceRegistered) {
			throw new CloudWorkspaceRegistrationError('Workspace is not registered');
		}

		const token = await getWorkspaceAccessToken(true);
		if (!token) {
			throw new CloudWorkspaceAccessTokenEmptyError();
		}

		const workspaceRegistrationData = await buildWorkspaceRegistrationData(undefined);

		const {
			license,
			removeLicense = false,
			cloudSyncAnnouncement,
		} = await fetchWorkspaceSyncPayload({
			token,
			data: workspaceRegistrationData,
		});

		await Settings.updateValueById('Cloud_Sync_Announcement_Payload', JSON.stringify(cloudSyncAnnouncement ?? null));

		if (removeLicense) {
			await callbacks.run('workspaceLicenseRemoved');
		} else {
			await callbacks.run('workspaceLicenseChanged', license);
		}

		SystemLogger.info({
			msg: 'Synced with Rocket.Chat Cloud',
			function: 'syncCloudData',
		});

		return true;
	} catch (err) {
		/**
		 * If some of CloudWorkspaceAccessError and CloudWorkspaceRegistrationError happens, makes no sense to run the legacySyncWorkspace
		 * because it will fail too.
		 * The DuplicatedLicenseError license error is also ignored because it is not a problem. the Cloud is allowed to send the same license twice.
		 */
		switch (true) {
			case err instanceof DuplicatedLicenseError:
				return;
			case err instanceof CloudWorkspaceAccessError:
			case err instanceof CloudWorkspaceRegistrationError:
			case err instanceof CloudWorkspaceAccessTokenEmptyError:
				SystemLogger.info({
					msg: 'Failed to sync with Rocket.Chat Cloud',
					function: 'syncCloudData',
					err,
				});
				break;

			default:
				SystemLogger.error({
					msg: 'Failed to sync with Rocket.Chat Cloud',
					function: 'syncCloudData',
					err,
				});
		}
		throw err;
	}
}
