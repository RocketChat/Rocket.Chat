import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

Meteor.startup(function() {
	return RocketChat.models.Permissions.upsert('access-mailer', {
		$setOnInsert: {
			_id: 'access-mailer',
			roles: ['admin'],
		},
	});
});
