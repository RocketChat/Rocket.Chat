import type { IRoom, ISubscription, IUser } from '@rocket.chat/core-typings';
import { UserContext } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import React, { useMemo, FC } from 'react';

import { Subscriptions, Rooms } from '../../app/models/client';
import { getUserPreference } from '../../app/utils/client';
import { useReactiveValue } from '../hooks/useReactiveValue';
import { createReactiveSubscriptionFactory } from './createReactiveSubscriptionFactory';

const getUserId = (): string | null => Meteor.userId();

const getUser = (): IUser | null => Meteor.user() as IUser | null;

const UserProvider: FC = ({ children }) => {
	const userId = useReactiveValue(getUserId);
	const user = useReactiveValue(getUser);
	const contextValue = useMemo(
		() => ({
			userId,
			user,
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
