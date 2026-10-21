import type { IMessage } from '@rocket.chat/core-typings';
import { Messages } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { canAccessRoomIdAsync } from '../../lib/authorization/canAccessRoom';

export const getSingleMessage = async (userId: string, mid: IMessage['_id']): Promise<IMessage | null> => {
	const msg = await Messages.findOneById(mid);

	if (!msg?.rid) {
		return null;
	}

	if (!(await canAccessRoomIdAsync(msg.rid, userId))) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'getSingleMessage' });
	}

	return msg;
};
