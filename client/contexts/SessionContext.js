import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

export const SessionContext = createContext({
	get: () => null,
	subscribe: () => () => {},
	set: () => {},
});

export const useSession = (name) => {
	const session = useContext(SessionContext);

	const [value, setValue] = useState(() => session.get(name));

	const mounted = useRef(true);

	useEffect(() => {
		mounted.current = true;

		return () => {
			mounted.current = false;
		};
	}, [mounted]);

	useEffect(() => {
		const unsubscribe = session.subscribe(name, (newValue) => {
			if (!mounted.current) {
				return;
			}

			setValue(newValue);
		});

		return () => {
			unsubscribe();
		};
	}, [mounted, session, name]);

	return [value, useCallback((value) => session.set(name, value), [name, value])];
};
