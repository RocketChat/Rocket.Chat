import { Meteor } from 'meteor/meteor';
import { hasPermission } from '/app/authorization';
import { Livechat } from '../lib/Livechat';

Meteor.methods({
	'livechat:addAgent'(username) {
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'view-livechat-manager')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:addAgent' });
		}

		return Livechat.addAgent(username);
	},
});
