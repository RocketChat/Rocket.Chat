import { useDebouncedCallback, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { Mongo } from 'meteor/mongo';
import { Tracker } from 'meteor/tracker';
import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react';

import { PrivateSettingsCachedCollection } from '../PrivateSettingsCachedCollection';
import { useBatchSettingsDispatch } from '../../contexts/SettingsContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { useReactiveValue } from '../../hooks/useReactiveValue';
import { useTranslation, useLoadLanguage } from '../../contexts/TranslationContext';
import { useUser } from '../../contexts/UserContext';

const SettingsContext = createContext({});

let privateSettingsCachedCollection; // Remove this singleton (╯°□°)╯︵ ┻━┻

const getPrivateSettingsCachedCollection = () => {
	if (privateSettingsCachedCollection) {
		return [privateSettingsCachedCollection, Promise.resolve()];
	}

	privateSettingsCachedCollection = new PrivateSettingsCachedCollection();

	return [privateSettingsCachedCollection, privateSettingsCachedCollection.init()];
};

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

export function SettingsState({ children }) {
	const [isLoading, setLoading] = useState(true);

	const [subscribers] = useState(new Set());

	const stateRef = useRef({ settings: [], persistedSettings: [] });

	const enhancedReducer = useCallback((state, action) => {
		const newState = settingsReducer(state, action);

		stateRef.current = newState;

		subscribers.forEach((subscriber) => {
			subscriber(newState);
		});

		return newState;
	}, [settingsReducer, subscribers]);

	const [, dispatch] = useReducer(enhancedReducer, { settings: [], persistedSettings: [] });

	const collectionsRef = useRef({});

	useEffect(() => {
		const [privateSettingsCachedCollection, loadingPromise] = getPrivateSettingsCachedCollection();

		const stopLoading = () => {
			setLoading(false);
		};

		loadingPromise.then(stopLoading, stopLoading);

		const { collection: persistedSettingsCollection } = privateSettingsCachedCollection;
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

	const updateAtCollection = useCallback(({ _id, ...data }) => {
		const { current: { settingsCollection } } = collectionsRef;
		const { current: updateTimers } = updateTimersRef;
		clearTimeout(updateTimers[_id]);
		updateTimers[_id] = setTimeout(() => {
			settingsCollection.update(_id, { $set: data });
		}, 70);
	}, [collectionsRef, updateTimersRef]);

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

		const { current: { settingsCollection } } = collectionsRef;

		const queries = [].concat(typeof enableQuery === 'string' ? JSON.parse(enableQuery) : enableQuery);
		return !queries.every((query) => !!settingsCollection.findOne(query));
	}, [collectionsRef]);

	const contextValue = useMemo(() => ({
		subscribers,
		stateRef,
		hydrate,
		isDisabled,
	}), [
		subscribers,
		stateRef,
		hydrate,
		isDisabled,
	]);

	return <SettingsContext.Provider children={children} value={contextValue} />;
}

const useSelector = (selector, equalityFunction = (a, b) => a === b) => {
	const { subscribers, stateRef } = useContext(SettingsContext);
	const [value, setValue] = useState(() => selector(stateRef.current));

	const handleUpdate = useMutableCallback((state) => {
		const newValue = selector(state);

		if (!equalityFunction(newValue, value)) {
			setValue(newValue);
		}
	});

	useEffect(() => {
		subscribers.add(handleUpdate);

		return () => {
			subscribers.delete(handleUpdate);
		};
	}, [handleUpdate]);

	useLayoutEffect(() => {
		handleUpdate(stateRef.current);
	});

	return value;
};

export const useGroup = (groupId) => {
	const group = useSelector((state) => state.settings.find(({ _id, type }) => _id === groupId && type === 'group'));

	const filterSettings = (settings) => settings.filter(({ group }) => group === groupId);

	const changed = useSelector((state) => filterSettings(state.settings).some(({ changed }) => changed));
	const sections = useSelector((state) => Array.from(new Set(filterSettings(state.settings).map(({ section }) => section || ''))), (a, b) => a.length === b.length && a.join() === b.join());

	const batchSetSettings = useBatchSettingsDispatch();
	const { stateRef, hydrate } = useContext(SettingsContext);

	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();
	const loadLanguage = useLoadLanguage();
	const user = useUser();

	const save = useMutableCallback(async () => {
		const state = stateRef.current;
		const settings = filterSettings(state.settings);

		const changes = settings.filter(({ changed }) => changed)
			.map(({ _id, value, editor }) => ({ _id, value, editor }));

		if (changes.length === 0) {
			return;
		}

		try {
			await batchSetSettings(changes);

			if (changes.some(({ _id }) => _id === 'Language')) {
				const lng = user.language
					|| changes.filter(({ _id }) => _id === 'Language').shift().value
					|| 'en';

				try {
					await loadLanguage(lng);
					dispatchToastMessage({ type: 'success', message: t('Settings_updated', { lng }) });
				} catch (error) {
					dispatchToastMessage({ type: 'error', message: error });
				}
				return;
			}

			dispatchToastMessage({ type: 'success', message: t('Settings_updated') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const cancel = useMutableCallback(() => {
		const state = stateRef.current;
		const settings = filterSettings(state.settings);
		const persistedSettings = filterSettings(state.persistedSettings);

		const changes = settings.filter(({ changed }) => changed)
			.map((field) => {
				const { _id, value, editor } = persistedSettings.find(({ _id }) => _id === field._id);
				return { _id, value, editor, changed: false };
			});

		hydrate(changes);
	});

	return group && { ...group, sections, changed, save, cancel };
};

export const useSection = (groupId, sectionName) => {
	sectionName = sectionName || '';

	const filterSettings = (settings) =>
		settings.filter(({ group, section }) => group === groupId && ((!sectionName && !section) || (sectionName === section)));

	const canReset = useSelector((state) => filterSettings(state.settings).some(({ value, packageValue }) => JSON.stringify(value) !== JSON.stringify(packageValue)));
	const settingsIds = useSelector((state) => filterSettings(state.settings).map(({ _id }) => _id), (a, b) => a.length === b.length && a.join() === b.join());

	const { stateRef, hydrate, isDisabled } = useContext(SettingsContext);

	const reset = useMutableCallback(() => {
		const state = stateRef.current;
		const settings = filterSettings(state.settings)
			.filter((setting) => Tracker.nonreactive(() => !isDisabled(setting))); // Ignore disabled settings
		const persistedSettings = filterSettings(state.persistedSettings);

		const changes = settings.map((setting) => {
			const { _id, value, packageValue, packageEditor } = persistedSettings.find(({ _id }) => _id === setting._id);
			return {
				_id,
				value: packageValue,
				editor: packageEditor,
				changed: JSON.stringify(packageValue) !== JSON.stringify(value),
			};
		});

		hydrate(changes);
	});

	return {
		name: sectionName,
		canReset,
		settings: settingsIds,
		reset,
	};
};

export const useSettingActions = (persistedSetting) => {
	const { hydrate } = useContext(SettingsContext);

	const update = useDebouncedCallback(({ value, editor }) => {
		const changes = [{
			_id: persistedSetting._id,
			...value !== undefined && { value },
			...editor !== undefined && { editor },
			changed: JSON.stringify(persistedSetting.value) !== JSON.stringify(value) || JSON.stringify(editor) !== JSON.stringify(persistedSetting.editor),
		}];

		hydrate(changes);
	}, 100, [hydrate, persistedSetting]);

	const reset = useDebouncedCallback(() => {
		const { _id, value, packageValue, packageEditor, editor } = persistedSetting;

		const changes = [{
			_id,
			value: packageValue,
			editor: packageEditor,
			changed: JSON.stringify(packageValue) !== JSON.stringify(value) || JSON.stringify(packageEditor) !== JSON.stringify(editor),
		}];

		hydrate(changes);
	}, 100, [hydrate, persistedSetting]);

	return { update, reset };
};

export const useSettingDisabledState = ({ blocked, enableQuery }) => {
	const { isDisabled } = useContext(SettingsContext);
	return useReactiveValue(() => isDisabled({ blocked, enableQuery }), [blocked, enableQuery]);
};

export const useSectionChangedState = (groupId, sectionName) =>
	useSelector((state) =>
		state.settings.some(({ group, section, changed }) =>
			group === groupId && ((!sectionName && !section) || (sectionName === section)) && changed));

export const useSetting = (_id) => {
	const selectSetting = (settings) => settings.find((setting) => setting._id === _id);

	const setting = useSelector((state) => selectSetting(state.settings));
	const persistedSetting = useSelector((state) => selectSetting(state.persistedSettings));

	const { update, reset } = useSettingActions(persistedSetting);
	const disabled = useSettingDisabledState(persistedSetting);

	return {
		...setting,
		disabled,
		update,
		reset,
	};
};
