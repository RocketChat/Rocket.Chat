import type { IUser } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';

import { Messages, Subscriptions } from '../../../app/models/client';
import { Notifications } from '../../../app/notifications/client';

type UsersNameChangedEvent = Partial<IUser>;

Meteor.startup(() => {
	Notifications.onLogged('Users:NameChanged', ({ _id, name, username }: UsersNameChangedEvent) => {
		Messages.update(
			{
				'u._id': _id,
			},
			{
				$set: {
					'u.username': username,
					'u.name': name,
				},
			},
			{
				multi: true,
			},
		);

		Messages.update(
			{
				mentions: {
					$elemMatch: { _id },
				},
			},
			{
				$set: {
					'mentions.$.username': username,
					'mentions.$.name': name,
				},
			},
			{
				multi: true,
			},
		);

		Subscriptions.update(
			{
				name: username,
				t: 'd',
			},
			{
				$set: {
					fname: name,
				},
			},
		);
	});
});
