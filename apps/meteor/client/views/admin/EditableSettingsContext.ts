import type { ISettingBase, ISettingColor, ISetting } from '@rocket.chat/core-typings';
import type { SettingsContextQuery } from '@rocket.chat/ui-contexts';
import { createContext, useContext, useMemo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

export type EditableSetting = (ISettingBase | ISettingColor) & {
	disabled: boolean;
	changed: boolean;
	invisible: boolean;
};

type EditableSettingsContextQuery = SettingsContextQuery & {
	changed?: boolean;
};

export type EditableSettingsContextValue = {
	readonly queryEditableSetting: (
		_id: ISetting['_id'],
	) => [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => EditableSetting | undefined];
	readonly queryEditableSettings: (
		query: EditableSettingsContextQuery,
	) => [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => EditableSetting[]];
	readonly queryGroupSections: (
		_id: ISetting['_id'],
		tab?: ISetting['_id'],
	) => [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => string[]];
	readonly queryGroupTabs: (
		_id: ISetting['_id'],
	) => [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => ISetting['_id'][]];
	readonly dispatch: (changes: Partial<EditableSetting>[]) => void;
};

export const EditableSettingsContext = createContext<EditableSettingsContextValue>({
	queryEditableSetting: () => [(): (() => void) => (): void => undefined, (): undefined => undefined],
	queryEditableSettings: () => [(): (() => void) => (): void => undefined, (): EditableSetting[] => []],
	queryGroupSections: () => [(): (() => void) => (): void => undefined, (): string[] => []],
	queryGroupTabs: () => [(): (() => void) => (): void => undefined, (): ISetting['_id'][] => []],
	dispatch: () => undefined,
});

export const useEditableSetting = (_id: ISetting['_id']): EditableSetting | undefined => {
	const { queryEditableSetting } = useContext(EditableSettingsContext);

	const [subscribe, getSnapshot] = useMemo(() => queryEditableSetting(_id), [queryEditableSetting, _id]);
	return useSyncExternalStore(subscribe, getSnapshot);
};

export const useEditableSettings = (query?: EditableSettingsContextQuery): EditableSetting[] => {
	const { queryEditableSettings } = useContext(EditableSettingsContext);
	const [subscribe, getSnapshot] = useMemo(() => queryEditableSettings(query ?? {}), [queryEditableSettings, query]);
	return useSyncExternalStore(subscribe, getSnapshot);
};

export const useEditableSettingsGroupSections = (_id: ISetting['_id'], tab?: ISetting['_id']): string[] => {
	const { queryGroupSections } = useContext(EditableSettingsContext);

	const [subscribe, getSnapshot] = useMemo(() => queryGroupSections(_id, tab), [queryGroupSections, _id, tab]);
	return useSyncExternalStore(subscribe, getSnapshot);
};

export const useEditableSettingsGroupTabs = (_id: ISetting['_id']): ISetting['_id'][] => {
	const { queryGroupTabs } = useContext(EditableSettingsContext);

	const [subscribe, getSnapshot] = useMemo(() => queryGroupTabs(_id), [queryGroupTabs, _id]);
	return useSyncExternalStore(subscribe, getSnapshot);
};

export const useEditableSettingsDispatch = (): ((changes: Partial<EditableSetting>[]) => void) =>
	useContext(EditableSettingsContext).dispatch;
