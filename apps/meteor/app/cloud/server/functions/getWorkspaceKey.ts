import { Settings } from '@rocket.chat/models';

import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';

export async function getWorkspaceKey() {
	const { workspaceRegistered } = await retrieveRegistrationStatus();

	if (!workspaceRegistered) {
		return false;
	}

	const publicKey = await Settings.getValueById('Cloud_Workspace_PublicKey');

	if (!publicKey) {
		return false;
	}

	return publicKey;
}
