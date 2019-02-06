import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';
import { LivechatTrigger } from '../models';

Meteor.publish('livechat:triggers', function(_id) {
	if (!this.userId) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:triggers' }));
	}

	if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-manager')) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:triggers' }));
	}

	if (_id !== undefined) {
		return LivechatTrigger.findById(_id);
	} else {
		return LivechatTrigger.find();
	}
});
