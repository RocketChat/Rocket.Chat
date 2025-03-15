import type { ISetting } from '@rocket.chat/core-typings';
import { createFilterFromQuery } from '@rocket.chat/mongo-adapter';
import { useSettings } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { create } from 'zustand';

import type { EditableSetting, IEditableSettingsState } from '../EditableSettingsContext';
import { EditableSettingsContext } from '../EditableSettingsContext';

const defaultOmit: Array<ISetting['_id']> = ['Cloud_Workspace_AirGapped_Restrictions_Remaining_Days'];

const performSettingQuery = (
	query:
		| string
		| {
				_id: string;
				value: unknown;
		  }
		| {
				_id: string;
				value: unknown;
		  }[]
		| undefined,
	settings: ISetting[],
) => {
	if (!query) {
		return true;
	}

	const queries = [].concat(typeof query === 'string' ? JSON.parse(query) : query);
	return queries.every((query) => settings.some(createFilterFromQuery(query)));
};

type EditableSettingsProviderProps = {
	children?: ReactNode;
};

// TODO: this component can be replaced by RHF state management
const EditableSettingsProvider = ({ children }: EditableSettingsProviderProps) => {
	const persistedSettings = useSettings();

	const [useEditableSettingsStore] = useState(() =>
		create<IEditableSettingsState>()((set) => ({
			state: persistedSettings
				.filter((x) => !defaultOmit.includes(x._id))
				.map(
					(persisted): EditableSetting => ({
						...persisted,
						changed: false,
						disabled: persisted.blocked || !performSettingQuery(persisted.enableQuery, persistedSettings),
						invisible: !performSettingQuery(persisted.displayQuery, persistedSettings),
					}),
				),
			initialState: persistedSettings,
			sync: (newInitialState) => {
				set(({ state }) => ({
					state: newInitialState
						.filter((x) => !defaultOmit.includes(x._id))
						.map(
							(persisted): EditableSetting => ({
								...state.find(({ _id }) => _id === persisted._id),
								...persisted,
								changed: false,
								disabled: persisted.blocked || !performSettingQuery(persisted.enableQuery, state),
								invisible: !performSettingQuery(persisted.displayQuery, state),
							}),
						),
				}));
			},
			mutate: (changes) => {
				set(({ state, initialState }) => ({
					state: initialState
						.filter((x) => !defaultOmit.includes(x._id))
						.map((persisted): EditableSetting => {
							const current = state.find(({ _id }) => _id === persisted._id);
							if (!current) throw new Error(`Setting ${persisted._id} not found`);

							const change = changes.find(({ _id }) => _id === current._id);

							if (!change) {
								return current;
							}

							return {
								...current,
								...change,
								disabled: persisted.blocked || !performSettingQuery(persisted.enableQuery, state),
								invisible: !performSettingQuery(persisted.displayQuery, state),
							};
						}),
				}));
			},
		})),
	);

	const sync = useEditableSettingsStore((state) => state.sync);

	useEffect(() => {
		sync(persistedSettings);
	}, [persistedSettings, sync]);

	return (
		<EditableSettingsContext.Provider value={useMemo(() => ({ useEditableSettingsStore }), [useEditableSettingsStore])}>
			{children}
		</EditableSettingsContext.Provider>
	);
};

export default EditableSettingsProvider;
