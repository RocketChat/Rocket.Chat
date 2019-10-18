import { Mongo } from 'meteor/mongo';
import React, { createContext, useContext, useEffect, useMemo, useReducer, useState } from 'react';

import { PrivateSettingsCachedCollection } from '../../../../app/ui-admin/client/SettingsCachedCollection';
import { useBatchSetSettings } from '../../../hooks/useBatchSetSettings';
import { useReactiveValue } from '../../../hooks/useReactiveValue';

const EditingContext = createContext({});

const stateReducer = (state, { type, payload }) => {
	switch (type) {
		case 'add':
			return [...state, payload];

		case 'change':
			return state.map((field) => (field._id !== payload._id ? field : payload));

		case 'remove':
			return state.filter((field) => field._id !== payload);

		case 'hydrate': {
			const map = {};
			payload.forEach((field) => {
				map[field._id] = field;
			});
			return state.map((field) => ({ ...field, ...map[field._id] || {} }));
		}
	}

	return state;
};

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

export function EditingState({ children, groupId }) {
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

		const persistedFieldsQueryHandle = persistedCollection.find()
			.observe({
				added: (data) => {
					collection.insert(data);
					dispatchToState({ type: 'add', payload: data });
					dispatchToPersistedState({ type: 'add', payload: data });
				},
				changed: (data) => {
					collection.update(data._id, data);
					dispatchToState({ type: 'change', payload: data });
					dispatchToPersistedState({ type: 'change', payload: data });
				},
				removed: ({ _id }) => {
					collection.remove(_id);
					dispatchToState({ type: 'remove', payload: _id });
					dispatchToPersistedState({ type: 'remove', payload: _id });
				},
			});

		return () => {
			persistedFieldsQueryHandle.stop();
		};
	}, [isLoading]);

	const updateTimers = useMemo(() => ({}), []);

	const updateAtCollection = ({ _id, ...data }) => {
		clearTimeout(updateTimers[_id]);
		updateTimers[_id] = setTimeout(() => {
			collection.update(_id, { $set: data });
		}, 70);
	};

	const group = useMemo(() => {
		const fields = state.filter(({ group }) => group === groupId)
			.sort((a, b) => compareValues(a.section, b.section)
				|| compareValues(a.sorter, b.sorter)
				|| compareValues(a.i18nLabel, b.i18nLabel));

		const sectionsMap = {};
		fields.forEach((field) => {
			const name = field.section || '';
			const section = sectionsMap[name] || { name };
			section.changed = section.changed || field.changed;
			section.fields = (section.fields || []).concat(field);
			sectionsMap[name] = section;
		});

		const sections = Object.values(sectionsMap);

		return state.filter(({ _id, type }) => _id === groupId && type === 'group')
			.map((group) => ({
				...group,
				changed: fields.some(({ changed }) => changed),
				sections,
				fields,
			}))
			.shift();
	}, [groupId, state]);

	const batchSetSettings = useBatchSetSettings();

	const save = async ({ fields }) => {
		const changes = fields.filter(({ changed }) => changed)
			.map(({ _id, value, editor }) => ({ _id, value, editor }));

		if (changes.length === 0) {
			return false;
		}

		await batchSetSettings(changes);

		return true;
	};

	const cancel = ({ fields }) => {
		const changes = fields.filter(({ changed }) => changed)
			.map((field) => {
				const { _id, value, editor } = persistedState.find(({ _id }) => _id === field._id);
				return { _id, value, editor, changed: false };
			});

		changes.forEach(updateAtCollection);
		dispatchToState({ type: 'hydrate', payload: changes });
	};

	const reset = ({ fields }) => {
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
		dispatchToState({ type: 'hydrate', payload: changes });
	};

	const update = ({ fields }) => {
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
		dispatchToState({ type: 'hydrate', payload: changes });
	};

	const isDisabled = ({ blocked, enableQuery }) => {
		if (blocked) {
			return true;
		}

		if (!enableQuery) {
			return false;
		}

		const queries = [].concat(typeof enableQuery === 'string' ? JSON.parse(enableQuery) : enableQuery);
		return !queries.map((query) => collection.findOne(query)).every(Boolean);
	};

	return <EditingContext.Provider
		children={children}
		value={{
			isLoading,
			group,
			save,
			cancel,
			reset,
			update,
			isDisabled,
		}}
	/>;
}

export const useGroup = () => useContext(EditingContext).group;

export const useSection = () => useContext(EditingContext).section;

export const useBulkActions = () => {
	const { save, cancel, reset, update } = useContext(EditingContext);
	return { save, cancel, reset, update };
};

export const useFieldActions = (field) => {
	const { update, reset } = useBulkActions();
	const { isDisabled } = useContext(EditingContext);
	const disabled = useReactiveValue(() => isDisabled(field), [field.blocked, field.enableQuery]);

	return {
		update: (data) => update({ fields: [{ ...field, ...data }] }),
		reset: () => reset({ fields: [field] }),
		disabled,
	};
};
