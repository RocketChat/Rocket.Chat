import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { createPredicateFromFilter } from '@rocket.chat/mongo-adapter';
import type { FindOptions, SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { UserContext, useEndpoint, useRouteParameter, useSearchParameter } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import type { Filter } from 'mongodb';
import type { ContextType, ReactElement, ReactNode } from 'react';
import { useEffect, useMemo, useRef } from 'react';
import type { StoreApi, UseBoundStore } from 'zustand';

import { useClearRemovedRoomsHistory } from './hooks/useClearRemovedRoomsHistory';
import { useDeleteUser } from './hooks/useDeleteUser';
import { useEmailVerificationWarning } from './hooks/useEmailVerificationWarning';
import { useReloadAfterLogin } from './hooks/useReloadAfterLogin';
import { useUpdateAvatar } from './hooks/useUpdateAvatar';
import { Subscriptions, Rooms, Users } from '../../../app/models/client';
import { getUserPreference } from '../../../app/utils/client';
import { sdk } from '../../../app/utils/client/lib/SDKClient';
import { afterLogoutCleanUpCallback } from '../../../lib/callbacks/afterLogoutCleanUpCallback';
import { useIdleConnection } from '../../hooks/useIdleConnection';
import { useReactiveValue } from '../../hooks/useReactiveValue';
import { applyQueryOptions } from '../../lib/cachedCollections';
import type { IDocumentMapStore } from '../../lib/cachedCollections/DocumentMapStore';
import { createReactiveSubscriptionFactory } from '../../lib/createReactiveSubscriptionFactory';
import { useSamlInviteToken } from '../../views/invite/hooks/useSamlInviteToken';

const getUser = (): IUser | null => Meteor.user() as IUser | null;

const getUserId = (): string | null => Meteor.userId();

type UserProviderProps = {
	children: ReactNode;
};

const ee = new Emitter();
Accounts.onLogout(() => ee.emit('logout'));

ee.on('logout', async () => {
	const user = getUser();

	if (!user) {
		return;
	}
	await afterLogoutCleanUpCallback.run(user);
	await sdk.call('logoutCleanUp', user);
});

const queryRoom = (
	query: Filter<Pick<IRoom, '_id'>>,
): [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => IRoom | undefined] => {
	const predicate = createPredicateFromFilter(query);
	let snapshot = Rooms.state.find(predicate);

	const subscribe = (onStoreChange: () => void) =>
		Rooms.use.subscribe(() => {
			const newSnapshot = Rooms.state.find(predicate);
			if (newSnapshot === snapshot) return;
			snapshot = newSnapshot;
			onStoreChange();
		});

	const getSnapshot = () => snapshot;

	return [subscribe, getSnapshot];
};

const UserProvider = ({ children }: UserProviderProps): ReactElement => {
	const userId = useReactiveValue(getUserId);
	const user = Users.use((state) => {
		if (!userId) return null;
		return state.get(userId) ?? null;
	});
	const previousUserId = useRef(userId);
	const [userLanguage, setUserLanguage] = useLocalStorage('userLanguage', '');
	const [preferedLanguage, setPreferedLanguage] = useLocalStorage('preferedLanguage', '');
	const [, setSamlInviteToken] = useSamlInviteToken();
	const samlCredentialToken = useSearchParameter('saml_idp_credentialToken');
	const inviteTokenHash = useRouteParameter('hash');

	const setUserPreferences = useEndpoint('POST', '/v1/users.setPreferences');

	useEmailVerificationWarning(user ?? undefined);
	useClearRemovedRoomsHistory(userId);

	useDeleteUser();
	useUpdateAvatar();
	useIdleConnection(userId);
	useReloadAfterLogin(user);

	const querySubscriptions = useMemo(() => {
		const createSubscriptionFactory =
			<T extends SubscriptionWithRoom | IRoom>(store: UseBoundStore<StoreApi<IDocumentMapStore<T>>>) =>
			(
				query: object,
				options: FindOptions = {},
			): [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => SubscriptionWithRoom[]] => {
				const predicate = createPredicateFromFilter<T>(query);
				let snapshot = applyQueryOptions(store.getState().filter(predicate), options);

				const subscribe = (onStoreChange: () => void) =>
					store.subscribe(() => {
						const newSnapshot = applyQueryOptions(store.getState().filter(predicate), options);
						if (newSnapshot === snapshot) return;
						snapshot = newSnapshot;
						onStoreChange();
					});

				// TODO: this type assertion is completely wrong; however, the `useUserSubscriptions` hook might be deleted in
				// the future, so we can live with it for now
				const getSnapshot = () => snapshot as SubscriptionWithRoom[];

				return [subscribe, getSnapshot];
			};

		return userId ? createSubscriptionFactory(Subscriptions.use) : createSubscriptionFactory(Rooms.use);
	}, [userId]);

	const querySubscription = useMemo(() => {
		return (query: object): [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => SubscriptionWithRoom] => {
			const predicate = createPredicateFromFilter<SubscriptionWithRoom>(query);
			let snapshot = Subscriptions.use.getState().find(predicate);

			const subscribe = (onStoreChange: () => void) =>
				Subscriptions.use.subscribe(() => {
					const newSnapshot = Subscriptions.use.getState().find(predicate);
					if (newSnapshot === snapshot) return;
					snapshot = newSnapshot;
					onStoreChange();
				});

			// TODO: this type assertion is completely wrong; however, the `useUserSubscriptions` hook might be deleted in
			// the future, so we can live with it for now
			const getSnapshot = () => snapshot as SubscriptionWithRoom;

			return [subscribe, getSnapshot];
		};
	}, []);

	const contextValue = useMemo(
		(): ContextType<typeof UserContext> => ({
			userId,
			user,
			queryPreference: createReactiveSubscriptionFactory(
				<T,>(key: string, defaultValue?: T) => getUserPreference(userId, key, defaultValue) as T,
			),
			querySubscription,
			queryRoom,
			querySubscriptions,
			logout: async () => Meteor.logout(),
			onLogout: (cb) => {
				return ee.on('logout', cb);
			},
		}),
		[userId, user, querySubscription, querySubscriptions],
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

	useEffect(() => {
		if (!samlCredentialToken && !inviteTokenHash) {
			setSamlInviteToken(null);
		}
	}, [inviteTokenHash, samlCredentialToken, setSamlInviteToken]);

	const queryClient = useQueryClient();

	useEffect(() => {
		if (previousUserId.current && previousUserId.current !== userId) {
			queryClient.clear();
		}

		previousUserId.current = userId;
	}, [queryClient, userId]);

	return <UserContext.Provider children={children} value={contextValue} />;
};

export default UserProvider;
