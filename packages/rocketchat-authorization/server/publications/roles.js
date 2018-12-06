import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

Meteor.publish('roles', function() {
	if (!this.userId) {
		return this.ready();
	}

	return RocketChat.models.Roles.find();
});
