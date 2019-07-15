import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

import { LivechatVisitors } from '../../../models';
import { Livechat } from '../lib/Livechat';

Meteor.methods({
	async 'livechat:startFileUploadRoom'(roomId, token) {
		const guest = LivechatVisitors.getVisitorByToken(token);

		const message = {
			_id: Random.id(),
			rid: roomId || Random.id(),
			msg: '',
			ts: new Date(),
			token: guest.token,
		};

		const room = await Livechat.getRoom(guest, message);
		return room;
	},
});
