import { Meteor } from 'meteor/meteor';
import { hasPermission } from 'meteor/rocketchat:authorization';
import { LivechatDepartment } from 'meteor/rocketchat:models';

Meteor.publish('livechat:departments', function(_id) {
	if (!this.userId) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:agents' }));
	}

	if (!hasPermission(this.userId, 'view-l-room')) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:agents' }));
	}

	if (_id !== undefined) {
		return LivechatDepartment.findByDepartmentId(_id);
	} else {
		return LivechatDepartment.find();
	}

});
