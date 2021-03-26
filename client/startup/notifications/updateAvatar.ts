import { Meteor } from 'meteor/meteor';

import { Notifications } from '../../../app/notifications/client';
import { IUser } from '../../../definition/IUser';

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
