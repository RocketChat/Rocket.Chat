import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';
import { settings } from '../../../settings';

export function getWorkspaceKey() {
	const { connectToCloud, workspaceRegistered } = retrieveRegistrationStatus();

	if (!connectToCloud || !workspaceRegistered) {
		return false;
	}

	const publicKey = settings.get('Cloud_Workspace_PublicKey');

	if (!publicKey) {
		return false;
	}

	return publicKey;
}
