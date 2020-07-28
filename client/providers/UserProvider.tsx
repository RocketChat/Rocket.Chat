import { Meteor } from 'meteor/meteor';
import React, { useMemo, FC } from 'react';

import { getUserPreference } from '../../app/utils/client';
import { UserContext } from '../contexts/UserContext';
import { useReactiveValue } from '../hooks/useReactiveValue';
import { createReactiveSubscriptionFactory } from './createReactiveSubscriptionFactory';
import { Subscriptions } from '../../app/models/client';

const getUserId = (): string | null => Meteor.userId();

const getUser = (): Meteor.User | null => Meteor.user();

const loginWithPassword = (user: string | object, password: string): Promise<void> =>
	new Promise((resolve, reject) => {
		Meteor.loginWithPassword(user, password, (error: Error | Meteor.Error | Meteor.TypedError | undefined) => {
			if (error) {
				reject(error);
				return;
			}

			resolve();
		});
	});

const UserProvider: FC = ({ children }) => {
	const userId = useReactiveValue(getUserId);
	const user = useReactiveValue(getUser);

	const contextValue = useMemo(() => ({
		userId,
		user,
		loginWithPassword,
		queryPreference: createReactiveSubscriptionFactory(
			(key, defaultValue) => getUserPreference(userId, key, defaultValue),
		),
		querySubscription: createReactiveSubscriptionFactory((query, fields) => Subscriptions.findOne(query, { fields })),
	}), [userId, user]);

	return <UserContext.Provider children={children} value={contextValue} />;
};

export default UserProvider;
