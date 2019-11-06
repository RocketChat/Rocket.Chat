import { Mongo } from 'meteor/mongo';
import mitt from 'mitt';
import React, { createContext, useCallback, useContext, useEffect, useReducer, useRef, useState, useMemo, useLayoutEffect } from 'react';

import { PrivateSettingsCachedCollection } from '../../../../app/ui-admin/client/SettingsCachedCollection';

const SettingsContext = createContext({});

let privateSettingsCachedCollection; // Remove this singleton (╯°□°)╯︵ ┻━┻

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

const stateReducer = (states, { type, payload }) => {
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

const useLazyRef = (fn) => {
	const [value] = useState(fn);
	return useRef(value);
};

export function SettingsState({ children }) {
	const [isLoading, setLoading] = useState(true);

	const persistedCollectionRef = useLazyRef(() => {
		if (!privateSettingsCachedCollection) {
			privateSettingsCachedCollection = new PrivateSettingsCachedCollection();

			const stopLoading = () => {
				setLoading(false);
			};

			privateSettingsCachedCollection.init().then(stopLoading, stopLoading);
		}

		return privateSettingsCachedCollection.collection;
	});

	const collectionRef = useLazyRef(() => new Mongo.Collection(null));

	const [{ settings, persistedSettings }, dispatch] = useReducer(stateReducer, { settings: [], persistedSettings: [] });

	useEffect(() => {
		if (isLoading) {
			return;
		}

		const { current: persistedCollection } = persistedCollectionRef;
		const { current: collection } = collectionRef;

		const addedQueue = [];
		let addedActionTimer;

		const added = (data) => {
			collection.insert(data);
			addedQueue.push(data);
			clearTimeout(addedActionTimer);
			addedActionTimer = setTimeout(() => {
				dispatch({ type: 'add', payload: addedQueue });
			}, 70);
		};

		const changed = (data) => {
			collection.update(data._id, data);
			dispatch({ type: 'change', payload: data });
		};

		const removed = ({ _id }) => {
			collection.remove(_id);
			dispatch({ type: 'remove', payload: _id });
		};

		const persistedFieldsQueryHandle = persistedCollection.find()
			.observe({
				added,
				changed,
				removed,
			});

		return () => {
			persistedFieldsQueryHandle.stop();
			clearTimeout(addedActionTimer);
		};
	}, [isLoading, persistedCollectionRef, collectionRef]);

	const updateTimersRef = useRef({});

	const updateAtCollection = useCallback(({ _id, ...data }) => {
		const { current: collection } = collectionRef;
		const { current: updateTimers } = updateTimersRef;
		clearTimeout(updateTimers[_id]);
		updateTimers[_id] = setTimeout(() => {
			collection.update(_id, { $set: data });
		}, 70);
	}, [collectionRef, updateTimersRef]);

	const hydrate = useCallback((changes) => {
		changes.forEach(updateAtCollection);
		dispatch({ type: 'hydrate', payload: changes });
	}, [updateAtCollection, dispatch]);

	const isDisabled = useCallback(({ blocked, enableQuery }) => {
		if (blocked) {
			return true;
		}

		if (!enableQuery) {
			return false;
		}

		const { current: collection } = collectionRef;

		const queries = [].concat(typeof enableQuery === 'string' ? JSON.parse(enableQuery) : enableQuery);
		return !queries.every((query) => !!collection.findOne(query));
	}, []);

	const persistedSettingsRef = useRef(persistedSettings);
	const settingsRef = useRef(settings);

	useEffect(() => {
		persistedSettingsRef.current = persistedSettings;
		settingsRef.current = settings;
	}, [persistedSettings, settings]);

	const [emitter] = useState(() => mitt());
	const stateRef = useRef({ settings, persistedSettings });

	useLayoutEffect(() => {
		stateRef.current = { settings, persistedSettings };
		emitter.emit('update', {
			settings,
			persistedSettings,
		});
	});

	const contextValue = useMemo(() => ({
		isLoading,
		emitter,
		stateRef,
		hydrate,
		isDisabled,
	}), [
		isLoading,
		emitter,
		stateRef,
		hydrate,
		isDisabled,
	]);

	return <SettingsContext.Provider children={children} value={contextValue} />;
}

export const useSettingsState = () => {
	const { isLoading, emitter, stateRef, hydrate, isDisabled } = useContext(SettingsContext);
	const [{ settings: state, persistedSettings: persistedState }, setState] = useState(() => stateRef.current);

	useEffect(() => {
		emitter.on('update', setState);

		return () => {
			emitter.off('update', setState);
		};
	}, []);

	return { isLoading, hydrate, isDisabled, state, persistedState };
};
