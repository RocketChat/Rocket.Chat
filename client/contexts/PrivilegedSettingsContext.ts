import { useDebouncedCallback, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { createContext, useContext, useMemo } from 'react';
import { useSubscription, Subscription, Unsubscribe } from 'use-subscription';

import {
	ISetting,
	SectionName,
	SettingId,
	GroupId,
	SettingType,
} from '../../definition/ISetting';
import { useBatchSettingsDispatch } from './SettingsContext';
import { useToastMessageDispatch } from './ToastMessagesContext';
import { useTranslation, useLoadLanguage } from './TranslationContext';
import { useUser } from './UserContext';

interface IEditableSetting extends ISetting {
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

interface IEditableSettingsQuery {
	_id?: SettingId[];
	group?: GroupId;
	section?: SectionName;
	changed?: boolean;
}

// TODO: split editing into another context
type PrivilegedSettingsContextValue = {
	authorized: boolean;
	isLoading: boolean;
	querySetting: (_id: SettingId) => Subscription<IEditableSetting | undefined>;
	querySettings: (query: IEditableSettingsQuery) => Subscription<IEditableSetting[]>;
	getSettings: () => IEditableSetting[];
	subscribeToSettings: (cb: (settings: IEditableSetting[]) => void) => (() => void);
	getSettingsGroup: (groupId: GroupId) => GroupDescriptor | null;
	subscribeToSettingsGroup: (groupId: GroupId, cb: (groupDescriptor: GroupDescriptor) => void) => (() => void);
	getSettingsSection: (groupId: GroupId, sectionName: SectionName) => SectionDescriptor | null;
	subscribeToSettingsSection: (groupId: GroupId, sectionName: SectionName, cb: (sectionDescriptor: SectionDescriptor) => void) => (() => void);
	getEditableSetting: (_id: SettingId) => IEditableSetting | null;
	subscribeToEditableSetting: (_id: SettingId, cb: (setting: IEditableSetting) => void) => (() => void);
	patch: (changes: any[]) => void;
};

export const PrivilegedSettingsContext = createContext<PrivilegedSettingsContextValue>({
	authorized: false,
	isLoading: false,
	querySetting: () => ({
		getCurrentValue: (): undefined => undefined,
		subscribe: (): Unsubscribe => (): void => undefined,
	}),
	querySettings: () => ({
		getCurrentValue: (): IEditableSetting[] => [],
		subscribe: (): Unsubscribe => (): void => undefined,
	}),
	getSettings: () => [],
	subscribeToSettings: () => (): void => undefined,
	getSettingsGroup: () => null,
	subscribeToSettingsGroup: () => (): void => undefined,
	getSettingsSection: () => null,
	subscribeToSettingsSection: () => (): void => undefined,
	getEditableSetting: () => null,
	subscribeToEditableSetting: () => (): void => undefined,
	patch: () => undefined,
});

export const usePrivilegedSettingsAuthorized = (): boolean =>
	useContext(PrivilegedSettingsContext).authorized;

export const useIsPrivilegedSettingsLoading = (): boolean =>
	useContext(PrivilegedSettingsContext).isLoading;

export const useSetting = (_id: SettingId): unknown => {
	const { querySetting } = useContext(PrivilegedSettingsContext);
	return useSubscription(useMemo(() => querySetting(_id), [querySetting, _id]))?.value;
};

export const usePrivilegedSettingsGroups = (filter?: string): any => {
	const { getSettings, subscribeToSettings } = useContext(PrivilegedSettingsContext);

	const subscription = useMemo(() => ({
		getCurrentValue: (): IEditableSetting[] => getSettings(),
		subscribe: (cb: (setting: IEditableSetting[]) => void): (() => void) => subscribeToSettings(cb),
	}), [getSettings, subscribeToSettings]);

	const settings = useSubscription(subscription);

	const t = useTranslation();

	const filterPredicate = useMemo((): ((setting: IEditableSetting) => boolean) => {
		if (!filter) {
			return (): boolean => true;
		}

		try {
			const filterRegex = new RegExp(filter, 'i');
			return (setting: IEditableSetting): boolean => filterRegex.test(t(setting.i18nLabel || setting._id));
		} catch (e) {
			return (setting: IEditableSetting): boolean => t(setting.i18nLabel || setting._id).slice(0, filter.length) === filter;
		}
	}, [filter, t]);

	return useMemo(() => {
		const groupIds = Array.from(new Set(
			settings
				.filter(filterPredicate)
				.map((setting) => setting.group || setting._id),
		));

		return settings
			.filter(({ type, group, _id }) => type === SettingType.GROUP && groupIds.includes(group || _id))
			.sort((a, b) => t(a.i18nLabel || a._id).localeCompare(t(b.i18nLabel || b._id)));
	}, [settings, filterPredicate, t]);
};

export const usePrivilegedSettingsGroup = (groupId: GroupId): GroupDescriptor | null => {
	const { getSettingsGroup, subscribeToSettingsGroup } = useContext(PrivilegedSettingsContext);

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
	const { getSettingsGroup, querySetting: getSetting, patch } = useContext(PrivilegedSettingsContext);

	const batchSetSettings = useBatchSettingsDispatch();
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
			await batchSetSettings(changes);

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
		patch(
			(getSettingsGroup(groupId)?.editableSettings ?? [])
				.filter(({ changed }) => changed)
				.map((editableSetting) => {
					const setting = getSetting(editableSetting._id).getCurrentValue();
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
	const { getSettingsSection, subscribeToSettingsSection } = useContext(PrivilegedSettingsContext);

	const subscription = useMemo(() => ({
		getCurrentValue: (): (SectionDescriptor | null) => getSettingsSection(groupId, sectionName),
		subscribe: (cb: (sectionDescriptor: SectionDescriptor | null) => void): (() => void) => subscribeToSettingsSection(groupId, sectionName, cb),
	}), [groupId, sectionName, getSettingsSection, subscribeToSettingsSection]);

	return useSubscription(subscription);
};

export const usePrivilegedSettingsSectionActions = (groupId: GroupId, sectionName: SectionName): {
	reset: () => void;
} => {
	const { getSettingsSection, patch } = useContext(PrivilegedSettingsContext);

	const reset = useMutableCallback(() => {
		const sectionDescriptor = getSettingsSection(groupId, sectionName);

		if (!sectionDescriptor) {
			return;
		}

		patch(
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
	const { getEditableSetting, subscribeToEditableSetting } = useContext(PrivilegedSettingsContext);

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
	const { querySetting, patch } = useContext(PrivilegedSettingsContext);

	const update: (() => void) = useDebouncedCallback(({ value, editor }) => {
		const persistedSetting = querySetting(_id).getCurrentValue();
		if (!persistedSetting) {
			return;
		}

		patch([{
			_id,
			...value !== undefined && { value },
			...editor !== undefined && { editor },
			changed:
				JSON.stringify(persistedSetting.value) !== JSON.stringify(value)
				|| JSON.stringify(persistedSetting.editor) !== JSON.stringify(editor),
		}]);
	}, 100, [querySetting, _id, patch]);

	const reset: (() => void) = useDebouncedCallback(() => {
		const persistedSetting = querySetting(_id).getCurrentValue();
		if (!persistedSetting) {
			return;
		}

		patch([{
			_id: persistedSetting._id,
			value: persistedSetting.packageValue,
			editor: persistedSetting.packageEditor,
			changed:
				JSON.stringify(persistedSetting.packageValue) !== JSON.stringify(persistedSetting.value)
				|| JSON.stringify(persistedSetting.packageEditor) !== JSON.stringify(persistedSetting.editor),
		}]);
	}, 100, [querySetting, _id, patch]);

	return { update, reset };
};
