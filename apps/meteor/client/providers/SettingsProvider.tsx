import type { ISetting } from '@rocket.chat/core-typings';
import { isSettingCode } from '@rocket.chat/core-typings';
import { createPredicateFromFilter } from '@rocket.chat/mongo-adapter';
import { isTruthy } from '@rocket.chat/tools';
import type { SettingsContextQuery, SettingsContextValue } from '@rocket.chat/ui-contexts';
import { SettingsContext, useAtLeastOnePermission, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useCallback, useMemo } from 'react';

import { LoggedSettingsCachedStore, PublicSettingsCachedStore, PrivateSettingsCachedStore } from '../cachedStores';
import { useShowSettingAlerts } from '../hooks/useShowSettingAlerts';
import { PrivateCachedStore } from '../lib/cachedStores/CachedStore';
import { applyQueryOptions } from '../lib/cachedStores/applyQueryOptions';
import { getCodeSettingError } from '../lib/utils/getCodeSettingError';

const settingsManagementPermissions = ['view-privileged-setting', 'edit-privileged-setting', 'manage-selected-settings'];

export type SettingsProviderProps = {
	children?: ReactNode;
};

const SettingsProvider = ({ children }: SettingsProviderProps) => {
	const canManageSettings = useAtLeastOnePermission(settingsManagementPermissions);

	const cachedCollection = canManageSettings ? PrivateSettingsCachedStore : PublicSettingsCachedStore;

	const isLoading = !cachedCollection.useReady();

	if (isLoading) {
		throw (async () => {
			if (cachedCollection instanceof PrivateCachedStore) {
				cachedCollection.listen();
			}

			await cachedCollection.init();
		})();
	}

	const settingsStores = useMemo(
		() =>
			cachedCollection === PublicSettingsCachedStore
				? [LoggedSettingsCachedStore.store, cachedCollection.store]
				: [cachedCollection.store, LoggedSettingsCachedStore.store],
		[cachedCollection],
	);

	const querySetting = useMemo(
		() =>
			(_id: ISetting['_id']): [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => ISetting | undefined] => {
				const getSetting = () => settingsStores.map((store) => store.getState().get(_id)).find(isTruthy);

				let snapshot = getSetting();

				const subscribe = (onStoreChange: () => void) => {
					const unsubscribers = settingsStores.map((store) =>
						store.subscribe(() => {
							const newSnapshot = getSetting();
							if (newSnapshot === snapshot) return;
							snapshot = newSnapshot;
							onStoreChange();
						}),
					);

					return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
				};

				const getSnapshot = () => snapshot;

				return [subscribe, getSnapshot];
			},
		[settingsStores],
	);

	const querySettings = useMemo(() => {
		return (query: SettingsContextQuery): [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => ISetting[]] => {
			const effectiveQuery = {
				...('_id' in query && Array.isArray(query._id) && { _id: { $in: query._id } }),
				...('_id' in query && !Array.isArray(query._id) && { _id: query._id }),
				...('group' in query && { group: query.group }),
				...('section' in query &&
					(query.section
						? { section: query.section }
						: {
								$or: [{ section: { $exists: false } }, { section: undefined }],
							})),
			};

			const options = {
				sort: {
					section: 1,
					sorter: 1,
					i18nLabel: 1,
				},
				...('skip' in query && typeof query.skip === 'number' && { skip: query.skip }),
				...('limit' in query && typeof query.limit === 'number' && { limit: query.limit }),
			} as const;

			const predicate = createPredicateFromFilter<ISetting>(effectiveQuery);
			const getSettings = () =>
				applyQueryOptions(
					[
						...new Map(
							settingsStores
								.flatMap((store) => store.getState().filter(predicate))
								.reverse()
								.map((setting) => [setting._id, setting]),
						).values(),
					],
					options,
				);

			let snapshot = getSettings();

			const subscribe = (onStoreChange: () => void) => {
				const unsubscribers = settingsStores.map((store) =>
					store.subscribe(() => {
						const newSnapshot = getSettings();
						if (newSnapshot === snapshot) return;
						snapshot = newSnapshot;
						onStoreChange();
					}),
				);

				return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
			};

			const getSnapshot = () => snapshot;

			return [subscribe, getSnapshot];
		};
	}, [settingsStores]);

	const queryClient = useQueryClient();

	const showAlerts = useShowSettingAlerts();

	const saveSettings = useEndpoint('POST', '/v1/settings');
	const dispatch = useCallback(
		async (changes: Partial<ISetting>[], onSaved?: () => void) => {
			const changedSettingIds = changes.map((s) => s._id).filter(isTruthy);
			const alerts = cachedCollection.store
				.getState()
				.filter((setting) => Boolean(setting.alert && changedSettingIds.includes(setting._id)));
			// FIXME: This is a temporary solution to invalidate queries when settings change
			changes.forEach((val) => {
				if (val._id === 'Enterprise_License') {
					queryClient.invalidateQueries({ queryKey: ['licenses'] });
				}
			});

			const hasInvalidCodeSetting = changes.some((change) => {
				if (!change._id || change.value === undefined) {
					return false;
				}
				const setting = cachedCollection.store.getState().get(change._id);
				return setting !== undefined && isSettingCode(setting) && getCodeSettingError(setting.code, change.value) !== undefined;
			});

			if (hasInvalidCodeSetting) {
				return;
			}

			if (alerts.length) {
				const accepted = await showAlerts(alerts);

				if (!accepted) {
					return;
				}
			}

			await saveSettings({ settings: changes as Pick<ISetting, '_id' | 'value'>[] });

			onSaved?.();
		},
		[queryClient, saveSettings, showAlerts, cachedCollection.store],
	);

	const contextValue = useMemo<SettingsContextValue>(
		() => ({
			hasPrivateAccess: canManageSettings,
			querySetting,
			querySettings,
			dispatch,
		}),
		[canManageSettings, querySetting, querySettings, dispatch],
	);

	return <SettingsContext.Provider value={contextValue}>{children}</SettingsContext.Provider>;
};

export default SettingsProvider;
