import { Meteor } from 'meteor/meteor';

Meteor.startup(function() {
	RocketChat.Notifications.onLogged('Users:NameChanged', function({ _id, name, username }) {
		RocketChat.models.Messages.update({
			'u._id': _id,
		}, {
			$set: {
				'u.username': username,
				'u.name': name,
			},
		}, {
			multi: true,
		});

		RocketChat.models.Messages.update({
			mentions: {
				$elemMatch: { _id },
			},
		}, {
			$set: {
				'mentions.$.username': username,
				'mentions.$.name': name,
			},
		}, {
			multi: true,
		});

		RocketChat.models.Subscriptions.update({
			name: username,
			t: 'd',
		}, {
			$set: {
				fname: name,
			},
		});
	});
});
