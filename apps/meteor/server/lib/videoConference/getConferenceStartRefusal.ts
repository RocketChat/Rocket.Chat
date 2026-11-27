import type { IRoom, IUser } from '@rocket.chat/core-typings';

import { canSendMessageAsync } from '../authorization/canSendMessage';
import { hasPermissionAsync } from '../authorization/hasPermission';

/**
 * Why the user may not start a conference in the room, or `undefined` when they may: they manage its calls and
 * may post the call message there.
 */
export const getConferenceStartRefusal = async (
	user: Pick<IUser, '_id' | 'username' | 'type' | 'roles'>,
	rid: IRoom['_id'],
): Promise<string | undefined> => {
	if (!(await hasPermissionAsync(user, 'call-management', rid))) {
		return 'User does not have the permissions required for this action';
	}

	try {
		await canSendMessageAsync(rid, { uid: user._id, username: user.username, type: user.type ?? 'user' });
	} catch {
		return 'User cannot send messages in this room';
	}

	return undefined;
};
