import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react';
import toastr from 'toastr';

import { handleError } from '../../../../app/utils/client/lib/handleError';
import { PrivateSettingsCachedCollection } from '../../../../app/ui-admin/client/SettingsCachedCollection';
import { useBatchSetSettings } from '../../../hooks/useBatchSetSettings';
import { useLazyRef } from '../../../hooks/useLazyRef';
import { useEventCallback } from '../../../hooks/useEventCallback';
import { useReactiveValue } from '../../../hooks/useReactiveValue';

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
		const stopLoading = () => {
			setLoading(false);
		};

		if (!privateSettingsCachedCollection) {
			privateSettingsCachedCollection = new PrivateSettingsCachedCollection();

			privateSettingsCachedCollection.init().then(stopLoading, stopLoading);
		} else {
			stopLoading();
		}

		return privateSettingsCachedCollection.collection;
	});

	const collectionRef = useLazyRef(() => new Mongo.Collection(null));

	const [subscribers] = useState(new Set());

	const stateRef = useRef({ settings: [], persistedSettings: [] });

	const enhancedReducer = useCallback((state, action) => {
		const newState = stateReducer(state, action);

		stateRef.current = newState;

		subscribers.forEach((subscriber) => {
			subscriber(newState);
		});

		return newState;
	}, [stateReducer, subscribers]);

	const [, dispatch] = useReducer(enhancedReducer, { settings: [], persistedSettings: [] });

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

	const contextValue = useMemo(() => ({
		isLoading,
		subscribers,
		stateRef,
		hydrate,
		isDisabled,
	}), [
		isLoading,
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

	const handleUpdate = useEventCallback((selector, equalityFunction, value, state) => {
		const newValue = selector(state);

		if (!equalityFunction(newValue, value)) {
			setValue(newValue);
		}
	}, selector, equalityFunction, value);

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

	const batchSetSettings = useBatchSetSettings();
	const { stateRef, hydrate } = useContext(SettingsContext);

	const save = useEventCallback(async (filterSettings, { current: state }, batchSetSettings) => {
		const settings = filterSettings(state.settings);

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
	}, filterSettings, stateRef, batchSetSettings);

	const cancel = useEventCallback((filterSettings, { current: state }, hydrate) => {
		const settings = filterSettings(state.settings);
		const persistedSettings = filterSettings(state.persistedSettings);

		const changes = settings.filter(({ changed }) => changed)
			.map((field) => {
				const { _id, value, editor } = persistedSettings.find(({ _id }) => _id === field._id);
				return { _id, value, editor, changed: false };
			});

		hydrate(changes);
	}, filterSettings, stateRef, hydrate);

	return group && { ...group, sections, changed, save, cancel };
};

export const useSection = (groupId, sectionName) => {
	sectionName = sectionName || '';

	const filterSettings = (settings) =>
		settings.filter(({ group, section }) => group === groupId && ((!sectionName && !section) || (sectionName === section)));

	const changed = useSelector((state) => filterSettings(state.settings).some(({ changed }) => changed));
	const canReset = useSelector((state) => filterSettings(state.settings).some(({ value, packageValue }) => value !== packageValue));
	const settingsIds = useSelector((state) => filterSettings(state.settings).map(({ _id }) => _id), (a, b) => a.length === b.length && a.join() === b.join());

	const { stateRef, hydrate } = useContext(SettingsContext);

	const reset = useEventCallback((filterSettings, { current: state }, hydrate) => {
		const settings = filterSettings(state.settings);
		const persistedSettings = filterSettings(state.persistedSettings);

		const changes = settings.map((setting) => {
			const { _id, value, packageValue, editor } = persistedSettings.find(({ _id }) => _id === setting._id);
			return {
				_id,
				value: packageValue,
				editor,
				changed: packageValue !== value,
			};
		});

		hydrate(changes);
	}, filterSettings, stateRef, hydrate);

	return {
		name: sectionName,
		changed,
		canReset,
		settings: settingsIds,
		reset,
	};
};

export const useSetting = (_id) => {
	const { stateRef, hydrate, isDisabled } = useContext(SettingsContext);

	const selectSetting = (settings) => settings.find((setting) => setting._id === _id);

	const setting = useSelector((state) => selectSetting(state.settings));
	const sectionChanged = useSelector((state) => state.settings.some(({ section, changed }) => section === setting.section && changed));
	const disabled = useReactiveValue(() => isDisabled(setting), [setting.blocked, setting.enableQuery]);

	const update = useEventCallback((selectSetting, { current: state }, hydrate, data) => {
		const setting = { ...selectSetting(state.settings), ...data };
		const persistedSetting = selectSetting(state.persistedSettings);

		const changes = [{
			_id: setting._id,
			value: setting.value,
			editor: setting.editor,
			changed: (setting.value !== persistedSetting.value) || (setting.editor !== persistedSetting.editor),
		}];

		hydrate(changes);
	}, selectSetting, stateRef, hydrate);

	const reset = useEventCallback((selectSetting, { current: state }, hydrate) => {
		const { _id, value, packageValue, editor } = selectSetting(state.persistedSettings);
		const changes = [{
			_id,
			value: packageValue,
			editor,
			changed: packageValue !== value,
		}];

		hydrate(changes);
	}, selectSetting, stateRef, hydrate);

	return {
		...setting,
		sectionChanged,
		disabled,
		update,
		reset,
	};
};
