import { useUserId, useStream } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { Users } from '../../../../app/models/client';

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
				username && Users.update({ username }, { $set: { avatarETag: etag } });
			}
		});
	}, [notify, uid]);
};
