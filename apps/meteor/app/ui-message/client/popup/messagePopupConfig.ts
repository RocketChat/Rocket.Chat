import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Tracker } from 'meteor/tracker';
import type { IUser } from '@rocket.chat/core-typings';

import { Messages } from '../../../models/client';
import { asReactiveSource } from '../../../../client/lib/tracker';
import { RoomManager } from '../../../../client/lib/RoomManager';

export const usersFromRoomMessages = new Mongo.Collection<{
	_id: string;
	username: string;
	name: string | undefined;
	ts: Date;
	suggestion?: boolean;
}>(null);

Meteor.startup(() => {
	Tracker.autorun(() => {
		const uid = Meteor.userId();
		const rid = asReactiveSource(
			(cb) => RoomManager.on('changed', cb),
			() => RoomManager.opened,
		);
		const user = uid ? (Meteor.users.findOne(uid, { fields: { username: 1 } }) as IUser | undefined) : undefined;
		if (!rid || !user) {
			return;
		}

		usersFromRoomMessages.remove({});

		const uniqueMessageUsersControl: Record<string, boolean> = {};

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
});
