import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { hasPermission } from '../../../authorization';
import { Livechat } from '../lib/Livechat';
import { Users } from '../../../models';

Meteor.methods({
	'livechat:addTranferData'(transferData) {
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'view-l-room')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:addTranferData' });
		}

		check(transferData, {
			roomId: String,
			userId: String,
			departmentId: Match.Optional(String),
			originalAgent: Match.Optional(String),
			currentAgent: Match.Optional(Object),
			timeout: Match.Optional(Match.Integer),
			timeoutAgent: Match.Optional(Match.Integer),
			expirationAt: Match.Optional(Date),
		});

		// Find information about requestedBy agent and targetAgent in
		// forward process of livechat.

		if (transferData.originalAgent) {
			const { _id, name, username } = Users.findOneById(transferData.originalAgent);
			transferData.originalAgent = { _id, name, username };
		}

		if (transferData.userId) {
			const { _id, name, username } = Users.findOneById(transferData.userId);
			transferData.userId = { _id, name, username };
		}

		return Livechat.addTransferData({
			transferData,
		});
	},
});
