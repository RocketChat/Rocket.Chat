import { Meteor } from 'meteor/meteor';
import React, { useMemo } from 'react';

import { ConnectionStatusContext } from '../contexts/ConnectionStatusContext';
import { useReactiveValue } from '../../hooks/useReactiveValue';

export function ConnectionStatusProvider({ children }) {
	const status = useReactiveValue(() => ({ ...Meteor.status() }));

	const contextValue = useMemo(() => ({
		status,
		reconnect: Meteor.reconnect,
	}), [status]);

	return <ConnectionStatusContext.Provider value={contextValue}>
		{children}
	</ConnectionStatusContext.Provider>;
}
