import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { createPredicateFromFilter } from '@rocket.chat/mongo-adapter';
import type { FindOptions, SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { UserContext } from '@rocket.chat/ui-contexts';
import type { Filter, ObjectId } from 'mongodb';
import type { ContextType, ReactNode } from 'react';
import { useEffect, useMemo } from 'react';
import type { StoreApi, UseBoundStore } from 'zustand';

import type { IDocumentMapStore } from '../../lib/cachedStores/DocumentMapStore';
import { applyQueryOptions } from '../../lib/cachedStores/applyQueryOptions';
import { getDdpSdk } from '../../lib/sdk/ddpSdk';
import { settings } from '../../lib/settings';
import { userIdStore } from '../../lib/user';
import { logout } from '../../meteor/accounts';
import { Users, Rooms, Subscriptions } from '../../stores';

export type UserProviderProps = {
	children: ReactNode;
};

// Local logout broadcaster — `onLogout(cb)` consumers (e.g. e2ee cleanup) still
// subscribe to this. The post-logout side effects that used to require a
// `sdk.call('logoutCleanUp')` round-trip (afterLogoutCleanUpCallback +
// Apps.IPostUserLoggedOut) now fire server-side via `Accounts.onLogout` and
// `POST /v1/users.logout`, so this emitter is purely client-side fan-out.
const ee = new Emitter();
getDdpSdk().account.onLogout(() => ee.emit('logout'));

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

	const serverLanguage = Users.use((state) => (userId ? state.get(userId)?.language : undefined));
	const [, setUserLanguage] = useLocalStorage('userLanguage', '');
	const [, setPreferedLanguage] = useLocalStorage('preferedLanguage', '');

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

	const contextValue = useMemo((): ContextType<typeof UserContext> => {
		const getUser = (): IUser | null => (userId ? (Users.use.getState().get(userId) ?? null) : null);

		return {
			userId,
			queryUser: () => [Users.use.subscribe, getUser],
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
						(getUser()?.settings?.preferences?.[effectiveKey] as T | undefined) ??
						defaultValue ??
						settings.peek(`Accounts_Default_User_Preferences_${effectiveKey}`)
					);
				};
				return [subscribe, getSnapshot];
			},
			querySubscription,
			queryRoom,
			querySubscriptions,
			logout: async () => logout(),
			onLogout: (cb) => {
				return ee.on('logout', cb);
			},
		};
	}, [userId, querySubscription, querySubscriptions]);

	// When the server reports a language, overwrite both storage keys so every tab stays aligned.
	useEffect(() => {
		if (serverLanguage === undefined) {
			return;
		}

		setUserLanguage(serverLanguage);
		setPreferedLanguage(serverLanguage);
	}, [serverLanguage, setPreferedLanguage, setUserLanguage]);

	return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>;
};

export default UserProvider;
