import React from 'react';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';

import { SessionContext } from '../contexts/SessionContext';

const contextValue = {
	get: (name, listener) => {
		if (!listener) {
			return Tracker.nonreactive(() => Session.get(name));
		}

		const computation = Tracker.autorun(({ firstRun }) => {
			const value = Session.get(name);
			if (!firstRun) {
				listener(value);
			}
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
	return <SessionContext.Provider children={children} value={contextValue} />;
}
