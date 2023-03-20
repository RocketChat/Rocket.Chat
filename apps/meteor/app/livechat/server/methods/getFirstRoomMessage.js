import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { LivechatRooms } from '@rocket.chat/models';

import { Messages } from '../../../models/server';
import { hasPermission } from '../../../authorization/server';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

Meteor.methods({
	async 'livechat:getFirstRoomMessage'({ rid }) {
		methodDeprecationLogger.warn('livechat:getFirstRoomMessage will be deprecated in future versions of Rocket.Chat');
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'view-l-room')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:getFirstRoomMessage',
			});
		}

		check(rid, String);

		const room = await LivechatRooms.findOneById(rid);

		if (!room || room.t !== 'l') {
			throw new Meteor.Error('error-invalid-room', 'Invalid room');
		}

		return Messages.findOne({ rid }, { sort: { ts: 1 } });
	},
});
