import { Meteor } from 'meteor/meteor';
import { Notifications } from '../../app/notifications';
import { Messages, Subscriptions } from '../../app/models';

Meteor.startup(function() {
	Notifications.onLogged('Users:NameChanged', function({ _id, name, username }) {
		Messages.update({
			'u._id': _id,
		}, {
			$set: {
				'u.name': name,
			},
		}, {
			multi: true,
		});

		Messages.update({
			mentions: {
				$elemMatch: { _id },
			},
		}, {
			$set: {
				'mentions.$.name': name,
			},
		}, {
			multi: true,
		});

		Subscriptions.update({
			name: username,
			t: 'd',
		}, {
			$set: {
				fname: name,
			},
		});
	});
});
