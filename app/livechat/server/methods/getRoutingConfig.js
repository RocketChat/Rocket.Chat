import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { RoutingManager } from '../lib/RoutingManager';

Meteor.methods({
	'livechat:getRoutingConfig'() {
		const userId = Meteor.userId();
		if (!userId || !hasPermission(userId, 'close-livechat-room')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'livechat:getRoutingConfig' });
		}

		return RoutingManager.getConfig();
	},
});
