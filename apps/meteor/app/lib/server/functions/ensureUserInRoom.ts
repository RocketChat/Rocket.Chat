import type { IUser } from '@rocket.chat/core-typings';
import { Subscriptions } from '@rocket.chat/models';

import { addUserToRoom } from './addUserToRoom';

export const ensureUserInRoom = async (
    rid: string,
    user: Pick<IUser, "_id" | "username">,
    inviter?: Pick<IUser, "_id" | "username">,
): Promise<'existing' | 'added'> => {
	const subscription = await Subscriptions.findOneByRoomIdAndUserId(rid, user._id, { projection: { _id: 1 } });

	if (subscription) {
		return 'existing';
	}

	await addUserToRoom(rid, user, inviter, { skipSystemMessage: true, skipAlertSound: true });
	return 'added';
};
