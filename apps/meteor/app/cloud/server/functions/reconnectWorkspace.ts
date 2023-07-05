import { Settings } from '@rocket.chat/models';
import { config } from '@rocket.chat/config';

import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';
import { syncWorkspace } from './syncWorkspace';

export async function reconnectWorkspace() {
	const { workspaceRegistered } = await retrieveRegistrationStatus();
	if (!workspaceRegistered || config.TEST_MODE) {
		return false;
	}

	await Settings.updateValueById('Register_Server', true);

	await syncWorkspace(true);

	return true;
}
