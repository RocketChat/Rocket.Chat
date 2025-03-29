import type { Cloud, Serialized } from '@rocket.chat/core-typings';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import { z } from 'zod';

import { CloudWorkspaceConnectionError } from '../../../../../lib/errors/CloudWorkspaceConnectionError';
import { SystemLogger } from '../../../../../server/lib/logger/system';
import { settings } from '../../../../settings/server';

const workspaceSyncPayloadSchema = z.object({
	workspaceId: z.string(),
	publicKey: z.string().optional(),
	license: z.string(),
});

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
		const { error } = await response.json();
		throw new CloudWorkspaceConnectionError(`Failed to connect to Rocket.Chat Cloud: ${error}`);
	}

	const payload = await response.json();

	const assertWorkspaceSyncPayload = workspaceSyncPayloadSchema.safeParse(payload);

	if (!assertWorkspaceSyncPayload.success) {
		SystemLogger.error({ msg: 'workspaceCommPayloadSchema failed type validation', errors: assertWorkspaceSyncPayload.error.errors });
	}

	return payload;
}
