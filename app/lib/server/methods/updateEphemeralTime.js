import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';


import { convertEphemeralTime } from '../functions/convertEphemeralTime';
import { Rooms, Messages, Subscriptions } from '../../../models';

Meteor.methods({
	updateEphemeralRoom(rid, newEphemeralTime, newMsgEphemeralTime) {
		check(rid, String);
		const room = Rooms.findOneById(rid);
		const user = Meteor.user();
		if (newEphemeralTime) {
			newEphemeralTime = convertEphemeralTime(newEphemeralTime);
			const updated = Rooms.setEphemeralTime(rid, newEphemeralTime);
			const messages = Messages.setEphemeralTime(rid, newEphemeralTime);
			const subscriptions = Subscriptions.setEphemeralTime(rid, newEphemeralTime);
			if (updated && messages && subscriptions) {
				Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('update_ephemeral_time', rid, newEphemeralTime, user);
			}
		}
		if (newMsgEphemeralTime) {
			const msgs = Messages.findByRoomId(rid).fetch();
			const rooms = Rooms.setMsgEphemeralTime(rid, newMsgEphemeralTime);
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
			}
		}
		return true;
	},
});
