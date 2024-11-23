import { useUserId, useStream } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import { useEffect } from 'react';

export const useUpdateAvatar = () => {
	const notify = useStream('notify-logged');
	const uid = useUserId();
	useEffect(() => {
		if (!uid) {
			return;
		}
		return notify('updateAvatar', (data) => {
			if ('username' in data) {
				const { username, etag } = data;
				username && Meteor.users.update({ username }, { $set: { avatarETag: etag } });
			}
		});
	}, [notify, uid]);
};
