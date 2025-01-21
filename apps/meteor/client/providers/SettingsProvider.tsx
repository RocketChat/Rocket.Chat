import type { ISetting } from '@rocket.chat/core-typings';
import type { SettingsContextValue } from '@rocket.chat/ui-contexts';
import { SettingsContext, useAtLeastOnePermission, useMethod } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { Tracker } from 'meteor/tracker';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { createReactiveSubscriptionFactory } from '../lib/createReactiveSubscriptionFactory';
import { PrivateSettingsCachedCollection } from '../lib/settings/PrivateSettingsCachedCollection';
import { PublicSettingsCachedCollection } from '../lib/settings/PublicSettingsCachedCollection';

type SettingsProviderProps = {
	children?: ReactNode;
	privileged?: boolean;
};

const SettingsProvider = ({ children, privileged = false }: SettingsProviderProps) => {
	const hasPrivilegedPermission = useAtLeastOnePermission(
		useMemo(() => ['view-privileged-setting', 'edit-privileged-setting', 'manage-selected-settings'], []),
	);

	const hasPrivateAccess = privileged && hasPrivilegedPermission;

	const cachedCollection = useMemo(
		() => (hasPrivateAccess ? PrivateSettingsCachedCollection : PublicSettingsCachedCollection),
		[hasPrivateAccess],
	);

	const [isLoading, setLoading] = useState(() => Tracker.nonreactive(() => !cachedCollection.ready.get()));

	useEffect(() => {
		let mounted = true;

		const initialize = async (): Promise<void> => {
			if (!Tracker.nonreactive(() => cachedCollection.ready.get())) {
				await cachedCollection.init();
			}

			if (!mounted) {
				return;
			}

			setLoading(false);
		};

		initialize();

		return (): void => {
			mounted = false;
		};
	}, [cachedCollection]);

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
			hasPrivateAccess,
			isLoading,
			querySetting,
			querySettings,
			dispatch,
		}),
		[hasPrivateAccess, isLoading, querySetting, querySettings, dispatch],
	);

	return <SettingsContext.Provider children={children} value={contextValue} />;
};

export default SettingsProvider;

// '[subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => {}]'
// '[subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => ISetting | undefined]'
