import { Users } from '@rocket.chat/models';
import type { IUser } from '@rocket.chat/core-typings';

import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';

export async function checkUserHasCloudLogin(userId: string) {
	const { connectToCloud, workspaceRegistered } = retrieveRegistrationStatus();

	if (!connectToCloud || !workspaceRegistered) {
		return false;
	}

	const user = await Users.findOneById<Pick<IUser, 'services'>>(userId, { projection: { 'services.cloud': 1 } });
	if (user?.services?.cloud?.accessToken) {
		return true;
	}

	return false;
}
