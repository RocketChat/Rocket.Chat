import { useUserId } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import { Users } from '../../../../../app/models/client';
import { useReactiveValue } from '../../../../hooks/useReactiveValue';
import { roomCoordinator } from '../../../../lib/rooms/roomCoordinator';

export const useMessageComposerIsReadOnly = (rid: string): boolean => {
	const uid = useUserId();

	const isReadOnly = useReactiveValue(
		useCallback(
			() => Boolean(roomCoordinator.readOnly(rid, (uid ? Users.findOne(uid, { fields: { username: 1 } }) : undefined)!)),
			[uid, rid],
		),
	);

	return isReadOnly;
};
