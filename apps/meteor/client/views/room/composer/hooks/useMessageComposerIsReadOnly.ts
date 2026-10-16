import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { usePermission, useUser } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { roomCoordinator } from '../../../../lib/rooms/roomCoordinator';

export const useMessageComposerIsReadOnly = (room: IRoom, options?: { tmid?: IMessage['_id'] }): boolean => {
	const user = useUser();
	const postReadOnly = usePermission('post-readonly', room._id);

	return useMemo(() => {
		if (user?.username && Array.isArray(room.muted) && room.muted.includes(user.username)) {
			return true;
		}

		if (options?.tmid && room.ro && room.replyWhenReadOnly) {
			return false;
		}

		return roomCoordinator.readOnly(room, user);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [room, user, postReadOnly, options?.tmid]);
};
