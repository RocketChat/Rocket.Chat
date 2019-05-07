import { Meteor } from 'meteor/meteor';
import { Users, Messages, Rooms, Subscriptions } from '../../../../models/server';
import { getUserAvatarURL } from '../../../../utils/lib/getUserAvatarURL';

/*
Up to now, there's no "DB version" stored for assistify.
Until we've got expensive of contradicting migrations, we'll just use this file to write functions running
on startup which migrate data - ignoring the actual version
 */

Meteor.startup(() => {

	const _guessNameFromUsername = function(username = '', email = '') {
		return (username || email.replace(/@.*/, ''))
			.replace(/\W/g, ' ')
			.replace(/\s(.)/g, function($1) { return $1.toUpperCase(); })
			.replace(/^(.)/, function($1) { return $1.toLowerCase(); })
			.replace(/^\w/, function($1) { return $1.toUpperCase(); });
	};

	const usersWithoutName = Users.find({ name: null }).fetch();
	usersWithoutName.forEach((user) => {
		if (user.username || (user.emails && user.emails.length > 0)) {
			Users.update({ _id: user._id }, { $set: { name: _guessNameFromUsername(user.username, user.emails[0].address) } });
		}
	});

});


/*
 Migrate from Threads to Discussions.
 - In Rooms Schema ParentRoomId changed to prid
 - In Subscription schema ParentRoomId changed to prid
 - Messages with type 'thread-welcome' will be removed.
 - Messages with type 'create-thread' will be migrated to 'disscussion-created'.
 - Author Information and Message link will be encapsulated inside attachments of message type 'disscussion-created'.
 */

Meteor.startup(() => {
	console.log('Migrating from threads to Discussions');
	// Migrate Rooms
	Rooms.update({}, { $rename: { parentRoomId: 'prid' } }, { multi: true });

	// Migrate Subscriptions
	Subscriptions.update({}, { $rename: { parentRoomId: 'prid' } }, { multi: true });

	// Migrate Messages
	Messages.remove({ t: 'thread-welcome' });
	Messages.find({ t: 'create-thread' }).forEach((msg) => {
		if (msg.channels && msg.channels[0]._id) {
			const room = Rooms.findOne({ _id: msg.channels[0]._id },
				{
					fields: {
						_id: 1,
						fname: 1,
						lm: 1,
						msgs: 1,
					},
				});

			if (room) {
				const update = {
					$set: {
						t: 'discussion-created',
						msg: room.fname,
						drid: room._id,
						dlm: room.lm,
						dcount: room.msgs,
					},
					$unset: {
						mentions: 1,
						channels: 1,
						urls: 1,
					},
				};

				if (msg.attachments && msg.attachments.length) {
					if (msg.roles && msg.roles.length) {
						// Threads created from the context menu will include the users from the parent channel.
						Object.assign(update.$set, {
							'attachments.0.author_name': msg.u.name,
							'attachments.0.author_icon': getUserAvatarURL(msg.u.name),
							'attachments.0.message_link' : msg.urls && msg.urls[0].url,
						});
					} else {
						// Thread created from the side Nav will not include the users from the channel
						Object.assign(update.$set, {
							attachments: [],
						});
					}
				}
				Messages.update({ _id: msg._id }, update);
			}
		}
	});
});
