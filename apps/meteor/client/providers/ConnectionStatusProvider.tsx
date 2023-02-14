import type { ConnectionStatusContextValue } from '@rocket.chat/ui-contexts';
import { ConnectionStatusContext } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import type { FC } from 'react';
import React from 'react';

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
