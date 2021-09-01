import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';


import { convertEphemeralTime } from '../functions/convertEphemeralTime';
import { Rooms, Messages, Subscriptions } from '../../../models';
import { hasPermission } from '../../../authorization/server';

Meteor.methods({
	updateEphemeralRoom(rid, newEphemeralTime, newMsgEphemeralTime) {
		check(rid, String);
		check(newEphemeralTime, String);
		check(newMsgEphemeralTime, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'updateEphemeralTime' });
		}

		const room = Rooms.findOneById(rid);

		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'updateEphemeralTime' });
		}

		const user = Meteor.user();

		if (!hasPermission(Meteor.userId(), 'edit-ephemeral-room', rid)) {
			throw new Meteor.Error('error-action-not-allowed', 'Room editing not allowed', { method: 'updateEphemeralTime' });
		}
		if (newEphemeralTime) {
			newEphemeralTime = convertEphemeralTime(newEphemeralTime);
			const updated = Rooms.setEphemeralTime(rid, newEphemeralTime);

			// If there was no msg ephemeral time then we need to set message's ephemeral time to room's ephemeral time.
			if (!room.msgEphemeralTime && !newMsgEphemeralTime) { Messages.setEphemeralTime(rid, newEphemeralTime); }
			const subscriptions = Subscriptions.setEphemeralTime(rid, newEphemeralTime);
			if (!updated || !subscriptions) {
				throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'updateEphemeralTime' });
			}
			Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('update_ephemeral_time', rid, newEphemeralTime, user);
		}

		if (newMsgEphemeralTime) {
			const msgs = Messages.findByRoomId(rid).fetch();
			Rooms.setMsgEphemeralTime(rid, newMsgEphemeralTime);
			if (newMsgEphemeralTime === 'none') {
				newMsgEphemeralTime = room.ephemeralTime;
				Messages.setEphemeralTime(rid, newMsgEphemeralTime);
			} else {
				const now = new Date();
				msgs.forEach((msg) => {
					newMsgEphemeralTime = convertEphemeralTime(newMsgEphemeralTime, msg.ts);
					if (newMsgEphemeralTime < now) {
						Messages.setEphemeralTimeById(msg._id, now);
					} else {
						Messages.setEphemeralTimeById(msg._id, newMsgEphemeralTime);
					}
				});
				Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('update_msg_ephemeral_time', rid, newMsgEphemeralTime, user);
			}
		}
		return true;
	},
});
