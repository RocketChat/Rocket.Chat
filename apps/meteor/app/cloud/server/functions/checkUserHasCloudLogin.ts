import { Users } from '@rocket.chat/models';

import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';

export async function checkUserHasCloudLogin(userId: string) {
	const { workspaceRegistered } = await retrieveRegistrationStatus();

	if (!workspaceRegistered) {
		return false;
	}

	if (!userId) {
		return false;
	}

	const user = await Users.findOneById(userId);

	if (user?.services?.cloud?.accessToken) {
		return true;
	}

	return false;
}
