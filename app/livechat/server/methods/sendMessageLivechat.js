import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { LivechatVisitors, Rooms } from '../../../models';
import { Livechat } from '../lib/Livechat';

Meteor.methods({
	sendMessageLivechat({ token, _id, rid, msg, attachments }, agent) {
		check(token, String);
		check(_id, String);
		check(rid, String);
		check(msg, String);

		check(agent, Match.Maybe({
			agentId: String,
			username: String,
		}));

		const guest = LivechatVisitors.getVisitorByToken(token, {
			fields: {
				name: 1,
				username: 1,
				department: 1,
				token: 1,
			},
		});

		const fields = {
			t: 1,
			closedAt: 1,
			open: 1,
		};

		if (!guest) {
			throw new Meteor.Error('invalid-token');
		}

		// Check if conversation is closed or not.
		const closed = Rooms.findOneLivechatById(rid, fields);
		if (closed && closed.closedAt) {
			throw new Meteor.Error('chat-closed');
		}

		return Livechat.sendMessage({
			guest,
			message: {
				_id,
				rid,
				msg,
				token,
				attachments,
			},
			agent,
		});
	},
});
