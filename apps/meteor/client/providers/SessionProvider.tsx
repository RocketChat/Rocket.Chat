import { Emitter } from '@rocket.chat/emitter';
import { SessionContext } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';

const store = new Map<string, unknown>();
const emitter = new Emitter();

const contextValue = {
	query: (name: string): [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => unknown] => [
		(onStoreChange) => emitter.on(name, onStoreChange),
		() => store.get(name),
	],
	dispatch: (name: string, value: unknown): void => {
		if (store.has(name) && store.get(name) === value) {
			return;
		}
		store.set(name, value);
		emitter.emit(name);
	},
};

type SessionProviderProps = {
	children?: ReactNode;
};

const SessionProvider = ({ children }: SessionProviderProps) => (
	<SessionContext.Provider value={contextValue}>{children}</SessionContext.Provider>
);

export default SessionProvider;
