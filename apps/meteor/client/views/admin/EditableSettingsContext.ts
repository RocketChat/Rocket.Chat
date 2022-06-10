import { ISettingBase, SectionName, SettingId, GroupId, TabId, ISettingColor } from '@rocket.chat/core-typings';
import { SettingsContextQuery } from '@rocket.chat/ui-contexts';
import { createContext, useContext, useMemo } from 'react';
import { useSubscription, Subscription, Unsubscribe } from 'use-subscription';

export type EditableSetting = (ISettingBase | ISettingColor) & {
	disabled: boolean;
	changed: boolean;
	invisible: boolean;
};

export type EditableSettingsContextQuery = SettingsContextQuery & {
	changed?: boolean;
};

export type EditableSettingsContextValue = {
	readonly queryEditableSetting: (_id: SettingId) => Subscription<EditableSetting | undefined>;
	readonly queryEditableSettings: (query: EditableSettingsContextQuery) => Subscription<EditableSetting[]>;
	readonly queryGroupSections: (_id: GroupId, tab?: TabId) => Subscription<SectionName[]>;
	readonly queryGroupTabs: (_id: GroupId) => Subscription<TabId[]>;
	readonly dispatch: (changes: Partial<EditableSetting>[]) => void;
};

export const EditableSettingsContext = createContext<EditableSettingsContextValue>({
	queryEditableSetting: () => ({
		getCurrentValue: (): undefined => undefined,
		subscribe: (): Unsubscribe => (): void => undefined,
	}),
	queryEditableSettings: () => ({
		getCurrentValue: (): EditableSetting[] => [],
		subscribe: (): Unsubscribe => (): void => undefined,
	}),
	queryGroupSections: () => ({
		getCurrentValue: (): SectionName[] => [],
		subscribe: (): Unsubscribe => (): void => undefined,
	}),
	queryGroupTabs: () => ({
		getCurrentValue: (): TabId[] => [],
		subscribe: (): Unsubscribe => (): void => undefined,
	}),
	dispatch: () => undefined,
});

export const useEditableSetting = (_id: SettingId): EditableSetting | undefined => {
	const { queryEditableSetting } = useContext(EditableSettingsContext);

	const subscription = useMemo(() => queryEditableSetting(_id), [queryEditableSetting, _id]);
	return useSubscription(subscription);
};

export const useEditableSettings = (query?: EditableSettingsContextQuery): EditableSetting[] => {
	const { queryEditableSettings } = useContext(EditableSettingsContext);
	const subscription = useMemo(() => queryEditableSettings(query ?? {}), [queryEditableSettings, query]);
	return useSubscription(subscription);
};

export const useEditableSettingsGroupSections = (_id: SettingId, tab?: TabId): SectionName[] => {
	const { queryGroupSections } = useContext(EditableSettingsContext);

	const subscription = useMemo(() => queryGroupSections(_id, tab), [queryGroupSections, _id, tab]);
	return useSubscription(subscription);
};

export const useEditableSettingsGroupTabs = (_id: SettingId): TabId[] => {
	const { queryGroupTabs } = useContext(EditableSettingsContext);

	const subscription = useMemo(() => queryGroupTabs(_id), [queryGroupTabs, _id]);
	return useSubscription(subscription);
};

export const useEditableSettingsDispatch = (): ((changes: Partial<EditableSetting>[]) => void) =>
	useContext(EditableSettingsContext).dispatch;
