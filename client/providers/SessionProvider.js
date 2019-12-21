import React from 'react';
import { Session } from 'meteor/session';

import { SessionContext } from '../contexts/SessionContext';
import { createObservableFromReactive } from './createObservableFromReactive';

const contextValue = {
	get: createObservableFromReactive((name) => Session.get(name)),
	set: (name, value) => {
		Session.set(name, value);
	},
};

export function SessionProvider({ children }) {
	return <SessionContext.Provider children={children} value={contextValue} />;
}
