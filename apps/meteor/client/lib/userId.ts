import type { IUser } from '@rocket.chat/core-typings';
import { create } from 'zustand';

/**
 * @private do not consume this store directly
 */
export const userIdStore = create<IUser['_id'] | undefined>(() => undefined);
