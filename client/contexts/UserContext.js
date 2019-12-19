import { createContext, useContext } from 'react';

export const UserContext = createContext({
	userId: null,
	user: null,
	loginWithPassword: async () => {},
});

export const useUserId = () => useContext(UserContext).userId;
export const useUser = () => useContext(UserContext).user;
export const useLoginWithPassword = () => useContext(UserContext).loginWithPassword;
