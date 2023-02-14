import type { IUser } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';

import { Notifications } from '../../../app/notifications/client';

type UpdateAvatarEvent = {
	username: IUser['username'];
	etag: IUser['avatarETag'];
};

Meteor.startup(() => {
	Notifications.onLogged('updateAvatar', (data: UpdateAvatarEvent) => {
		const { username, etag } = data;
		username && Meteor.users.update({ username }, { $set: { avatarETag: etag } });
	});
});
