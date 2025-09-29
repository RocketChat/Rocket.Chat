import type { IUser } from '@rocket.chat/core-typings';
import { create } from 'zustand';

import { Users } from '../stores';

/**
 * @private do not consume this store directly -- consume it via UserContext
 */
export const userIdStore = create<IUser['_id'] | undefined>(() => undefined);

export const getUserId = () => userIdStore.getState();

export const getUser = () => {
	const userId = getUserId();
	if (!userId) return undefined;
	return Users.state.get(userId);
};
