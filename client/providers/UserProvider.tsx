import { Meteor } from 'meteor/meteor';
import React, { useMemo, FC } from 'react';

import { callbacks } from '../../app/callbacks/client';
import { Subscriptions, Rooms } from '../../app/models/client';
import { getUserPreference } from '../../app/utils/client';
import { IRoom } from '../../definition/IRoom';
import { ISubscription } from '../../definition/ISubscription';
import { UserContext } from '../contexts/UserContext';
import { useReactiveValue } from '../hooks/useReactiveValue';
import { createReactiveSubscriptionFactory } from './createReactiveSubscriptionFactory';

const getUserId = (): string | null => Meteor.userId();

const getUser = (): Meteor.User | null => Meteor.user();

const loginWithPassword = (user: string | object, password: string): Promise<void> =>
	new Promise((resolve, reject) => {
		Meteor.loginWithPassword(
			user,
			password,
			(error: Error | Meteor.Error | Meteor.TypedError | undefined) => {
				if (error) {
					reject(error);
					return;
				}

				resolve();
			},
		);
	});

const logout = (): Promise<void> =>
	new Promise((resolve) => {
		const user = Meteor.user();

		if (!user) {
			return resolve();
		}

		Meteor.logout(() => {
			callbacks.run('afterLogoutCleanUp', user);
			Meteor.call('logoutCleanUp', user, resolve);
		});
	});

const UserProvider: FC = ({ children }) => {
	const userId = useReactiveValue(getUserId);
	const user = useReactiveValue(getUser);
	const contextValue = useMemo(
		() => ({
			userId,
			user,
			loginWithPassword,
			logout,
			queryPreference: createReactiveSubscriptionFactory((key, defaultValue) =>
				getUserPreference(userId, key, defaultValue),
			),
			querySubscription: createReactiveSubscriptionFactory<ISubscription | undefined>(
				(query, fields) => Subscriptions.findOne(query, { fields }),
			),
			queryRoom: createReactiveSubscriptionFactory<IRoom | undefined>((query, fields) =>
				Rooms.findOne(query, { fields }),
			),
			querySubscriptions: createReactiveSubscriptionFactory<Array<ISubscription> | []>(
				(query, options) => (userId ? Subscriptions : Rooms).find(query, options).fetch(),
			),
		}),
		[userId, user],
	);

	return <UserContext.Provider children={children} value={contextValue} />;
};

export default UserProvider;
