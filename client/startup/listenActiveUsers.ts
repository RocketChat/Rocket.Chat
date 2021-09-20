import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import { Notifications } from '../../app/notifications/client';
import { IUser } from '../../definition/IUser';
import { UserStatus } from '../../definition/UserStatus';
import { Presence } from '../lib/presence';

const STATUS_MAP = [UserStatus.OFFLINE, UserStatus.ONLINE, UserStatus.AWAY, UserStatus.BUSY];

export const interestedUserIds = new Set<IUser['_id']>();

export const saveUser = (
	user: Pick<IUser, '_id' | 'username' | 'status' | 'statusText' | 'avatarETag'>,
	force = false,
): void => {
	// do not update my own user, my user's status will come from a subscription
	if (user._id === (Accounts as any).connection?._userId) {
		return;
	}

	const found = (Meteor.users as any)._collection._docs._map[user._id];

	if (found && force) {
		Meteor.users.update(
			{ _id: user._id },
			{
				$set: {
					...(user.username && { username: user.username }),
					// name: user.name,
					// utcOffset: user.utcOffset,
					status: user.status,
					statusText: user.statusText,
					...(user.avatarETag && { avatarETag: user.avatarETag }),
				},
			},
		);

		return;
	}

	if (!found) {
		Meteor.users.insert(user);
	}
};

Meteor.startup(() => {
	Notifications.onLogged(
		'roles-change',
		(role: { _id: string; scope: string; u: IUser; type: 'added' | 'removed' | 'changed' }) => {
			if (role.scope) {
				return;
			}

			const user = Presence.store.get(role.u._id);

			if (!user) {
				return;
			}

			switch (role.type) {
				// case 'changed':
				// 	break;
				case 'added':
					Presence.notify({
						...user,
						roles: [...new Set([...user.roles, role._id])],
					});
					break;
				case 'removed':
					Presence.notify({
						...user,
						roles: user.roles.filter((r) => r !== role._id),
					});
					break;
			}
		},
	);

	Notifications.onLogged(
		'user-status',
		async ([_id, username, status, statusText]: [
			IUser['_id'],
			IUser['username'],
			number,
			IUser['statusText'],
		]) => {
			Presence.notify({
				_id,
				username,
				status: STATUS_MAP[status],
				statusText,
				roles: Presence.store.get(_id)?.roles || [],
			});

			if (!interestedUserIds.has(_id)) {
				return;
			}

			saveUser({ _id, username, status: STATUS_MAP[status], statusText }, true);
		},
	);
});
