import { createContext, useContext, useMemo } from 'react';
import { useSubscription, Subscription, Unsubscribe } from 'use-subscription';

import { ISetting, SectionName, SettingId, GroupId } from '../../definition/ISetting';
import { SettingsContextQuery } from './SettingsContext';

export interface IEditableSetting extends ISetting {
	disabled: boolean;
	changed: boolean;
}

export type EditableSettingsContextQuery = SettingsContextQuery & {
	changed?: boolean;
};

export type EditableSettingsContextValue = {
	readonly queryEditableSetting: (_id: SettingId) => Subscription<IEditableSetting | undefined>;
	readonly queryEditableSettings: (
		query: EditableSettingsContextQuery,
	) => Subscription<IEditableSetting[]>;
	readonly queryGroupSections: (_id: GroupId) => Subscription<SectionName[]>;
	readonly dispatch: (changes: Partial<IEditableSetting>[]) => void;
};

export const EditableSettingsContext = createContext<EditableSettingsContextValue>({
	queryEditableSetting: () => ({
		getCurrentValue: (): undefined => undefined,
		subscribe: (): Unsubscribe => (): void => undefined,
	}),
	queryEditableSettings: () => ({
		getCurrentValue: (): IEditableSetting[] => [],
		subscribe: (): Unsubscribe => (): void => undefined,
	}),
	queryGroupSections: () => ({
		getCurrentValue: (): SectionName[] => [],
		subscribe: (): Unsubscribe => (): void => undefined,
	}),
	dispatch: () => undefined,
});

export const useEditableSetting = (_id: SettingId): IEditableSetting | undefined => {
	const { queryEditableSetting } = useContext(EditableSettingsContext);

	const subscription = useMemo(() => queryEditableSetting(_id), [queryEditableSetting, _id]);
	return useSubscription(subscription);
};

export const useEditableSettings = (query?: EditableSettingsContextQuery): IEditableSetting[] => {
	const { queryEditableSettings } = useContext(EditableSettingsContext);
	const subscription = useMemo(
		() => queryEditableSettings(query ?? {}),
		[queryEditableSettings, query],
	);
	return useSubscription(subscription);
};

export const useEditableSettingsGroupSections = (_id: SettingId): SectionName[] => {
	const { queryGroupSections } = useContext(EditableSettingsContext);

	const subscription = useMemo(() => queryGroupSections(_id), [queryGroupSections, _id]);
	return useSubscription(subscription);
};

export const useEditableSettingsDispatch = (): ((changes: Partial<IEditableSetting>[]) => void) =>
	useContext(EditableSettingsContext).dispatch;
