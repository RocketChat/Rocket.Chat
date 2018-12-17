import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { RocketChat } from 'meteor/rocketchat:lib';
import LivechatVisitors from '../models/LivechatVisitors';

Meteor.methods({
	'livechat:startFileUploadRoom'(roomId, token) {
		const guest = LivechatVisitors.getVisitorByToken(token);

		const message = {
			_id: Random.id(),
			rid: roomId || Random.id(),
			msg: '',
			ts: new Date(),
			token: guest.token,
		};

		return RocketChat.Livechat.getRoom(guest, message);
	},
});
