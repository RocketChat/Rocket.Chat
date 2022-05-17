import { SettingsContext, SettingsContextValue, useAtLeastOnePermission, useMethod } from '@rocket.chat/ui-contexts';
import { Tracker } from 'meteor/tracker';
import React, { useCallback, useEffect, useMemo, useState, FunctionComponent } from 'react';

import { PrivateSettingsCachedCollection } from '../lib/settings/PrivateSettingsCachedCollection';
import { PublicSettingsCachedCollection } from '../lib/settings/PublicSettingsCachedCollection';
import { createReactiveSubscriptionFactory } from './createReactiveSubscriptionFactory';

type SettingsProviderProps = {
	readonly privileged?: boolean;
};

const SettingsProvider: FunctionComponent<SettingsProviderProps> = ({ children, privileged = false }) => {
	const hasPrivilegedPermission = useAtLeastOnePermission(
		useMemo(() => ['view-privileged-setting', 'edit-privileged-setting', 'manage-selected-settings'], []),
	);

	const hasPrivateAccess = privileged && hasPrivilegedPermission;

	const cachedCollection = useMemo(
		() => (hasPrivateAccess ? PrivateSettingsCachedCollection.get() : PublicSettingsCachedCollection.get()),
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
		() => createReactiveSubscriptionFactory((_id) => ({ ...cachedCollection.collection.findOne(_id) })),
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
											$or: [{ section: { $exists: false } }, { section: null }],
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

	const saveSettings = useMethod('saveSettings');
	const dispatch = useCallback(
		async (changes) => {
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
