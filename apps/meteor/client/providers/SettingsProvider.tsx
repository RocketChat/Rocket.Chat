import type { ISetting } from '@rocket.chat/core-typings';
import type { SettingsContextValue } from '@rocket.chat/ui-contexts';
import { SettingsContext, useAtLeastOnePermission, useMethod } from '@rocket.chat/ui-contexts';
import { Tracker } from 'meteor/tracker';
import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { createReactiveSubscriptionFactory } from '../lib/createReactiveSubscriptionFactory';
import { queryClient } from '../lib/queryClient';
import { PrivateSettingsCachedCollection } from '../lib/settings/PrivateSettingsCachedCollection';
import { PublicSettingsCachedCollection } from '../lib/settings/PublicSettingsCachedCollection';

type SettingsProviderProps = {
	readonly privileged?: boolean;
};

const SettingsProvider: FunctionComponent<SettingsProviderProps> = ({ children, privileged = false }) => {
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

	const settingsChangeCallback = (changes: { _id: string }[]): void => {
		changes.forEach((val) => {
			switch (val._id) {
				case 'Enterprise_License':
					queryClient.invalidateQueries(['licenses']);
					break;

				default:
					break;
			}
		});
	};

	const saveSettings = useMethod('saveSettings');
	const dispatch = useCallback(
		async (changes) => {
			settingsChangeCallback(changes);
			await saveSettings(changes);
		},
		[saveSettings],
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
