import type { UIEvent } from 'react';
import { createContext, useContext } from 'react';

export type UserCardContextValue = {
	openUserCard: (e: UIEvent, username: string) => void;
	closeUserCard: () => void;
};

export const UserCardContext = createContext<UserCardContextValue>({
	openUserCard: () => undefined,
	closeUserCard: () => undefined,
});

export const useUserCard = () => useContext(UserCardContext);
