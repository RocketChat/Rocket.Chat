import type { Cloud, Serialized } from '@rocket.chat/core-typings';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import { v, compile } from 'suretype';

import { CloudWorkspaceConnectionError } from '../../../../../lib/errors/CloudWorkspaceConnectionError';
import { settings } from '../../../../settings/server';

const workspaceSyncPayloadSchema = v.object({
	workspaceId: v.string().required(),
	publicKey: v.string(),
	license: v.string().required(),
});

const assertWorkspaceSyncPayload = compile(workspaceSyncPayloadSchema);

export async function fetchWorkspaceSyncPayload({
	token,
	data,
}: {
	token: string;
	data: Cloud.WorkspaceSyncRequestPayload;
}): Promise<Serialized<Cloud.WorkspaceSyncResponse>> {
	const workspaceRegistrationClientUri = settings.get<string>('Cloud_Workspace_Registration_Client_Uri');
	const response = await fetch(`${workspaceRegistrationClientUri}/sync`, {
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

	assertWorkspaceSyncPayload(payload);

	const cloudSyncAnnouncement = {
		viewId: 'subscription-announcement',
		appId: 'cloud-announcements-core',
		blocks: [
			{
				type: 'callout',
				title: {
					type: 'plain_text',
					text: 'Workspace eligible for Starter Plan',
				},
				text: {
					type: 'plain_text',
					text: 'Get free access to premium capabilities for up to 50 users',
				},
				accessory: {
					type: 'button',
					text: {
						type: 'plain_text',
						text: 'Switch Plan',
					},
					actionId: 'callout-action',
					appId: 'cloud-announcements-core',
					blockId: 'section-button',
				},
			},
		],
	};

	return { ...payload, cloudSyncAnnouncement };
}
