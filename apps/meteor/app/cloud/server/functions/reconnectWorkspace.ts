import { Settings } from '@rocket.chat/models';

import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';
import { syncWorkspace } from './syncWorkspace';

export async function reconnectWorkspace() {
	const { workspaceRegistered } = await retrieveRegistrationStatus();
	if (!workspaceRegistered || process.env.TEST_MODE) {
		return false;
	}

	await Settings.updateValueById('Register_Server', true);

	await syncWorkspace();

	return true;
}
