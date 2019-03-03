import { Meteor } from 'meteor/meteor';
import { hasPermission } from 'meteor/rocketchat:authorization';
import { Livechat } from '../lib/Livechat';

Meteor.methods({
	'livechat:removeAgent'(username) {
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'view-livechat-manager')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:removeAgent' });
		}

		return Livechat.removeAgent(username);
	},
});
