import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../app/authorization';
import { Subscriptions } from '../../app/models';

Meteor.publish('roomSubscriptionsByRole', function(rid, role) {
	console.warn('The publication "roomSubscriptionsByRole" is deprecated and will be removed after version v2.0.0');

	if (!this.userId) {
		return this.ready();
	}

	if (hasPermission(this.userId, 'view-other-user-channels') !== true) {
		return this.ready();
	}

	return Subscriptions.findByRoomIdAndRoles(rid, role, {
		fields: {
			rid: 1,
			name: 1,
			roles: 1,
			u: 1,
		},
		sort: {
			name: 1,
		},
	});
});
