import { useStream } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { Messages, Users } from '../../../stores';

export const useUpdateAvatar = () => {
	const notify = useStream('notify-logged');

	useEffect(() => {
		return notify('updateAvatar', (data) => {
			if ('username' in data) {
				const { username, etag } = data;
				if (username) {
					Users.state.update(
						(record) => record.username === username,
						(record) => ({ ...record, avatarETag: etag }),
					);
					Messages.state.update(
						(message) => message.u && message.u.username === username,
						(message) => ({
							...message,
							u: { ...message.u, avatarETag: etag },
							avatar: etag ? `/avatar/${username}?etag=${etag}` : `/avatar/${username}`,
						}),
					);
				}
			}
		});
	}, [notify]);
};
