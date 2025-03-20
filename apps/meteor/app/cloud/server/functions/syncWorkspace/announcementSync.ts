import { type Cloud, type Serialized } from '@rocket.chat/core-typings';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import { z } from 'zod';

import { CloudWorkspaceConnectionError } from '../../../../../lib/errors/CloudWorkspaceConnectionError';
import { CloudWorkspaceRegistrationError } from '../../../../../lib/errors/CloudWorkspaceRegistrationError';
import { SystemLogger } from '../../../../../server/lib/logger/system';
import { settings } from '../../../../settings/server';
import { buildWorkspaceRegistrationData } from '../buildRegistrationData';
import { CloudWorkspaceAccessTokenEmptyError, getWorkspaceAccessToken } from '../getWorkspaceAccessToken';
import { retrieveRegistrationStatus } from '../retrieveRegistrationStatus';
import { handleAnnouncementsOnWorkspaceSync, handleNpsOnWorkspaceSync } from './handleCommsSync';

const workspaceCommPayloadSchema = z.object({
	workspaceId: z.string().optional(),
	publicKey: z.string().optional(),
	nps: z
		.object({
			id: z.string(),
			startAt: z.string().datetime(),
			expireAt: z.string().datetime(),
		})
		.optional(),
	announcements: z.object({
		create: z.array(
			z.object({
				_id: z.string(),
				_updatedAt: z.string().datetime().optional(),
				selector: z.object({
					roles: z.array(z.string()),
				}),
				platform: z.array(z.enum(['web', 'mobile'])),
				expireAt: z.string().datetime(),
				startAt: z.string().datetime(),
				createdBy: z.enum(['cloud', 'system']),
				createdAt: z.string().datetime(),
				dictionary: z.record(z.record(z.string())).optional(),
				view: z.unknown(),
				surface: z.enum(['banner', 'modal']),
			}),
		),
		delete: z.array(z.string()).optional(),
	}),
});

const fetchCloudAnnouncementsSync = async ({
	token,
	data,
}: {
	token: string;
	data: Cloud.WorkspaceSyncRequestPayload;
}): Promise<Serialized<Cloud.WorkspaceCommsResponsePayload>> => {
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

	const assertWorkspaceCommPayload = workspaceCommPayloadSchema.safeParse(payload);

	if (!assertWorkspaceCommPayload.success) {
		SystemLogger.error({ msg: 'workspaceCommPayloadSchema failed type validation', errors: assertWorkspaceCommPayload.error.errors });
	}

	return payload;
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
