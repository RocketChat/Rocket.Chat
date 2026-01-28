import { api } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import type { Updater } from '@rocket.chat/models';
import { Users } from '@rocket.chat/models';
import type { ClientSession } from 'mongodb';

import { onceTransactionCommitedSuccessfully } from '../../../../server/database/utils';

export async function setStatusText(
	userId: string,
	statusText: string,
	{
		updater,
		session,
		emit = true,
	}: {
		updater?: Updater<IUser>;
		session?: ClientSession;
		emit?: boolean;
	} = {},
): Promise<boolean> {
	if (!userId) {
		return false;
	}

	statusText = statusText.trim().substr(0, 120);

	const user = await Users.findOneById<Pick<IUser, '_id' | 'username' | 'name' | 'status' | 'roles' | 'statusText'>>(userId, {
		projection: { username: 1, name: 1, status: 1, roles: 1, statusText: 1 },
		session,
	});

	if (!user) {
		return false;
	}

	if (user.statusText === statusText) {
		return true;
	}

	if (updater) {
		updater.set('statusText', statusText);
	} else {
		await Users.updateStatusText(user._id, statusText, { session });
	}

	if (emit) {
		const { _id, username, status, name, roles } = user;
		await onceTransactionCommitedSuccessfully(() => {
			void api.broadcast('presence.status', {
				user: { _id, username, status, statusText, name, roles },
				previousStatus: status,
			});
		}, session);
	}

	return true;
}
