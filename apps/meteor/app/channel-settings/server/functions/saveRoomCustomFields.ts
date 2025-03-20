import { Rooms, Subscriptions } from '@rocket.chat/models';
import { Match } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import type { UpdateResult } from 'mongodb';

import { notifyOnSubscriptionChangedByRoomId } from '../../../lib/server/lib/notifyListener';

export const saveRoomCustomFields = async function (rid: string, roomCustomFields: Record<string, any>): Promise<UpdateResult> {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			function: 'RocketChat.saveRoomCustomFields',
		});
	}

	if (!Match.test(roomCustomFields, Object)) {
		throw new Meteor.Error('invalid-roomCustomFields-type', 'Invalid roomCustomFields type', {
			function: 'RocketChat.saveRoomCustomFields',
		});
	}

	const ret = await Rooms.setCustomFieldsById(rid, roomCustomFields);

	// Update customFields of any user's Subscription related with this rid
	const { modifiedCount } = await Subscriptions.updateCustomFieldsByRoomId(rid, roomCustomFields);
	if (modifiedCount) {
		void notifyOnSubscriptionChangedByRoomId(rid);
	}

	return ret;
};
