import { Meteor } from 'meteor/meteor';
import React from 'react';

import { ConnectionStatusContext } from '../contexts/ConnectionStatusContext';
import { useReactiveValue } from '../hooks/useReactiveValue';

const getStatus = () => ({
	...Meteor.status(),
	reconnect: Meteor.reconnect,
});

export function ConnectionStatusProvider({ children }) {
	const status = useReactiveValue(getStatus);

	return <ConnectionStatusContext.Provider children={children} value={status} />;
}
