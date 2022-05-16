import { createContext } from 'react';
import type { Subscription, Unsubscribe } from 'use-subscription';

export type SessionContextValue = {
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
