import { createContext, useCallback, useContext, useMemo } from 'react';

import { useObservableValue } from '../hooks/useObservableValue';

export const SessionContext = createContext({
	get: () => null,
	subscribe: () => () => {},
	set: () => {},
});

export const useSession = (name) => {
	const session = useContext(SessionContext);

	const getInitialValue = useMemo(() => session.get.bind(session, name), [session, name]);
	const subscribe = useMemo(() => session.subscribe.bind(session, name), [session, name]);
	const value = useObservableValue(getInitialValue, subscribe);

	const setValue = useCallback((value) => session.set(name, value), [session, name]);

	return [value, setValue];
};
