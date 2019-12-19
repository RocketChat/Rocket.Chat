import { createContext, useContext, useCallback } from 'react';

import { useObservableValue } from '../hooks/useObservableValue';

export const UserContext = createContext({
	userId: null,
	user: null,
	loginWithPassword: async () => {},
	getPreference: () => {},
});

export const useUserId = () => useContext(UserContext).userId;
export const useUser = () => useContext(UserContext).user;
export const useLoginWithPassword = () => useContext(UserContext).loginWithPassword;
export const useUserPreference = (key, defaultValue = undefined) => {
	const { getPreference } = useContext(UserContext);
	return useObservableValue(useCallback((listener) =>
		getPreference(key, defaultValue, listener), [getPreference, key, defaultValue]));
};
