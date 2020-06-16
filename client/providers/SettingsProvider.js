import React, { useCallback, useMemo } from 'react';

import { settings } from '../../app/settings/client';
import { SettingsContext } from '../contexts/SettingsContext';
import { useReactiveSubscriptionFactory } from '../hooks/useReactiveSubscriptionFactory';
import { PublicSettingsCachedCollection } from '../lib/settings/PublicSettingsCachedCollection';
import { createObservableFromReactive } from './createObservableFromReactive';

function SettingsProvider({ children, cachedCollection = PublicSettingsCachedCollection.get() }) {
	const querySetting = useReactiveSubscriptionFactory(
		useCallback(
			(_id) => ({ ...cachedCollection.collection.findOne(_id) }),
			[cachedCollection],
		),
	);

	const contextValue = useMemo(() => ({
		querySetting,
		get: createObservableFromReactive((name) => settings.get(name)),
		set: (name, value) => new Promise((resolve, reject) => {
			settings.set(name, value, (error, result) => {
				if (error) {
					reject(error);
					return;
				}

				resolve(result);
			});
		}),
		batchSet: (entries) => new Promise((resolve, reject) => {
			settings.batchSet(entries, (error, result) => {
				if (error) {
					reject(error);
					return;
				}

				resolve(result);
			});
		}),
	}), [querySetting]);

	return <SettingsContext.Provider children={children} value={contextValue} />;
}

export default SettingsProvider;
