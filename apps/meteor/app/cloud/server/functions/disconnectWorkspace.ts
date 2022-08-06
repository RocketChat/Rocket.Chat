import { Settings } from '@rocket.chat/models';

import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';

export async function disconnectWorkspace() {
	const { connectToCloud } = retrieveRegistrationStatus();
	if (!connectToCloud) {
		return true;
	}

	await Settings.updateValueById('Register_Server', false);

	return true;
}
