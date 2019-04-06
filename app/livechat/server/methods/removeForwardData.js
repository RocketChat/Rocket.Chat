import { Meteor } from 'meteor/meteor';
import { Livechat } from '../lib/Livechat';
import { Rooms } from '../../../models';

Meteor.methods({
	'livechat:removeForwardData'(data, immediately) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:removeForwardData' });
		}

		if (immediately) {
			// Update Livechat status
			Livechat.removeForwardData(data);
			return;
		}

		const room = Rooms.findOneById(data.roomId);
		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'livechat:removeForwardData' });
		}

		Meteor.setTimeout(() => {
			if (room.transferData) {
				// Update Livechat status
				Livechat.removeForwardData(data);
			}
		}, data.expirationAt);
	},
});
