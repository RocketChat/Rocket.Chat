import { Meteor } from 'meteor/meteor';
import React from 'react';

import { ConnectionStatusContext } from '../contexts/ConnectionStatusContext';
import { useReactiveValue } from '../hooks/useReactiveValue';

export function ConnectionStatusProvider({ children }) {
	const status = useReactiveValue(() => ({
		...Meteor.status(),
		reconnect: Meteor.reconnect,
	}), []);

	return <ConnectionStatusContext.Provider children={children} value={status} />;
}
