import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';
import { Settings } from '../../../app/models';

export function disconnectWorkspace() {
	const { connectToCloud } = retrieveRegistrationStatus();
	if (!connectToCloud) {
		return true;
	}

	Settings.updateValueById('Register_Server', false);

	return true;
}
