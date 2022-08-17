import { ConnectionStatusContext, ConnectionStatusContextValue } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import React, { FC } from 'react';

import { useReactiveValue } from '../hooks/useReactiveValue';

const getValue = (): ConnectionStatusContextValue => ({
	...Meteor.status(),
	reconnect: Meteor.reconnect,
});

const ConnectionStatusProvider: FC = ({ children }) => {
	const status = useReactiveValue(getValue);

	return <ConnectionStatusContext.Provider children={children} value={status} />;
};

export default ConnectionStatusProvider;
