import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

Meteor.publish('livechat:officeHour', function() {
	if (!RocketChat.authz.hasPermission(this.userId, 'view-l-room')) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:agents' }));
	}

	return RocketChat.models.LivechatOfficeHour.find();
});
