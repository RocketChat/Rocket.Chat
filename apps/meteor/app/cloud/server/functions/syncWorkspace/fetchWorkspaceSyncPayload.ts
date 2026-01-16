import { Cloud } from '@rocket.chat/core-typings';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import * as z from 'zod';

import { CloudWorkspaceConnectionError } from '../../../../../lib/errors/CloudWorkspaceConnectionError';
import { settings } from '../../../../settings/server';

export async function fetchWorkspaceSyncPayload({
	token,
	data,
}: {
	token: string;
	data: Cloud.WorkspaceSyncRequestPayload;
}): Promise<Cloud.WorkspaceSyncResponse> {
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

	const assertWorkspaceSyncPayload = Cloud.WorkspaceSyncResponseSchema.safeParse(payload);

	if (!assertWorkspaceSyncPayload.success) {
		throw new CloudWorkspaceConnectionError('WorkspaceSyncPayloadSchema failed type validation', {
			cause: z.prettifyError(assertWorkspaceSyncPayload.error),
		});
	}

	return assertWorkspaceSyncPayload.data;
}
