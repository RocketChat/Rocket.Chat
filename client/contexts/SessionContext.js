import { createContext, useCallback, useContext } from 'react';

import { useObservableValue } from '../hooks/useObservableValue';

export const SessionContext = createContext({
	get: () => {},
	set: () => {},
});

export const useSession = (name) => {
	const { get } = useContext(SessionContext);
	return useObservableValue((listener) => get(name, listener));
};

export const useSessionDispatch = (name) => {
	const { set } = useContext(SessionContext);
	return useCallback((value) => set(name, value), [set, name]);
};
