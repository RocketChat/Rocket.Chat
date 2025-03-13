import type { ISetting } from '@rocket.chat/core-typings';
import { createContext, useContext, useMemo } from 'react';

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

export type EditableSettingsContextValue = {
	settings: EditableSetting[];
	dispatch(changes: Partial<EditableSetting>[]): void;
};

export const EditableSettingsContext = createContext<EditableSettingsContextValue>({
	settings: [],
	dispatch: () => undefined,
});

export const useEditableSetting = (_id: ISetting['_id']): EditableSetting | undefined => {
	const { settings } = useContext(EditableSettingsContext);

	return useMemo(() => settings.find((x) => x._id === _id), [settings, _id]);
};

export const useEditableSettings = (query: EditableSettingsContextQuery): EditableSetting[] => {
	const { settings } = useContext(EditableSettingsContext);

	return useMemo(
		() =>
			settings
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
		[settings, query],
	);
};

export const useEditableSettingsGroupSections = (_id: ISetting['_id'], tab?: ISetting['_id']): string[] => {
	const { settings } = useContext(EditableSettingsContext);

	return useMemo(
		() =>
			Array.from(
				new Set(
					settings
						.filter((x) => x.group === _id && (tab !== undefined ? x.tab === tab : !x.tab))
						.sort(compareSettings)
						.map(({ section }) => section || ''),
				),
			),
		[_id, settings, tab],
	);
};

export const useEditableSettingsGroupTabs = (_id: ISetting['_id']): ISetting['_id'][] => {
	const { settings } = useContext(EditableSettingsContext);

	return useMemo(
		() =>
			Array.from(
				new Set(
					settings
						.filter((x) => x.group === _id)
						.sort(compareSettings)
						.map(({ tab }) => tab || ''),
				),
			),
		[settings, _id],
	);
};

export const useEditableSettingsDispatch = (): ((changes: Partial<EditableSetting>[]) => void) => {
	const { dispatch } = useContext(EditableSettingsContext);
	return dispatch;
};
