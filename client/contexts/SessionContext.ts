import { createContext, useCallback, useContext, useMemo } from 'react';
import { useSubscription, Subscription, Unsubscribe } from 'use-subscription';

type SessionContextValue = {
	query: (name: string) => Subscription<unknown>;
	dispatch: (name: string, value: unknown) => void;
};

export const SessionContext = createContext<SessionContextValue>({
	query: () => ({
		getCurrentValue: (): undefined => undefined,
		subscribe: (): Unsubscribe => (): void => undefined,
	}),
	dispatch: (): void => undefined,
});

export const useSession = (name: string): unknown => {
	const { query } = useContext(SessionContext);
	const subscription = useMemo(() => query(name), [query, name]);
	return useSubscription(subscription);
};

export const useSessionDispatch = (name: string): ((value: unknown) => void) => {
	const { dispatch } = useContext(SessionContext);
	return useCallback((value) => dispatch(name, value), [dispatch, name]);
};
