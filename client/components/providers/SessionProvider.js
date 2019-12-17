import React from 'react';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';

import { SessionContext } from '../../contexts/SessionContext';

const session = {
	get: (name) => Session.get(name),
	subscribe: (name, listener) => {
		const computation = Tracker.autorun(() => {
			listener(Session.get(name));
		});

		return () => {
			computation.stop();
		};
	},
	set: (name, value) => {
		Session.set(name, value);
	},
};

export function SessionProvider({ children }) {
	return <SessionContext.Provider children={children} value={session} />;
}
