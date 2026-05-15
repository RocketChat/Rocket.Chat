import type { IRoom } from '@rocket.chat/core-typings';
import { isABACManagedRoom } from '@rocket.chat/core-typings';

import { useIsABACAvailable } from './useIsABACAvailable';

export const useIsABACManagedRoom = (room: Partial<IRoom>): boolean => {
	const isABACAvailable = useIsABACAvailable();
	return isABACAvailable && isABACManagedRoom(room);
};
