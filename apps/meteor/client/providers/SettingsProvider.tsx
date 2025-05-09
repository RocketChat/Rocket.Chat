import type { ISetting } from '@rocket.chat/core-typings';
import type { SettingsContextValue } from '@rocket.chat/ui-contexts';
import { SettingsContext, useAtLeastOnePermission, useMethod } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { Tracker } from 'meteor/tracker';
import type { ReactNode } from 'react';
import { useCallback, useMemo } from 'react';

import { createReactiveSubscriptionFactory } from '../lib/createReactiveSubscriptionFactory';
import { PrivateSettingsCachedCollection } from '../lib/settings/PrivateSettingsCachedCollection';
import { PublicSettingsCachedCollection } from '../lib/settings/PublicSettingsCachedCollection';

const settingsManagementPermissions = ['view-privileged-setting', 'edit-privileged-setting', 'manage-selected-settings'];

type SettingsProviderProps = {
	children?: ReactNode;
};

const SettingsProvider = ({ children }: SettingsProviderProps) => {
	const canManageSettings = useAtLeastOnePermission(settingsManagementPermissions);

	const cachedCollection = canManageSettings ? PrivateSettingsCachedCollection : PublicSettingsCachedCollection;

	const isLoading = Tracker.nonreactive(() => !cachedCollection.ready.get());

	if (isLoading) {
		throw (async () => {
			await cachedCollection.init();
		})();
	}

	const querySetting = useMemo(
		() =>
			createReactiveSubscriptionFactory((_id): ISetting | undefined => {
				const subscription = cachedCollection.collection.findOne(_id);
				return subscription ? { ...subscription } : undefined;
			}),
		[cachedCollection],
	);

	const querySettings = useMemo(
		() =>
			createReactiveSubscriptionFactory((query = {}) =>
				cachedCollection.collection
					.find(
						{
							...('_id' in query && Array.isArray(query._id) && { _id: { $in: query._id } }),
							...('_id' in query && !Array.isArray(query._id) && { _id: query._id }),
							...('group' in query && { group: query.group }),
							...('section' in query &&
								(query.section
									? { section: query.section }
									: {
											$or: [{ section: { $exists: false } }, { section: undefined }],
										})),
						},
						{
							sort: {
								section: 1,
								sorter: 1,
								i18nLabel: 1,
							},
							...('skip' in query && typeof query.skip === 'number' && { skip: query.skip }),
							...('limit' in query && typeof query.limit === 'number' && { limit: query.limit }),
						},
					)
					.fetch(),
			),
		[cachedCollection],
	);

	const queryClient = useQueryClient();

	const saveSettings = useMethod('saveSettings');
	const dispatch = useCallback(
		async (changes: Partial<ISetting>[]) => {
			// FIXME: This is a temporary solution to invalidate queries when settings change
			changes.forEach((val) => {
				if (val._id === 'Enterprise_License') {
					queryClient.invalidateQueries({ queryKey: ['licenses'] });
				}
			});

			await saveSettings(changes as Pick<ISetting, '_id' | 'value'>[]);
		},
		[queryClient, saveSettings],
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

	return <SettingsContext.Provider children={children} value={contextValue} />;
};

export default SettingsProvider;
