import type { IUser } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Tracker } from 'meteor/tracker';

import { RoomManager } from '../../../../client/lib/RoomManager';
import { asReactiveSource } from '../../../../client/lib/tracker';
import { Messages } from '../../../models/client';

export const usersFromRoomMessages = new Mongo.Collection<{
	_id: string;
	username: string;
	name: string | undefined;
	ts: Date;
	suggestion?: boolean;
}>(null);

Meteor.startup(() => {
	Tracker.autorun(async () => {
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

		await Promise.all(
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
						'u._id': 1,
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
				.map(({ u: { username, name, _id }, ts }) =>
					usersFromRoomMessages.upsertAsync(
						{ _id },
						{
							_id,
							username,
							name,
							ts,
						},
					),
				),
		);
	});
});
