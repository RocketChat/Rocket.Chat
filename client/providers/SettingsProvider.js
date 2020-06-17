import { Tracker } from 'meteor/tracker';
import React, { useCallback, useMemo, useState, useEffect } from 'react';

import { useMethod } from '../contexts/ServerContext';
import { SettingsContext } from '../contexts/SettingsContext';
import { useReactiveSubscriptionFactory } from '../hooks/useReactiveSubscriptionFactory';
import { PublicSettingsCachedCollection } from '../lib/settings/PublicSettingsCachedCollection';

function SettingsProvider({ children, cachedCollection = PublicSettingsCachedCollection.get() }) {
	const [isLoading, setLoading] = useState(() => Tracker.nonreactive(() => !cachedCollection.ready.get()));

	useEffect(() => {
		let mounted = true;

		const initialize = async () => {
			if (!Tracker.nonreactive(() => cachedCollection.ready.get())) {
				await cachedCollection.init();
			}

			if (!mounted) {
				return;
			}

			setLoading(false);
		};

		initialize();

		return () => {
			mounted = false;
		};
	}, [cachedCollection]);

	const querySetting = useReactiveSubscriptionFactory(
		useCallback(
			(_id) => ({ ...cachedCollection.collection.findOne(_id) }),
			[cachedCollection],
		),
	);

	const querySettings = useReactiveSubscriptionFactory(
		useCallback(
			({ _id, group, section } = {}) => cachedCollection.collection.find({
				..._id && { _id: { $in: _id } },
				...group && { group },
				...section
					? { section }
					: {
						$or: [
							{ section: { $exists: false } },
							{ section: null },
						],
					},
			}, {
				sort: {
					section: 1,
					sorter: 1,
					i18nLabel: 1,
				},
			}).fetch(),
			[cachedCollection],
		),
	);

	const saveSettings = useMethod('saveSettings');
	const dispatch = useCallback((changes) => saveSettings(changes), [saveSettings]);

	const contextValue = useMemo(() => ({
		isLoading,
		querySetting,
		querySettings,
		dispatch,
	}), [
		isLoading,
		querySetting,
		querySettings,
		dispatch,
	]);

	return <SettingsContext.Provider children={children} value={contextValue} />;
}

export default SettingsProvider;
