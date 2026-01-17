import { Cloud } from '@rocket.chat/core-typings';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import * as z from 'zod';

import { CloudWorkspaceConnectionError } from '../../../../../lib/errors/CloudWorkspaceConnectionError';
import { CloudWorkspaceRegistrationError } from '../../../../../lib/errors/CloudWorkspaceRegistrationError';
import { SystemLogger } from '../../../../../server/lib/logger/system';
import { settings } from '../../../../settings/server';
import { buildWorkspaceRegistrationData } from '../buildRegistrationData';
import { CloudWorkspaceAccessTokenEmptyError, getWorkspaceAccessToken } from '../getWorkspaceAccessToken';
import { retrieveRegistrationStatus } from '../retrieveRegistrationStatus';
import { handleAnnouncementsOnWorkspaceSync, handleNpsOnWorkspaceSync } from './handleCommsSync';

const fetchCloudAnnouncementsSync = async ({
	token,
	data,
}: {
	token: string;
	data: Cloud.WorkspaceSyncRequestPayload;
}): Promise<Cloud.WorkspaceCommsResponsePayload> => {
	const cloudUrl = settings.get<string>('Cloud_Url');
	const response = await fetch(`${cloudUrl}/api/v3/comms/workspace`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
		},
		body: data,
	});

	if (!response.ok) {
		try {
			const { error } = await response.json();
			throw new CloudWorkspaceConnectionError(`Failed to connect to Rocket.Chat Cloud: ${error}`);
		} catch (error) {
			throw new CloudWorkspaceConnectionError(`Failed to connect to Rocket.Chat Cloud: ${response.statusText}`);
		}
	}

	const payload = await response.json();

	const result = Cloud.WorkspaceCommsResponsePayloadSchema.safeParse(payload);

	if (!result.success) {
		throw new CloudWorkspaceConnectionError('failed type validation', {
			cause: z.prettifyError(result.error),
		});
	}

	return result.data;
};

export async function announcementSync() {
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

		const { nps, announcements } = await fetchCloudAnnouncementsSync({
			token,
			data: workspaceRegistrationData,
		});

		if (nps) {
			await handleNpsOnWorkspaceSync(nps);
		}

		if (announcements) {
			await handleAnnouncementsOnWorkspaceSync(announcements);
		}

		return true;
	} catch (err) {
		switch (true) {
			case err instanceof CloudWorkspaceConnectionError:
			case err instanceof CloudWorkspaceRegistrationError:
			case err instanceof CloudWorkspaceAccessTokenEmptyError: {
				SystemLogger.info({
					msg: 'Failed to sync with Rocket.Chat Cloud',
					function: 'announcementSync',
					err,
				});
				break;
			}
			default: {
				SystemLogger.error({
					msg: 'Error during workspace sync',
					function: 'announcementSync',
					err,
				});
			}
		}
		throw err;
	}
}
