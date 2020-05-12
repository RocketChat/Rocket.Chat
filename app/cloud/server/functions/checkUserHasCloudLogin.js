import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';
import { Users } from '../../../models';

export function checkUserHasCloudLogin(userId) {
	const { connectToCloud, workspaceRegistered } = retrieveRegistrationStatus();

	if (!connectToCloud || !workspaceRegistered) {
		return false;
	}

	if (!userId) {
		return false;
	}

	const user = Users.findOneById(userId);

	if (user && user.services && user.services.cloud && user.services.cloud.accessToken) {
		return true;
	}

	return false;
}
