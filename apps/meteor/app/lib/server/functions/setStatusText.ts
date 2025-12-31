import { api } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import type { Updater } from '@rocket.chat/models';
import { Users } from '@rocket.chat/models';
import type { ClientSession } from 'mongodb';

import { onceTransactionCommitedSuccessfully } from '../../../../server/database/utils';

export async function setStatusText(
	user: IUser,
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
	statusText = statusText.trim().substr(0, 120);

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
