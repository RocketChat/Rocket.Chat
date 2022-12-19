import type { ISettingBase, SectionName, SettingId, GroupId, TabId, ISettingColor } from '@rocket.chat/core-typings';
import type { SettingsContextQuery } from '@rocket.chat/ui-contexts';
import { createContext, useContext, useMemo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

export type EditableSetting = (ISettingBase | ISettingColor) & {
	disabled: boolean;
	changed: boolean;
	invisible: boolean;
};

export type EditableSettingsContextQuery = SettingsContextQuery & {
	changed?: boolean;
};

export type EditableSettingsContextValue = {
	readonly queryEditableSetting: (
		_id: SettingId,
	) => [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => EditableSetting | undefined];
	readonly queryEditableSettings: (
		query: EditableSettingsContextQuery,
	) => [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => EditableSetting[]];
	readonly queryGroupSections: (
		_id: GroupId,
		tab?: TabId,
	) => [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => SectionName[]];
	readonly queryGroupTabs: (_id: GroupId) => [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => TabId[]];
	readonly dispatch: (changes: Partial<EditableSetting>[]) => void;
	readonly isEnterprise: boolean;
};

export const EditableSettingsContext = createContext<EditableSettingsContextValue>({
	queryEditableSetting: () => [(): (() => void) => (): void => undefined, (): undefined => undefined],
	queryEditableSettings: () => [(): (() => void) => (): void => undefined, (): EditableSetting[] => []],
	queryGroupSections: () => [(): (() => void) => (): void => undefined, (): SectionName[] => []],
	queryGroupTabs: () => [(): (() => void) => (): void => undefined, (): TabId[] => []],
	dispatch: () => undefined,
	isEnterprise: false,
});

export const useIsEnterprise = (): boolean => useContext(EditableSettingsContext).isEnterprise;

export const useEditableSetting = (_id: SettingId): EditableSetting | undefined => {
	const { queryEditableSetting } = useContext(EditableSettingsContext);

	const [subscribe, getSnapshot] = useMemo(() => queryEditableSetting(_id), [queryEditableSetting, _id]);
	return useSyncExternalStore(subscribe, getSnapshot);
};

export const useEditableSettings = (query?: EditableSettingsContextQuery): EditableSetting[] => {
	const { queryEditableSettings } = useContext(EditableSettingsContext);
	const [subscribe, getSnapshot] = useMemo(() => queryEditableSettings(query ?? {}), [queryEditableSettings, query]);
	return useSyncExternalStore(subscribe, getSnapshot);
};

export const useEditableSettingsGroupSections = (_id: SettingId, tab?: TabId): SectionName[] => {
	const { queryGroupSections } = useContext(EditableSettingsContext);

	const [subscribe, getSnapshot] = useMemo(() => queryGroupSections(_id, tab), [queryGroupSections, _id, tab]);
	return useSyncExternalStore(subscribe, getSnapshot);
};

export const useEditableSettingsGroupTabs = (_id: SettingId): TabId[] => {
	const { queryGroupTabs } = useContext(EditableSettingsContext);

	const [subscribe, getSnapshot] = useMemo(() => queryGroupTabs(_id), [queryGroupTabs, _id]);
	return useSyncExternalStore(subscribe, getSnapshot);
};

export const useEditableSettingsDispatch = (): ((changes: Partial<EditableSetting>[]) => void) =>
	useContext(EditableSettingsContext).dispatch;
