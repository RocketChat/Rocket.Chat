import type { ISetting } from '@rocket.chat/core-typings';
import { createPredicateFromFilter } from '@rocket.chat/mongo-adapter';
import { isTruthy } from '@rocket.chat/tools';
import type { SettingsContextQuery, SettingsContextValue } from '@rocket.chat/ui-contexts';
import { SettingsContext, useAtLeastOnePermission, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useCallback, useMemo } from 'react';

import { PublicSettingsCachedStore, PrivateSettingsCachedStore } from '../cachedStores';
import { useShowSettingAlerts } from '../hooks/useShowSettingAlerts';
import { PrivateCachedStore } from '../lib/cachedStores/CachedStore';
import { applyQueryOptions } from '../lib/cachedStores/applyQueryOptions';

const settingsManagementPermissions = ['view-privileged-setting', 'edit-privileged-setting', 'manage-selected-settings'];

type SettingsProviderProps = {
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

	const querySetting = useMemo(
		() =>
			(_id: ISetting['_id']): [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => ISetting | undefined] => {
				let snapshot = cachedCollection.store.getState().get(_id);

				const subscribe = (onStoreChange: () => void) =>
					cachedCollection.store.subscribe(() => {
						const newSnapshot = cachedCollection.store.getState().get(_id);
						if (newSnapshot === snapshot) return;
						snapshot = newSnapshot;
						onStoreChange();
					});

				const getSnapshot = () => snapshot;

				return [subscribe, getSnapshot];
			},
		[cachedCollection.store],
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
			let snapshot = applyQueryOptions(cachedCollection.store.getState().filter(predicate), options);

			const subscribe = (onStoreChange: () => void) =>
				cachedCollection.store.subscribe(() => {
					const newSnapshot = applyQueryOptions(cachedCollection.store.getState().filter(predicate), options);
					if (newSnapshot === snapshot) return;
					snapshot = newSnapshot;
					onStoreChange();
				});

			const getSnapshot = () => snapshot;

			return [subscribe, getSnapshot];
		};
	}, [cachedCollection.store]);

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
