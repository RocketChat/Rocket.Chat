import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { Livechat } from '../lib/Livechat';

Meteor.methods({
	'livechat:updateForwardStatusOfflineAgent'(data, status) {
		check(data, {
			roomId: String,
			userId: Match.Optional(String),
			departmentId: Match.Optional(String),
			originalAgentId: Match.Optional(String),
			timeout: Match.Optional(Match.Integer),
			timeoutAgent: Match.Optional(Match.Integer),
		});

		// Update Livechat status
		if (data.originalAgentId !== Meteor.userId()) {
			Meteor.setTimeout(() => Livechat.forwardChat(data.roomId, status), data.timeoutAgent);
		}
	},
});
