import type { Subscribable, UserPresence } from '@rocket.chat/core-typings';
import { createContext } from 'react';

export type UserPresenceContextValue = {
	queryUserData: (uid: string | undefined) => Subscribable<UserPresence | undefined>;
};

export const UserPresenceContext = createContext<UserPresenceContextValue>({
	queryUserData: () => ({ get: () => undefined, subscribe: () => () => undefined }),
});
