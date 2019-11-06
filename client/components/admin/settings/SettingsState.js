import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import mitt from 'mitt';
import React, { createContext, useCallback, useContext, useEffect, useReducer, useRef, useState, useMemo, useLayoutEffect } from 'react';
import toastr from 'toastr';

import { handleError } from '../../../../app/utils/client/lib/handleError';
import { PrivateSettingsCachedCollection } from '../../../../app/ui-admin/client/SettingsCachedCollection';
import { useBatchSetSettings } from '../../../hooks/useBatchSetSettings';
import { useLazyRef } from '../../../hooks/useLazyRef';
import { useEventCallback } from '../../../hooks/useEventCallback';

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

const useSelector = (selector, equalityFunction = (a, b) => a === b) => {
	const { emitter, stateRef } = useContext(SettingsContext);
	const [value, setValue] = useState(() => selector(stateRef.current));

	const handleUpdate = useEventCallback((selector, equalityFunction, value, state) => {
		const newValue = selector(state);

		if (!equalityFunction(newValue, value)) {
			setValue(newValue);
		}
	}, selector, equalityFunction, value);

	useEffect(() => {
		emitter.on('update', handleUpdate);

		return () => {
			emitter.off('update', handleUpdate);
		};
	}, [handleUpdate]);

	return value;
};

export const useGroup = (groupId) => {
	const { hydrate } = useContext(SettingsContext);
	const group = useSelector((state) => state.settings.find(({ _id, type }) => _id === groupId && type === 'group'));
	const settings = useSelector((state) => state.settings.filter(({ group }) => group === groupId));
	const persistedSettings = useSelector((state) => state.persistedSettings.filter(({ group }) => group === groupId));

	const changed = useMemo(() => settings.some(({ changed }) => changed), [settings]);
	const sections = useMemo(() => Array.from(new Set(settings.map(({ section }) => section || ''))), [settings]);

	const batchSetSettings = useBatchSetSettings();

	const save = useEventCallback(async (settings) => {
		const changes = settings.filter(({ changed }) => changed)
			.map(({ _id, value, editor }) => ({ _id, value, editor }));

		if (changes.length === 0) {
			return;
		}

		try {
			await batchSetSettings(changes);

			if (changes.some(({ _id }) => _id === 'Language')) {
				const lng = Meteor.user().language
					|| changes.filter(({ _id }) => _id === 'Language').shift().value
					|| 'en';

				TAPi18n._loadLanguage(lng)
					.then(() => toastr.success(TAPi18n.__('Settings_updated', { lng })))
					.catch(handleError);

				return;
			}

			toastr.success(TAPi18n.__('Settings_updated'));
		} catch (error) {
			handleError(error);
		}
	}, settings);

	const cancel = useEventCallback((settings, persistedSettings, hydrate) => {
		const changes = settings.filter(({ changed }) => changed)
			.map((field) => {
				const { _id, value, editor } = persistedSettings.find(({ _id }) => _id === field._id);
				return { _id, value, editor, changed: false };
			});

		hydrate(changes);
	}, settings, persistedSettings, hydrate);

	return useMemo(() => group && { ...group, sections, changed, save, cancel }, [group, sections.join(','), changed]);
};
