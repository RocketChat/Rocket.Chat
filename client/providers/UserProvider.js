import { Meteor } from 'meteor/meteor';
import React, { useMemo } from 'react';

import { getUserPreference } from '../../app/utils/client';
import { UserContext } from '../contexts/UserContext';
import { useReactiveValue } from '../hooks/useReactiveValue';
import { createObservableFromReactive } from './createObservableFromReactive';

const getUserId = () => Meteor.userId();

const getUser = () => Meteor.user();

const loginWithPassword = (user, password) => new Promise((resolve, reject) => {
	Meteor.loginWithPassword(user, password, (error, result) => {
		if (error) {
			reject(error);
			return;
		}

		resolve(result);
	});
});

const getPreference = createObservableFromReactive((key, defaultValue) =>
	getUserPreference(Meteor.userId(), key, defaultValue));

export function UserProvider({ children }) {
	const userId = useReactiveValue(getUserId);
	const user = useReactiveValue(getUser);

	const contextValue = useMemo(() => ({
		userId,
		user,
		loginWithPassword,
		getPreference,
	}), [userId, user]);

	return <UserContext.Provider children={children} value={contextValue} />;
}
