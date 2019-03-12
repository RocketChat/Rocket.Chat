import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { LivechatVisitors } from 'meteor/rocketchat:models';
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

		if (!guest) {
			throw new Meteor.Error('invalid-token');
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
