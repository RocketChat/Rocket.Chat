import { type Cloud, type Serialized } from '@rocket.chat/core-typings';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import { v, compile } from 'suretype';

import { CloudWorkspaceAccessError } from '../../../../../lib/errors/CloudWorkspaceAccessError';
import { CloudWorkspaceConnectionError } from '../../../../../lib/errors/CloudWorkspaceConnectionError';
import { CloudWorkspaceRegistrationError } from '../../../../../lib/errors/CloudWorkspaceRegistrationError';
import { SystemLogger } from '../../../../../server/lib/logger/system';
import { settings } from '../../../../settings/server';
import { buildWorkspaceRegistrationData } from '../buildRegistrationData';
import { getWorkspaceAccessToken } from '../getWorkspaceAccessToken';
import { retrieveRegistrationStatus } from '../retrieveRegistrationStatus';
import { handleAnnouncementsOnWorkspaceSync, handleNpsOnWorkspaceSync } from './handleCommsSync';
import { legacySyncWorkspace } from './legacySyncWorkspace';

const workspaceCommPayloadSchema = v.object({
	workspaceId: v.string().required(),
	publicKey: v.string(),
	nps: v.object({
		id: v.string().required(),
		startAt: v.string().format('date-time').required(),
		expireAt: v.string().format('date-time').required(),
	}),
	announcements: v.object({
		create: v.array(
			v.object({
				_id: v.string().required(),
				_updatedAt: v.string().format('date-time').required(),
				selector: v.object({
					roles: v.array(v.string()),
				}),
				platform: v.array(v.string().enum('web', 'mobile')).required(),
				expireAt: v.string().format('date-time').required(),
				startAt: v.string().format('date-time').required(),
				createdBy: v.string().enum('cloud', 'system').required(),
				createdAt: v.string().format('date-time').required(),
				dictionary: v.object({}).additional(v.object({}).additional(v.string())),
				view: v.any(),
				surface: v.string().enum('banner', 'modal').required(),
			}),
		),
		delete: v.array(v.string()),
	}),
});

const assertWorkspaceCommPayload = compile(workspaceCommPayloadSchema);

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

	assertWorkspaceCommPayload(payload);
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
			throw new CloudWorkspaceAccessError('Workspace does not have a valid access token');
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
		SystemLogger.error({
			msg: 'Failed to sync with Rocket.Chat Cloud',
			url: '/sync',
			err,
		});
	}

	await legacySyncWorkspace();
}
