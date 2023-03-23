import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Tracker } from 'meteor/tracker';

import { Messages } from '../../../models/client';
import { asReactiveSource } from '../../../../client/lib/tracker';
import { RoomManager } from '../../../../client/lib/RoomManager';

export const usersFromRoomMessages = new Mongo.Collection(null);
Tracker.autorun(() => {
	const rid = asReactiveSource(
		(cb) => RoomManager.on('changed', cb),
		() => RoomManager.opened,
	);
	const user = Meteor.userId() && Meteor.users.findOne(Meteor.userId(), { fields: { username: 1 } });
	if (!rid || !user) {
		return;
	}

	usersFromRoomMessages.remove({});

	const uniqueMessageUsersControl = {};

	Messages.find(
		{
			rid,
			'u.username': { $ne: user.username },
			't': { $exists: false },
		},
		{
			fields: {
				'u.username': 1,
				'u.name': 1,
				'ts': 1,
			},
			sort: { ts: -1 },
		},
	)
		.fetch()
		.filter(({ u: { username } }) => {
			const notMapped = !uniqueMessageUsersControl[username];
			uniqueMessageUsersControl[username] = true;
			return notMapped;
		})
		.forEach(({ u: { username, name }, ts }) =>
			usersFromRoomMessages.upsert(username, {
				_id: username,
				username,
				name,
				ts,
			}),
		);
});
