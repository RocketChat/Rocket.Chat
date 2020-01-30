import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { LivechatDepartment } from '../../../models';

Meteor.publish('livechat:departments', function(_id, limit = 50) {
	console.warn('The publication "livechat:departments" is deprecated and will be removed after version v3.0.0');
	if (!this.userId) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:departments' }));
	}

	if (!hasPermission(this.userId, 'view-l-room')) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:departments' }));
	}

	if (_id) {
		return LivechatDepartment.findByDepartmentId(_id);
	}

	return LivechatDepartment.find({}, { limit });
});
