import { useDebouncedCallback, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { createContext, useContext, useMemo } from 'react';
import { useSubscription } from 'use-subscription';

import { useBatchSettingsDispatch } from './SettingsContext';
import { useToastMessageDispatch } from './ToastMessagesContext';
import { useTranslation, useLoadLanguage } from './TranslationContext';
import { useUser } from './UserContext';

type PrivilegedSettingId = string;
type PrivilegedSettingSectionName = string | null | undefined;
type PrivilegedSettingGroupId = string;

type PrivilegedSetting = {
	_id: PrivilegedSettingId;
	type: string;
	blocked: boolean;
	enableQuery: unknown;
	group: PrivilegedSettingGroupId;
	section: PrivilegedSettingSectionName;
	changed: boolean;
	value: unknown;
	packageValue: unknown;
	packageEditor: unknown;
	editor: unknown;
	sorter: string;
	i18nLabel: string;
	disabled?: boolean;
};

type SectionDescriptor = {
	name: PrivilegedSettingSectionName;
	editableSettings: PrivilegedSetting[];
	settings: PrivilegedSettingId[];
	changed: boolean;
	canReset: boolean;
};

type GroupDescriptor = PrivilegedSetting & {
	editableSettings: PrivilegedSetting[];
	sections: PrivilegedSettingSectionName[];
	changed: boolean;
};

// TODO: split editing into another context
type PrivilegedSettingsContextValue = {
	authorized: boolean;
	isLoading: boolean;
	getSettings: () => PrivilegedSetting[];
	subscribeToSettings: (cb: (settings: PrivilegedSetting[]) => void) => (() => void);
	getSettingsGroup: (groupId: PrivilegedSettingGroupId) => GroupDescriptor | null;
	subscribeToSettingsGroup: (groupId: PrivilegedSettingGroupId, cb: (groupDescriptor: GroupDescriptor) => void) => (() => void);
	getSettingsSection: (groupId: PrivilegedSettingGroupId, sectionName: PrivilegedSettingSectionName) => SectionDescriptor | null;
	subscribeToSettingsSection: (groupId: PrivilegedSettingGroupId, sectionName: PrivilegedSettingSectionName, cb: (sectionDescriptor: SectionDescriptor) => void) => (() => void);
	getSetting: (_id: PrivilegedSettingId) => PrivilegedSetting | null;
	subscribeToSetting: (_id: PrivilegedSettingId, cb: (setting: PrivilegedSetting) => void) => (() => void);
	getEditableSetting: (_id: PrivilegedSettingId) => PrivilegedSetting | null;
	subscribeToEditableSetting: (_id: PrivilegedSettingId, cb: (setting: PrivilegedSetting) => void) => (() => void);
	patch: (changes: any[]) => void;
};

export const PrivilegedSettingsContext = createContext<PrivilegedSettingsContextValue>({
	authorized: false,
	isLoading: false,
	getSettings: () => [],
	subscribeToSettings: () => (): void => undefined,
	getSettingsGroup: () => null,
	subscribeToSettingsGroup: () => (): void => undefined,
	getSettingsSection: () => null,
	subscribeToSettingsSection: () => (): void => undefined,
	getSetting: () => null,
	subscribeToSetting: () => (): void => undefined,
	getEditableSetting: () => null,
	subscribeToEditableSetting: () => (): void => undefined,
	patch: () => undefined,
});

export const usePrivilegedSettingsAuthorized = (): boolean =>
	useContext(PrivilegedSettingsContext).authorized;

export const useIsPrivilegedSettingsLoading = (): boolean =>
	useContext(PrivilegedSettingsContext).isLoading;

export const usePrivilegedSettingsGroups = (filter?: string): any => {
	const { getSettings, subscribeToSettings } = useContext(PrivilegedSettingsContext);

	const subscription = useMemo(() => ({
		getCurrentValue: (): PrivilegedSetting[] => getSettings(),
		subscribe: (cb: (setting: PrivilegedSetting[]) => void): (() => void) => subscribeToSettings(cb),
	}), [getSettings, subscribeToSettings]);

	const settings = useSubscription(subscription);

	const t = useTranslation();

	const filterPredicate = useMemo((): ((setting: PrivilegedSetting) => boolean) => {
		if (!filter) {
			return (): boolean => true;
		}

		try {
			const filterRegex = new RegExp(filter, 'i');
			return (setting: PrivilegedSetting): boolean => filterRegex.test(t(setting.i18nLabel || setting._id));
		} catch (e) {
			return (setting: PrivilegedSetting): boolean => t(setting.i18nLabel || setting._id).slice(0, filter.length) === filter;
		}
	}, [filter]);

	return useMemo(() => {
		const groupIds = Array.from(new Set(
			settings
				.filter(filterPredicate)
				.map((setting) => setting.group || setting._id),
		));

		return settings
			.filter(({ type, group, _id }) => type === 'group' && groupIds.includes(group || _id))
			.sort((a, b) => t(a.i18nLabel || a._id).localeCompare(t(b.i18nLabel || b._id)));
	}, [settings, filterPredicate]);
};

export const usePrivilegedSettingsGroup = (groupId: PrivilegedSettingId): GroupDescriptor | null => {
	const { getSettingsGroup, subscribeToSettingsGroup } = useContext(PrivilegedSettingsContext);

	const subscription = useMemo(() => ({
		getCurrentValue: (): (GroupDescriptor | null) => getSettingsGroup(groupId),
		subscribe: (cb: (groupDescriptor: GroupDescriptor | null) => void): (() => void) => subscribeToSettingsGroup(groupId, cb),
	}), [groupId, getSettingsGroup, subscribeToSettingsGroup]);

	return useSubscription(subscription);
};

export const usePrivilegedSettingsGroupActions = (groupId: PrivilegedSettingId): {
	save: () => void;
	cancel: () => void;
} => {
	const { getSettingsGroup, getSetting, patch } = useContext(PrivilegedSettingsContext);

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
					const setting = getSetting(editableSetting._id);
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

export const usePrivilegedSettingsSection = (groupId: PrivilegedSettingGroupId, sectionName: PrivilegedSettingSectionName): SectionDescriptor | null => {
	const { getSettingsSection, subscribeToSettingsSection } = useContext(PrivilegedSettingsContext);

	const subscription = useMemo(() => ({
		getCurrentValue: (): (SectionDescriptor | null) => getSettingsSection(groupId, sectionName),
		subscribe: (cb: (sectionDescriptor: SectionDescriptor | null) => void): (() => void) => subscribeToSettingsSection(groupId, sectionName, cb),
	}), [groupId, sectionName, getSettingsSection, subscribeToSettingsSection]);

	return useSubscription(subscription);
};

export const usePrivilegedSettingsSectionActions = (groupId: PrivilegedSettingGroupId, sectionName?: PrivilegedSettingSectionName): {
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

export const usePrivilegedSetting = (_id: PrivilegedSettingId): PrivilegedSetting | null => {
	const { getEditableSetting, subscribeToEditableSetting } = useContext(PrivilegedSettingsContext);

	const subscription = useMemo(() => ({
		getCurrentValue: (): (PrivilegedSetting | null) => getEditableSetting(_id),
		subscribe: (cb: (setting: PrivilegedSetting | null) => void): (() => void) => subscribeToEditableSetting(_id, cb),
	}), [_id, getEditableSetting, subscribeToEditableSetting]);

	return useSubscription(subscription);
};

export const usePrivilegedSettingActions = (_id: PrivilegedSettingId): {
	update: () => void;
	reset: () => void;
} => {
	const { getSetting, patch } = useContext(PrivilegedSettingsContext);

	const update: (() => void) = useDebouncedCallback(({ value, editor }) => {
		const persistedSetting = getSetting(_id);

		const changes = [{
			_id,
			...value !== undefined && { value },
			...editor !== undefined && { editor },
			changed: JSON.stringify(persistedSetting?.value) !== JSON.stringify(value) || JSON.stringify(persistedSetting?.editor) !== JSON.stringify(editor),
		}];

		patch(changes);
	}, 100, [patch, getSetting, _id]);

	const reset: (() => void) = useDebouncedCallback(() => {
		const persistedSetting = getSetting(_id);
		const changes = [{
			_id: persistedSetting?._id,
			value: persistedSetting?.packageValue,
			editor: persistedSetting?.packageEditor,
			changed: JSON.stringify(persistedSetting?.packageValue) !== JSON.stringify(persistedSetting?.value) || JSON.stringify(persistedSetting?.packageEditor) !== JSON.stringify(persistedSetting?.editor),
		}];

		patch(changes);
	}, 100, [patch, getSetting, _id]);

	return { update, reset };
};
