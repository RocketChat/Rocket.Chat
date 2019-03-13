import { Meteor } from 'meteor/meteor';
import { hasPermission } from '/app/authorization';
import { LivechatCustomField } from '/app/models';
import s from 'underscore.string';

Meteor.publish('livechat:customFields', function(_id) {
	if (!this.userId) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:customFields' }));
	}

	if (!hasPermission(this.userId, 'view-l-room')) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:customFields' }));
	}

	if (s.trim(_id)) {
		return LivechatCustomField.find({ _id });
	}

	return LivechatCustomField.find();

});
