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
			originalAgentId: Match.Optional(String),
			currentAgent: Match.Optional(Object),
			timeout: Match.Optional(Match.Integer),
			expirationAt: Match.Optional(Match.Integer),
		});

		return Livechat.addTransferData({
			transferData,
		});
	},
});
