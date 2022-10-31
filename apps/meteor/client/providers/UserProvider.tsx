import type { IRoom, ISubscription, IUser } from '@rocket.chat/core-typings';
import { UserContext } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import React, { useMemo, FC } from 'react';

import { Subscriptions, Rooms } from '../../app/models/client';
import { getUserPreference } from '../../app/utils/client';
import { callbacks } from '../../lib/callbacks';
import { useReactiveValue } from '../hooks/useReactiveValue';
import { createReactiveSubscriptionFactory } from '../lib/createReactiveSubscriptionFactory';
import { call } from '../lib/utils/call';

const getUserId = (): string | null => Meteor.userId();

const getUser = (): IUser | null => Meteor.user() as IUser | null;

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

const logout = (): Promise<void> =>
	new Promise((resolve, reject) => {
		const user = getUser();

		if (!user) {
			return resolve();
		}

		Meteor.logout(() => {
			callbacks.run('afterLogoutCleanUp', user);
			call('logoutCleanUp', user).then(resolve, reject);
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
			queryPreference: createReactiveSubscriptionFactory(
				<T,>(key: string, defaultValue?: T) => getUserPreference(userId, key, defaultValue) as T,
			),
			querySubscription: createReactiveSubscriptionFactory<ISubscription | undefined>((query, fields) =>
				Subscriptions.findOne(query, { fields }),
			),
			queryRoom: createReactiveSubscriptionFactory<IRoom | undefined>((query, fields) => Rooms.findOne(query, { fields })),
			querySubscriptions: createReactiveSubscriptionFactory<Array<ISubscription> | []>((query, options) =>
				(userId ? Subscriptions : Rooms).find(query, options).fetch(),
			),
		}),
		[userId, user],
	);

	return <UserContext.Provider children={children} value={contextValue} />;
};

export default UserProvider;
