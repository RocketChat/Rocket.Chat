import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import React, { createContext, useContext, useEffect, useMemo, useReducer, useState, useRef, useCallback } from 'react';
import toastr from 'toastr';

import { handleError } from '../../../../app/utils/client/lib/handleError';
import { PrivateSettingsCachedCollection } from '../../../../app/ui-admin/client/SettingsCachedCollection';
import { useBatchSetSettings } from '../../../hooks/useBatchSetSettings';

const SettingsContext = createContext({});

const compareValues = (a, b) => {
	if (a === b) {
		return 0;
	}

	if (a && !b) {
		return 1;
	}

	if (!a && b) {
		return -1;
	}

	if (!a && !b) {
		return 0;
	}

	return a > b ? 1 : -1;
};

const stateReducer = (state, { type, payload }) => {
	switch (type) {
		case 'add':
			return [...state, ...payload].sort((a, b) =>
				compareValues(a.section, b.section)
				|| compareValues(a.sorter, b.sorter)
				|| compareValues(a.i18nLabel, b.i18nLabel));

		case 'change':
			return state.map((field) => (field._id !== payload._id ? field : payload));

		case 'remove':
			return state.filter((field) => field._id !== payload);

		case 'hydrate': {
			const map = {};
			payload.forEach((field) => {
				map[field._id] = field;
			});

			return state.map((field) => {
				if (!map[field._id]) {
					return field;
				}

				return { ...field, ...map[field._id] };
			});
		}
	}

	return state;
};

const usePrivateSettings = () => {
	const [state, dispatchToState] = useReducer(stateReducer, []);
	const [persistedState, dispatchToPersistedState] = useReducer(stateReducer, []);
	const [isLoading, setLoading] = useState(true);

	const collection = useMemo(() => new Mongo.Collection(null), []);

	const persistedCollection = useMemo(() => {
		const cachedCollection = new PrivateSettingsCachedCollection();
		const { collection: persistedCollection } = cachedCollection;

		const didLoad = () => {
			setLoading(false);
		};

		cachedCollection.init().then(didLoad, didLoad);

		return persistedCollection;
	}, []);

	useEffect(() => {
		if (isLoading) {
			return;
		}

		const dispatch = (action) => {
			dispatchToState(action);
			dispatchToPersistedState(action);
		};

		const addedQueue = [];
		let dispatchAddedTimer;

		const persistedFieldsQueryHandle = persistedCollection.find()
			.observe({
				added: (data) => {
					collection.insert(data);
					addedQueue.push(data);
					clearTimeout(dispatchAddedTimer);
					dispatchAddedTimer = setTimeout(() => {
						dispatch({ type: 'add', payload: addedQueue });
					}, 70);
				},
				changed: (data) => {
					collection.update(data._id, data);
					dispatch({ type: 'change', payload: data });
				},
				removed: ({ _id }) => {
					collection.remove(_id);
					dispatch({ type: 'remove', payload: _id });
				},
			});

		return () => {
			persistedFieldsQueryHandle.stop();
			clearTimeout(dispatchAddedTimer);
		};
	}, [isLoading]);

	const updateTimersRef = useRef({});

	const updateAtCollection = useCallback(({ _id, ...data }) => {
		const { current: updateTimers } = updateTimersRef;

		clearTimeout(updateTimers[_id]);

		updateTimers[_id] = setTimeout(() => {
			collection.update(_id, { $set: data });
		}, 70);
	}, [collection]);

	const isDisabled = useCallback(({ blocked, enableQuery }) => {
		if (blocked) {
			return true;
		}

		if (!enableQuery) {
			return false;
		}

		const queries = [].concat(typeof enableQuery === 'string' ? JSON.parse(enableQuery) : enableQuery);
		return !queries.map((query) => collection.findOne(query)).every(Boolean);
	}, [collection]);

	return {
		isLoading,
		state,
		persistedState,
		dispatch: dispatchToState,
		updateAtCollection,
		isDisabled,
	};
};

export function SettingsState({ children }) {
	const {
		isLoading,
		state,
		persistedState,
		dispatch,
		updateAtCollection,
		isDisabled,
	} = usePrivateSettings();

	const batchSetSettings = useBatchSetSettings();

	const save = useCallback(async ({ fields }) => {
		const changes = fields.filter(({ changed }) => changed)
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
	}, [batchSetSettings]);

	const cancel = useCallback(({ fields }) => {
		const changes = fields.filter(({ changed }) => changed)
			.map((field) => {
				const { _id, value, editor } = persistedState.find(({ _id }) => _id === field._id);
				return { _id, value, editor, changed: false };
			});

		changes.forEach(updateAtCollection);
		dispatch({ type: 'hydrate', payload: changes });
	}, [persistedState, updateAtCollection]);

	const reset = useCallback(({ fields }) => {
		const changes = fields.map((field) => {
			const { _id, value, packageValue, editor } = persistedState.find(({ _id }) => _id === field._id);
			return {
				_id,
				value: packageValue,
				editor,
				changed: packageValue !== value,
			};
		});

		changes.forEach(updateAtCollection);
		dispatch({ type: 'hydrate', payload: changes });
	}, [persistedState, updateAtCollection]);

	const update = useCallback(({ fields }) => {
		const changes = fields.map((field) => {
			const persistedField = persistedState.find(({ _id }) => _id === field._id);
			return {
				_id: field._id,
				value: field.value,
				editor: field.editor,
				changed: (field.value !== persistedField.value) || (field.editor !== persistedField.editor),
			};
		});

		changes.forEach(updateAtCollection);
		dispatch({ type: 'hydrate', payload: changes });
	}, [persistedState, updateAtCollection]);

	const contextValue = useMemo(() => ({
		isLoading,
		state,
		save,
		cancel,
		reset,
		update,
		isDisabled,
	}), [
		isLoading,
		state,
		save,
		cancel,
		reset,
		update,
		isDisabled,
	]);

	return <SettingsContext.Provider children={children} value={contextValue} />;
}

export const useSettingsState = () => useContext(SettingsContext);
