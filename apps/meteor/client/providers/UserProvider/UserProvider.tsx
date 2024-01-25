import type { IRoom, ISubscription, IUser } from '@rocket.chat/core-typings';
import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { UserContext, useEndpoint } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import type { ContextType, ReactElement, ReactNode } from 'react';
import React, { useEffect, useMemo } from 'react';

import { Subscriptions, ChatRoom } from '../../../app/models/client';
import { getUserPreference } from '../../../app/utils/client';
import { sdk } from '../../../app/utils/client/lib/SDKClient';
import { afterLogoutCleanUpCallback } from '../../../lib/callbacks/afterLogoutCleanUpCallback';
import { useReactiveValue } from '../../hooks/useReactiveValue';
import { createReactiveSubscriptionFactory } from '../../lib/createReactiveSubscriptionFactory';
import { useCreateFontStyleElement } from '../../views/account/accessibility/hooks/useCreateFontStyleElement';
import { useClearRemovedRoomsHistory } from './hooks/useClearRemovedRoomsHistory';
import { useDeleteUser } from './hooks/useDeleteUser';
import { useEmailVerificationWarning } from './hooks/useEmailVerificationWarning';
import { useUpdateAvatar } from './hooks/useUpdateAvatar';

const getUserId = (): string | null => Meteor.userId();

const getUser = (): IUser | null => Meteor.user() as IUser | null;

const logout = (): Promise<void> =>
	new Promise((resolve, reject) => {
		const user = getUser();

		if (!user) {
			return resolve();
		}

		Meteor.logout(async () => {
			await afterLogoutCleanUpCallback.run(user);
			sdk.call('logoutCleanUp', user).then(resolve, reject);
		});
	});

type UserProviderProps = {
	children: ReactNode;
};

const UserProvider = ({ children }: UserProviderProps): ReactElement => {
	const userId = useReactiveValue(getUserId);
	const user = useReactiveValue(getUser);
	const [userLanguage, setUserLanguage] = useLocalStorage('userLanguage', '');
	const [preferedLanguage, setPreferedLanguage] = useLocalStorage('preferedLanguage', '');

	const setUserPreferences = useEndpoint('POST', '/v1/users.setPreferences');

	const createFontStyleElement = useCreateFontStyleElement();
	createFontStyleElement(user?.settings?.preferences?.fontSize);

	useEmailVerificationWarning(user ?? undefined);
	useClearRemovedRoomsHistory(userId);

	useDeleteUser();
	useUpdateAvatar();

	const contextValue = useMemo(
		(): ContextType<typeof UserContext> => ({
			userId,
			user,
			queryPreference: createReactiveSubscriptionFactory(
				<T,>(key: string, defaultValue?: T) => getUserPreference(userId, key, defaultValue) as T,
			),
			querySubscription: createReactiveSubscriptionFactory<ISubscription | undefined>((query, fields, sort) =>
				Subscriptions.findOne(query, { fields, sort }),
			),
			queryRoom: createReactiveSubscriptionFactory<IRoom | undefined>((query, fields) => ChatRoom.findOne(query, { fields })),
			querySubscriptions: createReactiveSubscriptionFactory<SubscriptionWithRoom[]>((query, options) => {
				if (userId) {
					return Subscriptions.find(query, options).fetch();
				}

				return ChatRoom.find(query, options).fetch();
			}),
			logout,
		}),
		[userId, user],
	);

	useEffect(() => {
		if (!!userId && preferedLanguage !== userLanguage) {
			setUserPreferences({ data: { language: preferedLanguage } });
			setUserLanguage(preferedLanguage);
		}

		if (user?.language !== undefined && user.language !== userLanguage) {
			setUserLanguage(user.language);
			setPreferedLanguage(user.language);
		}
	}, [preferedLanguage, setPreferedLanguage, setUserLanguage, user?.language, userLanguage, userId, setUserPreferences]);

	return <UserContext.Provider children={children} value={contextValue} />;
};

export default UserProvider;
