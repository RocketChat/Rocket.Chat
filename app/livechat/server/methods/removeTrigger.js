import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { hasPermission } from '../../../authorization';
import { LivechatTrigger } from '../../../models';

Meteor.methods({
	'livechat:removeTrigger'(triggerId) {
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'view-livechat-manager')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:removeTrigger' });
		}

		check(triggerId, String);

		return LivechatTrigger.removeById(triggerId);
	},
});
