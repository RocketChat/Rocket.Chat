import type { ConnectionStatusContextValue } from '@rocket.chat/ui-contexts';
import { ConnectionStatusContext } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import type { ReactNode } from 'react';

import { useReactiveValue } from '../hooks/useReactiveValue';

const getValue = (): ConnectionStatusContextValue => ({
	...Meteor.status(),
	reconnect: Meteor.reconnect,
	isLoggingIn: Meteor.loggingIn(),
});

type ConnectionStatusProviderProps = {
	children?: ReactNode;
};

const ConnectionStatusProvider = ({ children }: ConnectionStatusProviderProps) => {
	const status = useReactiveValue(getValue);

	return <ConnectionStatusContext.Provider children={children} value={status} />;
};

export default ConnectionStatusProvider;
