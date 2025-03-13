import type { ISetting } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { createFilterFromQuery } from '@rocket.chat/mongo-adapter';
import { useSettings } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';

import type { EditableSetting } from '../EditableSettingsContext';
import { EditableSettingsContext } from '../EditableSettingsContext';

const defaultOmit: Array<ISetting['_id']> = ['Cloud_Workspace_AirGapped_Restrictions_Remaining_Days'];

const performQuery = (
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
	return queries.every((query) => settings.filter(createFilterFromQuery(query)).length > 0);
};

type EditableSettingsProviderProps = {
	children?: ReactNode;
};

const EditableSettingsProvider = ({ children }: EditableSettingsProviderProps) => {
	const persistedSettings = useSettings();

	const [settings, updateSettings] = useState(() =>
		persistedSettings
			.filter((x) => !defaultOmit.includes(x._id))
			.map(
				(persisted): EditableSetting => ({
					...persisted,
					changed: false,
					disabled: persisted.blocked || !performQuery(persisted.enableQuery, persistedSettings),
					invisible: !performQuery(persisted.displayQuery, persistedSettings),
				}),
			),
	);

	useEffect(() => {
		updateSettings((settings) =>
			persistedSettings
				.filter((x) => !defaultOmit.includes(x._id))
				.map(
					(persisted): EditableSetting => ({
						...settings.find(({ _id }) => _id === persisted._id),
						...persisted,
						changed: false,
						disabled: persisted.blocked || !performQuery(persisted.enableQuery, settings),
						invisible: !performQuery(persisted.displayQuery, settings),
					}),
				),
		);
	}, [persistedSettings]);

	const dispatch = useEffectEvent((changes: Partial<EditableSetting>[]) => {
		if (changes.length === 0) {
			return;
		}

		updateSettings((settings) =>
			persistedSettings
				.filter((x) => !defaultOmit.includes(x._id))
				.map((persisted): EditableSetting => {
					const current = settings.find(({ _id }) => _id === persisted._id);
					if (!current) throw new Error(`Setting ${persisted._id} not found`);

					const change = changes.find(({ _id }) => _id === current._id);

					if (!change) {
						return current;
					}

					const partial = { ...current, ...change };

					return {
						...partial,
						disabled: persisted.blocked || !performQuery(persisted.enableQuery, settings),
						invisible: !performQuery(persisted.displayQuery, settings),
					};
				}),
		);
	});

	return (
		<EditableSettingsContext.Provider value={useMemo(() => ({ settings, dispatch }), [settings, dispatch])}>
			{children}
		</EditableSettingsContext.Provider>
	);
};

export default EditableSettingsProvider;
