import { SessionContext } from '@rocket.chat/ui-contexts';
import { Session } from 'meteor/session';
import type { FC } from 'react';
import React from 'react';

import { createReactiveSubscriptionFactory } from '../lib/createReactiveSubscriptionFactory';

const contextValue = {
	query: createReactiveSubscriptionFactory<unknown>((name) => Session.get(name)),
	dispatch: (name: string, value: unknown): void => {
		Session.set(name, value);
	},
};

const SessionProvider: FC = ({ children }) => <SessionContext.Provider children={children} value={contextValue} />;

export default SessionProvider;
