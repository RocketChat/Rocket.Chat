import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { LivechatDepartment } from '../../../models';

Meteor.publish('livechat:departments', function(filter = {}, limit = 50) {
	if (!this.userId) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:agents' }));
	}

	if (!hasPermission(this.userId, 'view-l-room')) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:agents' }));
	}

	if (filter && filter._id) {
		return LivechatDepartment.findByDepartmentId(filter._id);
	}

	return LivechatDepartment.find({}, { limit });
});
