import type { IRoom } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { createPredicateFromFilter } from '@rocket.chat/mongo-adapter';
import type { FindOptions, SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { UserContext, useRouteParameter, useSearchParameter } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { Meteor } from 'meteor/meteor';
import type { Filter, ObjectId } from 'mongodb';
import type { ContextType, ReactNode } from 'react';
import { useEffect, useMemo, useRef } from 'react';
import type { StoreApi, UseBoundStore } from 'zustand';

import { useClearRemovedRoomsHistory } from './hooks/useClearRemovedRoomsHistory';
import { useDeleteUser } from './hooks/useDeleteUser';
import { useEmailVerificationWarning } from './hooks/useEmailVerificationWarning';
import { useReloadAfterLogin } from './hooks/useReloadAfterLogin';
import { useUpdateAvatar } from './hooks/useUpdateAvatar';
import { sdk } from '../../../app/utils/client/lib/SDKClient';
import { useIdleConnection } from '../../hooks/useIdleConnection';
import type { IDocumentMapStore } from '../../lib/cachedStores/DocumentMapStore';
import { applyQueryOptions } from '../../lib/cachedStores/applyQueryOptions';
import { getDdpSdk } from '../../lib/sdk/ddpSdk';
import { settings } from '../../lib/settings';
import { userIdStore } from '../../lib/user';
import { Users, Rooms, Subscriptions } from '../../stores';
import { useSamlInviteToken } from '../../views/invite/hooks/useSamlInviteToken';

type UserProviderProps = {
	children: ReactNode;
};

const ee = new Emitter();
getDdpSdk().account.onLogout(() => ee.emit('logout'));

ee.on('logout', async () => {
	const userId = userIdStore.getState();
	if (!userId) return;
	const user = Users.state.get(userId);
	if (!user) return;

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

const UserProvider = ({ children }: UserProviderProps) => {
	const userId = userIdStore();

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
			queryPreference: <T,>(
				key: string | ObjectId,
				defaultValue?: T,
			): [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => T | undefined] => {
				const effectiveKey = String(key);

				const subscribe = (onStoreChange: () => void): (() => void) => {
					const unsubUsers = Users.use.subscribe(onStoreChange);
					const unsubSettings = settings.observe(`Accounts_Default_User_Preferences_${effectiveKey}`, onStoreChange);
					return () => {
						unsubUsers();
						unsubSettings();
					};
				};

				const getSnapshot = (): T | undefined => {
					return (
						(user?.settings?.preferences?.[effectiveKey] as T | undefined) ??
						defaultValue ??
						settings.peek(`Accounts_Default_User_Preferences_${effectiveKey}`)
					);
				};
				return [subscribe, getSnapshot];
			},
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

	// Mirror local preference changes into the live userLanguage state without hitting the server.
	useEffect(() => {
		if (preferedLanguage === userLanguage) {
			return;
		}

		setUserLanguage(preferedLanguage);
	}, [preferedLanguage, setUserLanguage, userLanguage]);

	// When the server reports a new language, overwrite both storage keys so every tab stays aligned.
	useEffect(() => {
		if (user?.language !== undefined && user.language !== userLanguage) {
			setUserLanguage(user.language);
			setPreferedLanguage(user.language);
		}
	}, [setPreferedLanguage, setUserLanguage, user?.language, userLanguage]);

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

	return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>;
};

export default UserProvider;
