import { Meteor } from 'meteor/meteor';

import { RoutingManager } from '../lib/RoutingManager';

Meteor.methods({
	'livechat:getRoutingConfig'() {
		return RoutingManager.getConfig();
	},
});
