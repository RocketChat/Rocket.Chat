import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { createContext, useContext, useMemo } from 'react';
import { useSubscription, Subscription, Unsubscribe } from 'use-subscription';

import {
	ISetting,
	SectionName,
	SettingId,
	GroupId,
} from '../../definition/ISetting';
import { SettingsContextQuery } from './SettingsContext';

export interface IEditableSetting extends ISetting {
	disabled: boolean;
	changed: boolean;
}

type SectionDescriptor = {
	name: SectionName;
	editableSettings: IEditableSetting[];
	settings: SettingId[];
	changed: boolean;
	canReset: boolean;
};

type GroupDescriptor = IEditableSetting & {
	editableSettings: IEditableSetting[];
	sections: SectionName[];
	changed: boolean;
};

export type EditableSettingsContextQuery = SettingsContextQuery & {
	changed?: boolean;
};

export type EditableSettingsContextValue = {
	readonly queryEditableSetting: (_id: SettingId) => Subscription<IEditableSetting | undefined>;
	readonly queryEditableSettings: (query: EditableSettingsContextQuery) => Subscription<IEditableSetting[]>;
	getSettingsGroup: (groupId: GroupId) => GroupDescriptor | null;
	subscribeToSettingsGroup: (groupId: GroupId, cb: (groupDescriptor: GroupDescriptor) => void) => (() => void);
	getSettingsSection: (groupId: GroupId, sectionName: SectionName) => SectionDescriptor | null;
	subscribeToSettingsSection: (groupId: GroupId, sectionName: SectionName, cb: (sectionDescriptor: SectionDescriptor) => void) => (() => void);
	dispatch: (changes: Partial<IEditableSetting>[]) => void;
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
	getSettingsGroup: () => null,
	subscribeToSettingsGroup: () => (): void => undefined,
	getSettingsSection: () => null,
	subscribeToSettingsSection: () => (): void => undefined,
	dispatch: () => undefined,
});

export const usePrivilegedSettingsSection = (groupId: GroupId, sectionName: SectionName): SectionDescriptor | null => {
	const { getSettingsSection, subscribeToSettingsSection } = useContext(EditableSettingsContext);

	const subscription = useMemo(() => ({
		getCurrentValue: (): (SectionDescriptor | null) => getSettingsSection(groupId, sectionName),
		subscribe: (cb: (sectionDescriptor: SectionDescriptor | null) => void): (() => void) => subscribeToSettingsSection(groupId, sectionName, cb),
	}), [groupId, sectionName, getSettingsSection, subscribeToSettingsSection]);

	return useSubscription(subscription);
};

export const usePrivilegedSettingsSectionActions = (groupId: GroupId, sectionName: SectionName): {
	reset: () => void;
} => {
	const { getSettingsSection, dispatch } = useContext(EditableSettingsContext);

	const reset = useMutableCallback(() => {
		const sectionDescriptor = getSettingsSection(groupId, sectionName);

		if (!sectionDescriptor) {
			return;
		}

		dispatch(
			sectionDescriptor.editableSettings
				.filter(({ disabled }) => !disabled)
				.map(({ _id, value, packageValue, editor, packageEditor }) => ({
					_id,
					value: packageValue,
					editor: packageEditor,
					changed:
						JSON.stringify(value) !== JSON.stringify(packageValue)
						|| JSON.stringify(editor) !== JSON.stringify(packageEditor),
				})),
		);
	});

	return {
		reset,
	};
};

export const useEditableSetting = (_id: SettingId): IEditableSetting | undefined => {
	const { queryEditableSetting } = useContext(EditableSettingsContext);

	const subscription = useMemo(() => queryEditableSetting(_id), [queryEditableSetting, _id]);
	return useSubscription(subscription);
};

export const useEditableSettings = (query?: EditableSettingsContextQuery): IEditableSetting[] => {
	const { queryEditableSettings } = useContext(EditableSettingsContext);
	const subscription = useMemo(() => queryEditableSettings(query ?? {}), [queryEditableSettings, query]);
	return useSubscription(subscription);
};

export const useEditableSettingsDispatch = (): ((changes: Partial<IEditableSetting>[]) => void) =>
	useContext(EditableSettingsContext).dispatch;
