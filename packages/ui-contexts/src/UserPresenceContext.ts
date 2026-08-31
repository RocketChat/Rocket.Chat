import type { UserPresence } from '@rocket.chat/core-typings';
import { createContext } from 'react';

export type UserPresenceContextValue = {
	queryUserData: (uid: string | undefined) => {
		get(): UserPresence | undefined;
		subscribe(callback: () => void): () => void;
	};
};

export const UserPresenceContext = createContext<UserPresenceContextValue>({
	queryUserData: () => ({ get: () => undefined, subscribe: () => () => undefined }),
});
