import { Mongo } from 'meteor/mongo';
import React, { createContext, useCallback, useContext, useEffect, useReducer, useRef, useState } from 'react';

import { PrivateSettingsCachedCollection } from '../../../../app/ui-admin/client/SettingsCachedCollection';

const SettingsContext = createContext({});

let privateSettingsCachedCollection; // Remove this singleton (╯°□°)╯︵ ┻━┻

const compareValues = (a, b) => {
	if (a === b || (!a && !b)) {
		return 0;
	}

	return a > b ? 1 : -1;
};

const compareSettings = (a, b) =>
	compareValues(a.section, b.section)
	|| compareValues(a.sorter, b.sorter)
	|| compareValues(a.i18nLabel, b.i18nLabel);

const stateReducer = (state, { type, payload }) => {
	switch (type) {
		case 'add':
			return [...state, ...payload].sort(compareSettings);

		case 'change':
			return state.map((setting) => (setting._id !== payload._id ? setting : payload));

		case 'remove':
			return state.filter((setting) => setting._id !== payload);

		case 'hydrate': {
			const map = {};
			payload.forEach((setting) => {
				map[setting._id] = setting;
			});

			return state.map((setting) => (map[setting._id] ? { ...setting, ...map[setting._id] } : setting));
		}
	}

	return state;
};

export function SettingsState({ children }) {
	const [state, updateState] = useReducer(stateReducer, []);
	const [persistedState, updatePersistedState] = useReducer(stateReducer, []);
	const [isLoading, setLoading] = useState(true);

	const updateStates = (action) => {
		updateState(action);
		updatePersistedState(action);
	};

	const stopLoading = () => {
		setLoading(false);
	};

	const persistedCollectionRef = useRef();

	useEffect(() => {
		if (!privateSettingsCachedCollection) {
			privateSettingsCachedCollection = new PrivateSettingsCachedCollection();
			privateSettingsCachedCollection.init().then(stopLoading, stopLoading);
		}

		persistedCollectionRef.current = privateSettingsCachedCollection.collection;
	}, []);

	const { current: persistedCollection } = persistedCollectionRef;

	const [collection] = useState(() => new Mongo.Collection(null));

	useEffect(() => {
		if (isLoading) {
			return;
		}

		const addedQueue = [];
		let addedActionTimer;

		const added = (data) => {
			collection.insert(data);
			addedQueue.push(data);
			clearTimeout(addedActionTimer);
			addedActionTimer = setTimeout(() => {
				updateStates({ type: 'add', payload: addedQueue });
			}, 70);
		};

		const changed = (data) => {
			collection.update(data._id, data);
			updateStates({ type: 'change', payload: data });
		};

		const removed = ({ _id }) => {
			collection.remove(_id);
			updateStates({ type: 'remove', payload: _id });
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
	}, [isLoading]);

	const updateTimersRef = useRef({});

	const updateAtCollection = ({ _id, ...data }) => {
		const { current: updateTimers } = updateTimersRef;
		clearTimeout(updateTimers[_id]);
		updateTimers[_id] = setTimeout(() => {
			collection.update(_id, { $set: data });
		}, 70);
	};

	const collectionRef = useRef();
	const updateAtCollectionRef = useRef();
	const updateStateRef = useRef();

	collectionRef.current = collection;
	updateAtCollectionRef.current = updateAtCollection;
	updateStateRef.current = updateState;

	const hydrate = useCallback((changes) => {
		const { current: updateAtCollection } = updateAtCollectionRef;
		const { current: updateState } = updateStateRef;
		changes.forEach(updateAtCollection);
		updateState({ type: 'hydrate', payload: changes });
	}, []);

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

	const contextValue = {
		isLoading,
		state,
		persistedState,
		hydrate,
		isDisabled,
	};

	return <SettingsContext.Provider children={children} value={contextValue} />;
}

export const useSettingsState = () => useContext(SettingsContext);
