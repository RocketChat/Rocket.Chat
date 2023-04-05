import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';
import { settings } from '../../../settings/server';

export async function getWorkspaceKey() {
	const { connectToCloud, workspaceRegistered } = await retrieveRegistrationStatus();

	if (!connectToCloud || !workspaceRegistered) {
		return false;
	}

	const publicKey = settings.get('Cloud_Workspace_PublicKey');

	if (!publicKey) {
		return false;
	}

	return publicKey;
}
