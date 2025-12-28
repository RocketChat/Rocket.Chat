import { SessionContext } from '@rocket.chat/ui-contexts';
import { Session } from 'meteor/session';
import type { ReactNode } from 'react';

import { createReactiveSubscriptionFactory } from '../lib/createReactiveSubscriptionFactory';

const contextValue = {
	query: createReactiveSubscriptionFactory<unknown>((name) => Session.get(name)),
	dispatch: (name: string, value: unknown): void => {
		Session.set(name, value);
	},
};

type SessionProviderProps = {
	children?: ReactNode;
};

const SessionProvider = ({ children }: SessionProviderProps) => <SessionContext.Provider children={children} value={contextValue} />;

export default SessionProvider;
