import { Settings } from '@rocket.chat/models';

import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';
import { syncWorkspace } from './syncWorkspace';

export async function disconnectWorkspace() {
	const { connectToCloud } = await retrieveRegistrationStatus();
	if (!connectToCloud) {
		return true;
	}

	await Settings.updateValueById('Register_Server', false);

	await syncWorkspace(true);

	return true;
}
