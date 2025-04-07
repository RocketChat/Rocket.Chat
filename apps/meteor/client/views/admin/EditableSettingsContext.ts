import type { ISetting } from '@rocket.chat/core-typings';
import { createContext, useContext } from 'react';
import { create, type StoreApi, type UseBoundStore } from 'zustand';
import { useShallow } from 'zustand/shallow';

export type EditableSetting = ISetting & {
	disabled: boolean;
	changed: boolean;
	invisible: boolean;
};

export const compareSettings = (a: EditableSetting, b: EditableSetting): number => {
	const sorter = a.sorter - b.sorter;
	if (sorter !== 0) return sorter;

	const tab = (a.tab ?? '').localeCompare(b.tab ?? '');
	if (tab !== 0) return tab;

	const i18nLabel = a.i18nLabel.localeCompare(b.i18nLabel);

	return i18nLabel;
};

type EditableSettingsContextQuery =
	| {
			group: ISetting['_id'];
	  }
	| {
			group: ISetting['_id'];
			section: string;
			tab?: ISetting['_id'];
	  }
	| {
			group: ISetting['_id'];
			changed: true;
	  };

export interface IEditableSettingsState {
	state: EditableSetting[];
	initialState: ISetting[];
	sync(newInitialState: ISetting[]): void;
	mutate(changes: Partial<EditableSetting>[]): void;
}

export type EditableSettingsContextValue = {
	useEditableSettingsStore: UseBoundStore<StoreApi<IEditableSettingsState>>;
};

export const EditableSettingsContext = createContext<EditableSettingsContextValue>({
	useEditableSettingsStore: create<IEditableSettingsState>()(() => ({
		state: [],
		initialState: [],
		sync: () => undefined,
		mutate: () => undefined,
	})),
});

export const useEditableSetting = (_id: ISetting['_id']): EditableSetting | undefined => {
	const { useEditableSettingsStore } = useContext(EditableSettingsContext);

	return useEditableSettingsStore((state) => state.state.find((x) => x._id === _id));
};

export const useEditableSettings = (query: EditableSettingsContextQuery): EditableSetting[] => {
	const { useEditableSettingsStore } = useContext(EditableSettingsContext);

	return useEditableSettingsStore(
		useShallow((state) =>
			state.state
				.filter((x) => {
					if ('changed' in query) {
						return x.group === query.group && x.changed;
					}

					if ('section' in query) {
						return (
							x.group === query.group &&
							(query.section ? x.section === query.section : !x.section) &&
							(query.tab ? x.tab === query.tab : !x.tab)
						);
					}

					return x.group === query.group;
				})
				.sort(compareSettings),
		),
	);
};

export const useEditableSettingsGroupSections = (_id: ISetting['_id'], tab?: ISetting['_id']): string[] => {
	const { useEditableSettingsStore } = useContext(EditableSettingsContext);

	return useEditableSettingsStore(
		useShallow((state) =>
			Array.from(
				new Set(
					state.state
						.filter((x) => x.group === _id && (tab !== undefined ? x.tab === tab : !x.tab))
						.sort(compareSettings)
						.map(({ section }) => section || ''),
				),
			),
		),
	);
};

export const useEditableSettingsGroupTabs = (_id: ISetting['_id']): ISetting['_id'][] => {
	const { useEditableSettingsStore } = useContext(EditableSettingsContext);

	return useEditableSettingsStore(
		useShallow((state) =>
			Array.from(
				new Set(
					state.state
						.filter((x) => x.group === _id)
						.sort(compareSettings)
						.map(({ tab }) => tab || ''),
				),
			),
		),
	);
};

export const useEditableSettingsDispatch = (): ((changes: Partial<EditableSetting>[]) => void) => {
	const { useEditableSettingsStore } = useContext(EditableSettingsContext);
	return useEditableSettingsStore((state) => state.mutate);
};
