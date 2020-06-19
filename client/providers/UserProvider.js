import { Meteor } from 'meteor/meteor';
import React, { useCallback } from 'react';

import { getUserPreference } from '../../app/utils/client';
import { UserContext } from '../contexts/UserContext';
import { useReactiveValue } from '../hooks/useReactiveValue';
import { createObservableFromReactive } from './createObservableFromReactive';

const getPreference = createObservableFromReactive((key, defaultValue) =>
	getUserPreference(Meteor.userId(), key, defaultValue));

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
		getPreference,
	}), [userId, user, loginWithPassword]);

	return <UserContext.Provider children={children} value={contextValue} />;
}
