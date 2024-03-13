import { WorkspaceCredentials } from '@rocket.chat/models';

import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';

export async function getWorkspaceKey() {
	const { workspaceRegistered } = await retrieveRegistrationStatus();

	if (!workspaceRegistered) {
		return false;
	}

	const publicKey = await WorkspaceCredentials.getCredentialById('workspace_public_key');

	if (!publicKey) {
		return false;
	}

	return publicKey.value;
}
