import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { hasPermission } from '../../../authorization';
import { Livechat } from '../lib/Livechat';

Meteor.methods({
	'livechat:addTranferData'(transferData) {
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'view-l-room')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:addTranferData' });
		}

		check(transferData, {
			roomId: String,
			userId: String,
			departmentId: Match.Optional(String),
			originalAgentId: String,
			timeout: Match.Optional(Match.Integer),
			timeoutAgent: Match.Optional(Match.Integer),
			currentAgent: Object,
		});

		return Livechat.addTransferData({
			transferData,
		});
	},
});
