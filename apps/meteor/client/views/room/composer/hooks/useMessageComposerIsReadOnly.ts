import type { IRoom } from '@rocket.chat/core-typings';
import { useUser } from '@rocket.chat/ui-contexts';

import { useCallback } from 'react';

import { useReactiveValue } from '../../../../hooks/useReactiveValue';
import { roomCoordinator } from '../../../../lib/rooms/roomCoordinator';

export const useMessageComposerIsReadOnly = (room: IRoom): boolean => {
	const user = useUser();
	return useReactiveValue(useCallback(() => roomCoordinator.readOnly(room, user), [room, user]));
};
