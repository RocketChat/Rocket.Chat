import { useStream, useUserId } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { Messages } from '../../../../app/models/client';

export const useDeleteUser = () => {
	const notify = useStream('notify-logged');

	const uid = useUserId();
	useEffect(() => {
		if (!uid) {
			return;
		}
		return notify('Users:Deleted', ({ userId, messageErasureType, replaceByUser }) => {
			if (messageErasureType === 'Unlink' && replaceByUser) {
				return Messages.update(
					{
						'u._id': userId,
					},
					{
						$set: {
							'alias': replaceByUser.alias,
							'u._id': replaceByUser._id,
							'u.username': replaceByUser.username,
							'u.name': undefined,
						},
					},
					{ multi: true },
				);
			}
			Messages.remove({
				'u._id': userId,
			});
		});
	}, [notify, uid]);
};
