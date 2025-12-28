import { useStream, useUserId } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { Messages } from '../../../stores';

export const useDeleteUser = () => {
	const notify = useStream('notify-logged');

	const uid = useUserId();

	const updateMessages = Messages.use((state) => state.update);
	const removeMessages = Messages.use((state) => state.remove);

	useEffect(() => {
		if (!uid) {
			return;
		}
		return notify('Users:Deleted', ({ userId, messageErasureType, replaceByUser }) => {
			if (messageErasureType === 'Unlink' && replaceByUser) {
				return updateMessages(
					(record) => record.u._id === userId,
					(record) => ({
						...record,
						alias: replaceByUser.alias,
						u: { ...record.u, _id: replaceByUser._id, username: replaceByUser.username ?? record.u.username, name: undefined },
					}),
				);
			}
			removeMessages((record) => record.u._id === userId);
		});
	}, [notify, removeMessages, uid, updateMessages]);
};
