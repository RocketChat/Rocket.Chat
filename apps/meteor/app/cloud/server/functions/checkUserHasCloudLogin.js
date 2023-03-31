import { Users } from '@rocket.chat/models';

import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';

export async function checkUserHasCloudLogin(userId) {
	const { connectToCloud, workspaceRegistered } = retrieveRegistrationStatus();

	if (!connectToCloud || !workspaceRegistered) {
		return false;
	}

	if (!userId) {
		return false;
	}

	const user = await Users.findOneById(userId);

	if (user && user.services && user.services.cloud && user.services.cloud.accessToken) {
		return true;
	}

	return false;
}
