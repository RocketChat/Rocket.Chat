import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { Mongo } from 'meteor/mongo';
import { Tracker } from 'meteor/tracker';
import React, { useEffect, useMemo, useReducer, useRef, useState } from 'react';

import { PrivilegedSettingsContext } from '../contexts/PrivilegedSettingsContext';
import { useAtLeastOnePermission } from '../contexts/AuthorizationContext';
import { PrivateSettingsCachedCollection } from './PrivateSettingsCachedCollection';

const compareStrings = (a = '', b = '') => {
	if (a === b || (!a && !b)) {
		return 0;
	}

	return a > b ? 1 : -1;
};

const compareSettings = (a, b) =>
	compareStrings(a.section, b.section)
	|| compareStrings(a.sorter, b.sorter)
	|| compareStrings(a.i18nLabel, b.i18nLabel);

const settingsReducer = (states, { type, payload }) => {
	const {
		settings,
		persistedSettings,
	} = states;

	switch (type) {
		case 'add': {
			return {
				settings: [...settings, ...payload].sort(compareSettings),
				persistedSettings: [...persistedSettings, ...payload].sort(compareSettings),
			};
		}

		case 'change': {
			const mapping = (setting) => (setting._id !== payload._id ? setting : payload);

			return {
				settings: settings.map(mapping),
				persistedSettings: settings.map(mapping),
			};
		}

		case 'remove': {
			const mapping = (setting) => setting._id !== payload;

			return {
				settings: settings.filter(mapping),
				persistedSettings: persistedSettings.filter(mapping),
			};
		}

		case 'hydrate': {
			const map = {};
			payload.forEach((setting) => {
				map[setting._id] = setting;
			});

			const mapping = (setting) => (map[setting._id] ? { ...setting, ...map[setting._id] } : setting);

			return {
				settings: settings.map(mapping),
				persistedSettings,
			};
		}
	}

	return states;
};

function AuthorizedPrivilegedSettingsProvider({ cachedCollection, children }) {
	const [isLoading, setLoading] = useState(true);

	const subscribersRef = useRef();
	if (!subscribersRef.current) {
		subscribersRef.current = new Set();
	}

	const stateRef = useRef({ settings: [], persistedSettings: [] });

	const [state, dispatch] = useReducer(settingsReducer, { settings: [], persistedSettings: [] });
	stateRef.current = state;

	subscribersRef.current.forEach((subscriber) => {
		subscriber(state);
	});

	const collectionsRef = useRef({});

	useEffect(() => {
		const stopLoading = () => {
			setLoading(false);
		};

		if (!Tracker.nonreactive(() => cachedCollection.ready.get())) {
			cachedCollection.init().then(stopLoading, stopLoading);
		} else {
			stopLoading();
		}

		const { collection: persistedSettingsCollection } = cachedCollection;
		const settingsCollection = new Mongo.Collection(null);

		collectionsRef.current = {
			persistedSettingsCollection,
			settingsCollection,
		};
	}, [collectionsRef]);

	useEffect(() => {
		if (isLoading) {
			return;
		}

		const { current: { persistedSettingsCollection, settingsCollection } } = collectionsRef;

		const query = persistedSettingsCollection.find();

		const syncCollectionsHandle = query.observe({
			added: (data) => settingsCollection.insert(data),
			changed: (data) => settingsCollection.update(data._id, data),
			removed: ({ _id }) => settingsCollection.remove(_id),
		});

		const addedQueue = [];
		let addedActionTimer;

		const syncStateHandle = query.observe({
			added: (data) => {
				addedQueue.push(data);
				clearTimeout(addedActionTimer);
				addedActionTimer = setTimeout(() => {
					dispatch({ type: 'add', payload: addedQueue });
				}, 70);
			},
			changed: (data) => {
				dispatch({ type: 'change', payload: data });
			},
			removed: ({ _id }) => {
				dispatch({ type: 'remove', payload: _id });
			},
		});

		return () => {
			syncCollectionsHandle && syncCollectionsHandle.stop();
			syncStateHandle && syncStateHandle.stop();
			clearTimeout(addedActionTimer);
		};
	}, [isLoading, collectionsRef]);

	const updateTimersRef = useRef({});

	const updateAtCollection = useMutableCallback(({ _id, ...data }) => {
		const { current: { settingsCollection } } = collectionsRef;
		const { current: updateTimers } = updateTimersRef;
		clearTimeout(updateTimers[_id]);
		updateTimers[_id] = setTimeout(() => {
			settingsCollection.update(_id, { $set: data });
		}, 70);
	});

	const hydrate = useMutableCallback((changes) => {
		changes.forEach(updateAtCollection);
		dispatch({ type: 'hydrate', payload: changes });
	});

	const isDisabled = useMutableCallback(({ blocked, enableQuery }) => {
		if (blocked) {
			return true;
		}

		if (!enableQuery) {
			return false;
		}

		const { current: { settingsCollection } } = collectionsRef;

		const queries = [].concat(typeof enableQuery === 'string' ? JSON.parse(enableQuery) : enableQuery);
		return !queries.every((query) => !!settingsCollection.findOne(query));
	});

	const contextValue = useMemo(() => ({
		authorized: true,
		loading: isLoading,
		subscribers: subscribersRef.current,
		stateRef,
		hydrate,
		isDisabled,
	}), [
		isLoading,
		hydrate,
		isDisabled,
	]);

	return <PrivilegedSettingsContext.Provider children={children} value={contextValue} />;
}

function PrivilegedSettingsProvider({ children }) {
	const hasPermission = useAtLeastOnePermission([
		'view-privileged-setting',
		'edit-privileged-setting',
		'manage-selected-settings',
	]);

	if (!hasPermission) {
		return children;
	}

	return <AuthorizedPrivilegedSettingsProvider
		cachedCollection={PrivateSettingsCachedCollection.get()}
		children={children}
	/>;
}

export default PrivilegedSettingsProvider;
