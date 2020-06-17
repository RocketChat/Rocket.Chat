import { useDebouncedCallback, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { createContext, useContext, useMemo } from 'react';
import { useSubscription } from 'use-subscription';

import {
	ISetting,
	SectionName,
	SettingId,
	GroupId,
} from '../../definition/ISetting';
import { useToastMessageDispatch } from './ToastMessagesContext';
import { useTranslation, useLoadLanguage } from './TranslationContext';
import { useUser } from './UserContext';
import { SettingsContext } from './SettingsContext';

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

// TODO: split editing into another context
type PrivilegedSettingsContextValue = {
	getSettingsGroup: (groupId: GroupId) => GroupDescriptor | null;
	subscribeToSettingsGroup: (groupId: GroupId, cb: (groupDescriptor: GroupDescriptor) => void) => (() => void);
	getSettingsSection: (groupId: GroupId, sectionName: SectionName) => SectionDescriptor | null;
	subscribeToSettingsSection: (groupId: GroupId, sectionName: SectionName, cb: (sectionDescriptor: SectionDescriptor) => void) => (() => void);
	getEditableSetting: (_id: SettingId) => IEditableSetting | null;
	subscribeToEditableSetting: (_id: SettingId, cb: (setting: IEditableSetting) => void) => (() => void);
	dispatchToEditableSettings: (changes: any[]) => void;
};

export const EditableSettingsContext = createContext<PrivilegedSettingsContextValue>({
	getSettingsGroup: () => null,
	subscribeToSettingsGroup: () => (): void => undefined,
	getSettingsSection: () => null,
	subscribeToSettingsSection: () => (): void => undefined,
	getEditableSetting: () => null,
	subscribeToEditableSetting: () => (): void => undefined,
	dispatchToEditableSettings: () => undefined,
});

export const usePrivilegedSettingsGroup = (groupId: GroupId): GroupDescriptor | null => {
	const { getSettingsGroup, subscribeToSettingsGroup } = useContext(EditableSettingsContext);

	const subscription = useMemo(() => ({
		getCurrentValue: (): (GroupDescriptor | null) => getSettingsGroup(groupId),
		subscribe: (cb: (groupDescriptor: GroupDescriptor | null) => void): (() => void) => subscribeToSettingsGroup(groupId, cb),
	}), [groupId, getSettingsGroup, subscribeToSettingsGroup]);

	return useSubscription(subscription);
};

export const usePrivilegedSettingsGroupActions = (groupId: GroupId): {
	save: () => void;
	cancel: () => void;
} => {
	const { querySetting, dispatch } = useContext(SettingsContext);
	const { getSettingsGroup, dispatchToEditableSettings } = useContext(EditableSettingsContext);

	const dispatchToastMessage = useToastMessageDispatch() as any;
	const t = useTranslation() as (key: string, ...args: any[]) => string;
	const loadLanguage = useLoadLanguage() as any;
	const user = useUser() as any;

	const save = useMutableCallback(async () => {
		const changes = (getSettingsGroup(groupId)?.editableSettings ?? [])
			.filter(({ changed }) => changed)
			.map(({ _id, value, editor }) => ({ _id, value, editor }));

		if (changes.length === 0) {
			return;
		}

		try {
			await dispatch(changes);

			if (changes.some(({ _id }) => _id === 'Language')) {
				const lng = user?.language
					|| changes.filter(({ _id }) => _id === 'Language').shift()?.value
					|| 'en';

				await loadLanguage(lng);
				dispatchToastMessage({ type: 'success', message: t('Settings_updated', { lng }) });
				return;
			}

			dispatchToastMessage({ type: 'success', message: t('Settings_updated') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const cancel = useMutableCallback(() => {
		dispatchToEditableSettings(
			(getSettingsGroup(groupId)?.editableSettings ?? [])
				.filter(({ changed }) => changed)
				.map((editableSetting) => {
					const setting = querySetting(editableSetting._id).getCurrentValue();
					if (!setting) {
						return {};
					}

					return {
						_id: setting._id,
						value: setting.value,
						editor: setting.editor,
						changed: false,
					};
				}),
		);
	});

	return { save, cancel };
};

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
	const { getSettingsSection, dispatchToEditableSettings } = useContext(EditableSettingsContext);

	const reset = useMutableCallback(() => {
		const sectionDescriptor = getSettingsSection(groupId, sectionName);

		if (!sectionDescriptor) {
			return;
		}

		dispatchToEditableSettings(
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

export const usePrivilegedSetting = (_id: SettingId): IEditableSetting | null => {
	const { getEditableSetting, subscribeToEditableSetting } = useContext(EditableSettingsContext);

	const subscription = useMemo(() => ({
		getCurrentValue: (): (IEditableSetting | null) => getEditableSetting(_id),
		subscribe: (cb: (setting: IEditableSetting | null) => void): (() => void) => subscribeToEditableSetting(_id, cb),
	}), [getEditableSetting, subscribeToEditableSetting, _id]);

	return useSubscription(subscription);
};

export const usePrivilegedSettingActions = (_id: SettingId): {
	update: () => void;
	reset: () => void;
} => {
	const { querySetting } = useContext(SettingsContext);
	const { dispatchToEditableSettings } = useContext(EditableSettingsContext);

	const update: (() => void) = useDebouncedCallback(({ value, editor }) => {
		const persistedSetting = querySetting(_id).getCurrentValue();
		if (!persistedSetting) {
			return;
		}

		dispatchToEditableSettings([{
			_id,
			...value !== undefined && { value },
			...editor !== undefined && { editor },
			changed:
				JSON.stringify(persistedSetting.value) !== JSON.stringify(value)
				|| JSON.stringify(persistedSetting.editor) !== JSON.stringify(editor),
		}]);
	}, 100, [querySetting, _id, dispatchToEditableSettings]);

	const reset: (() => void) = useDebouncedCallback(() => {
		const persistedSetting = querySetting(_id).getCurrentValue();
		if (!persistedSetting) {
			return;
		}

		dispatchToEditableSettings([{
			_id: persistedSetting._id,
			value: persistedSetting.packageValue,
			editor: persistedSetting.packageEditor,
			changed:
				JSON.stringify(persistedSetting.packageValue) !== JSON.stringify(persistedSetting.value)
				|| JSON.stringify(persistedSetting.packageEditor) !== JSON.stringify(persistedSetting.editor),
		}]);
	}, 100, [querySetting, _id, dispatchToEditableSettings]);

	return { update, reset };
};
