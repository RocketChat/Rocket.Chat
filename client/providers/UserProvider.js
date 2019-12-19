import { Meteor } from 'meteor/meteor';
import React, { useCallback } from 'react';

import { UserContext } from '../contexts/UserContext';
import { useReactiveValue } from '../hooks/useReactiveValue';

export function UserProvider({ children }) {
	const userId = useReactiveValue(() => Meteor.userId(), []);
	const user = useReactiveValue(() => Meteor.user(), []);
	const loginWithPassword = useCallback((user, password) => new Promise((resolve, reject) => {
		Meteor.loginWithPassword(user, password, (error, result) => {
			if (error) {
				reject(error);
				return;
			}

			resolve(result);
		});
	}), []);

	const contextValue = useReactiveValue(() => ({
		userId,
		user,
		loginWithPassword,
	}), [userId, user, loginWithPassword]);

	return <UserContext.Provider children={children} value={contextValue} />;
}
