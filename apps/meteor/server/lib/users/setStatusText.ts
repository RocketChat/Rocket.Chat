import { api, StatusVisibility } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import type { Updater } from '@rocket.chat/models';
import { Users } from '@rocket.chat/models';
import type { ClientSession } from 'mongodb';

import { onceTransactionCommitedSuccessfully } from '../../database/utils';
import { settings } from '../../settings';

export async function setStatusText(
	user: Pick<IUser, '_id' | 'username' | 'name' | 'status' | 'roles' | 'statusText'>,
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
			void (
				settings.get<boolean>('Accounts_StatusVisibility_Enabled')
					? StatusVisibility.hasRestrictions(_id).catch(() => true)
					: Promise.resolve(false)
			).then((hasVisibilityRestrictions) =>
				api.broadcast('presence.status', {
					user: { _id, username, status, statusText, name, roles },
					previousStatus: status,
					hasVisibilityRestrictions,
				}),
			);
		}, session);
	}

	return true;
}
