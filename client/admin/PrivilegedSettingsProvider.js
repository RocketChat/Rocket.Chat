import { useLazyRef, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { Mongo } from 'meteor/mongo';
import { Tracker } from 'meteor/tracker';
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';

import { PrivilegedSettingsContext } from '../contexts/PrivilegedSettingsContext';
import { useAtLeastOnePermission } from '../contexts/AuthorizationContext';
import { PrivateSettingsCachedCollection } from './PrivateSettingsCachedCollection';

const compareSettings = (a, b) =>
	(a.section ?? '').localeCompare(b.section ?? '')
	|| (a.sorter ?? 0 - b.sorter ?? 0)
	|| (a.i18nLabel ?? '').localeCompare(b.i18nLabel ?? '');

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
	const [isLoading, setLoading] = useState(() => Tracker.nonreactive(() => !cachedCollection.ready.get()));
	const persistedSettingsRef = useLazyRef(() => new Map());
	const subscribersRef = useLazyRef(() => new Set());

	useEffect(() => {
		const { current: persistedSettings } = persistedSettingsRef;
		const { current: subscribers } = subscribersRef;

		let mounted = true;
		let observer;

		const initialize = async () => {
			if (!Tracker.nonreactive(() => cachedCollection.ready.get())) {
				await cachedCollection.init();
			}

			if (!mounted) {
				return;
			}

			const query = cachedCollection.collection.find();

			const observerConfig = {}; // avoid some `added` callback triggers after the first fetch
			observer = query.observe(observerConfig);

			Tracker.nonreactive(() => query.fetch()).forEach((setting) => {
				persistedSettings.set(setting._id, setting);
			});

			observerConfig.added = (setting) => {
				persistedSettings.set(setting._id, setting);
			};
			observerConfig.changed = (setting) => {
				persistedSettings.set(setting._id, setting);
			};
			observerConfig.removed = (setting) => {
				persistedSettings.delete(setting._id);
			};

			setLoading(false);

			subscribers.forEach((subscriber) => {
				subscriber();
			});
		};

		initialize();

		return () => {
			mounted = false;
			if (observer) {
				observer.stop();
			}
		};
	}, [cachedCollection]);

	const settingsRef = useLazyRef(() => new Map());

	const dispatch = useMutableCallback((action) => {
		const {
			persistedSettings,
			settings,
		} = settingsReducer({
			persistedSettings: Array.from(persistedSettingsRef.current.values()),
			settings: Array.from(settingsRef.current.values()),
		}, action);

		persistedSettings.forEach((setting) => {
			persistedSettingsRef.current.set(setting._id, setting);
		});

		settings.forEach((setting) => {
			settingsRef.current.set(setting._id, setting);
		});

		subscribersRef.current.forEach((subscriber) => {
			subscriber();
		});
	});

	subscribersRef.current.forEach((subscriber) => {
		subscriber();
	});

	const collectionsRef = useRef({});

	useEffect(() => {
		const settingsCollection = new Mongo.Collection(null);

		collectionsRef.current = {
			persistedSettingsCollection: cachedCollection.collection,
			settingsCollection,
		};
	}, [cachedCollection]);

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
				}, 300);
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
		// updateTimers[_id] = setTimeout(() => {
		settingsCollection.update(_id, { $set: data });
		// }, 70);
	});

	const hydrate = useMutableCallback((changes) => {
		changes.forEach(updateAtCollection);
		dispatch({ type: 'hydrate', payload: changes });
		Tracker.flush();
	});

	const findSettingsSection = useMutableCallback((groupId, sectionName) => {
		const editableSettings = collectionsRef.current.settingsCollection.find({
			group: groupId,
			...sectionName
				? { section: sectionName }
				: {
					$or: [
						{ section: { $exists: false } },
						{ section: null },
					],
				},
		}, {
			sort: {
				sorter: 1,
				i18nLabel: 1,
			},
		}).fetch();

		return {
			name: sectionName,
			editableSettings,
			settings: editableSettings.map(({ _id }) => _id),
			changed: editableSettings.some(({ changed }) => changed),
			canReset: editableSettings.some(({ value, packageValue }) => JSON.stringify(value) !== JSON.stringify(packageValue)),
		};
	});

	const getSettingsSection = useMutableCallback((groupId, sectionName) =>
		Tracker.nonreactive(() => findSettingsSection(groupId, sectionName)));

	const subscribeToSettingsSection = useMutableCallback((groupId, sectionName, callback) => {
		const computation = Tracker.autorun(() => {
			callback(findSettingsSection(groupId, sectionName));
		});

		return () => {
			computation.stop();
		};
	});

	const findSetting = useCallback((_id) => cachedCollection.collection.findOne(_id), [cachedCollection]);

	const getSetting = useCallback((_id) =>
		Tracker.nonreactive(() => findSetting(_id)), [findSetting]);

	const subscribeToSetting = useCallback((_id, callback) => {
		const computation = Tracker.autorun(() => {
			callback(findSetting(_id));
		});

		return () => {
			computation.stop();
		};
	}, [findSetting]);

	const isDisabled = useMutableCallback(({ blocked, enableQuery }) => {
		if (blocked) {
			return true;
		}

		if (!enableQuery) {
			return false;
		}

		const queries = [].concat(typeof enableQuery === 'string' ? JSON.parse(enableQuery) : enableQuery);
		return !queries.every((query) => collectionsRef.current.settingsCollection.find(query).count() > 0);
	});

	const findEditableSetting = (_id) => {
		const editableSetting = collectionsRef.current.settingsCollection.findOne(_id);
		editableSetting.disabled = isDisabled(editableSetting);
		return editableSetting;
	};

	const getEditableSetting = useMutableCallback((_id) =>
		Tracker.nonreactive(() => findEditableSetting(_id)));

	const subscribeToEditableSetting = useMutableCallback((_id, cb) => {
		const computation = Tracker.autorun(() => {
			cb(findEditableSetting(_id));
		});

		return () => {
			computation.stop();
		};
	});

	const contextValue = useMemo(() => ({
		authorized: true,
		loading: isLoading,
		persistedSettings: persistedSettingsRef.current,
		settings: settingsRef.current,
		subscribers: subscribersRef.current,
		hydrate,
		isDisabled,
		getSettingsSection,
		subscribeToSettingsSection,
		getSetting,
		subscribeToSetting,
		getEditableSetting,
		subscribeToEditableSetting,
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
