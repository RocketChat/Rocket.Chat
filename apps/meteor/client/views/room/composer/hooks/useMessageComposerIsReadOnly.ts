import type { IRoom } from '@rocket.chat/core-typings';
import { usePermission, useUser } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

import { roomCoordinator } from '../../../../lib/rooms/roomCoordinator';

export const useMessageComposerIsReadOnly = (room: IRoom): boolean => {
	const user = useUser();
	// depend on post-readonly so this re-runs when the permission is granted/revoked at runtime;
	// roomCoordinator.readOnly calls hasPermission internally and returns the up-to-date value.
	const postReadOnly = usePermission('post-readonly', room._id);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	return useMemo(() => roomCoordinator.readOnly(room, user), [room, user, postReadOnly]);
};
