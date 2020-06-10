import { useDebouncedCallback, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { Tracker } from 'meteor/tracker';
import { createContext, useContext, RefObject, useState, useEffect, useLayoutEffect, useMemo, useCallback } from 'react';
import { useSubscription } from 'use-subscription';

import { useReactiveValue } from '../hooks/useReactiveValue';
import { useBatchSettingsDispatch } from './SettingsContext';
import { useToastMessageDispatch } from './ToastMessagesContext';
import { useTranslation, useLoadLanguage } from './TranslationContext';
import { useUser } from './UserContext';

export type PrivilegedSetting = object & {
	_id: string;
	type: string;
	blocked: boolean;
	enableQuery: unknown;
	group: string;
	section: string;
	changed: boolean;
	value: unknown;
	packageValue: unknown;
	packageEditor: unknown;
	editor: unknown;
	sorter: string;
	i18nLabel: string;
	disabled?: boolean;
	update?: () => void;
	reset?: () => void;
};

export type PrivilegedSettingsState = {
	settings: PrivilegedSetting[];
	persistedSettings: PrivilegedSetting[];
};

type EqualityFunction<T> = (a: T, b: T) => boolean;

type PrivilegedSettingsContextValue = {
	authorized: boolean;
	subscribers: Set<(state: PrivilegedSettingsState) => void>;
	stateRef: RefObject<PrivilegedSettingsState>;
	hydrate: (changes: any[]) => void;
	isDisabled: (setting: PrivilegedSetting) => boolean;
};

export const PrivilegedSettingsContext = createContext<PrivilegedSettingsContextValue>({
	authorized: false,
	subscribers: new Set<(state: PrivilegedSettingsState) => void>(),
	stateRef: {
		current: {
			settings: [],
			persistedSettings: [],
		},
	},
	hydrate: () => undefined,
	isDisabled: () => false,
});

export const usePrivilegedSettingsAuthorized = (): boolean =>
	useContext(PrivilegedSettingsContext).authorized;

export const usePrivilegedSettingsGroups = (filter?: string): any => {
	const { subscribers, stateRef } = useContext(PrivilegedSettingsContext);
	const t = useTranslation();

	const getCurrentValue = useCallback(() => {
		const filterRegex = filter ? new RegExp(filter, 'i') : null;

		const filterPredicate = (setting: PrivilegedSetting): boolean =>
			!filterRegex || filterRegex.test(t(setting.i18nLabel || setting._id));

		const groupIds = Array.from(new Set(
			(stateRef.current?.persistedSettings ?? [])
				.filter(filterPredicate)
				.map((setting) => setting.group || setting._id),
		));

		return (stateRef.current?.persistedSettings ?? [])
			.filter(({ type, group, _id }) => type === 'group' && groupIds.includes(group || _id))
			.sort((a, b) => t(a.i18nLabel || a._id).localeCompare(t(b.i18nLabel || b._id)));
	}, [filter]);

	const subscribe = useCallback((cb) => {
		const handleUpdate = (): void => {
			cb(getCurrentValue());
		};

		subscribers.add(handleUpdate);

		return (): void => {
			subscribers.delete(handleUpdate);
		};
	}, [getCurrentValue]);

	return useSubscription(useMemo(() => ({
		getCurrentValue,
		subscribe,
	}), [getCurrentValue, subscribe]));
};

const useSelector = <T>(
	selector: (state: PrivilegedSettingsState) => T,
	equalityFunction: EqualityFunction<T> = Object.is,
): T | null => {
	const { subscribers, stateRef } = useContext(PrivilegedSettingsContext);
	const [value, setValue] = useState<T | null>(() => (stateRef.current ? selector(stateRef.current) : null));

	const handleUpdate = useMutableCallback((state: PrivilegedSettingsState) => {
		const newValue = selector(state);

		if (!value || !equalityFunction(newValue, value)) {
			setValue(newValue);
		}
	});

	useEffect(() => {
		subscribers.add(handleUpdate);

		return (): void => {
			subscribers.delete(handleUpdate);
		};
	}, [handleUpdate]);

	useLayoutEffect(() => {
		handleUpdate(stateRef.current);
	});

	return value;
};

export const usePrivilegedSettingsGroup = (groupId: string): any => {
	const group = useSelector((state) => state.settings.find(({ _id, type }) => _id === groupId && type === 'group'));

	const filterSettings = (settings: any[]): any[] => settings.filter(({ group }) => group === groupId);

	const changed = useSelector((state) => filterSettings(state.settings).some(({ changed }) => changed));
	const sections = useSelector((state) => Array.from(new Set(filterSettings(state.settings).map(({ section }) => section || ''))), (a, b) => a.length === b.length && a.join() === b.join());

	const batchSetSettings = useBatchSettingsDispatch();
	const { stateRef, hydrate } = useContext(PrivilegedSettingsContext);

	const dispatchToastMessage = useToastMessageDispatch() as any;
	const t = useTranslation() as (key: string, ...args: any[]) => string;
	const loadLanguage = useLoadLanguage() as any;
	const user = useUser() as any;

	const save = useMutableCallback(async () => {
		const state = stateRef.current;
		const settings = filterSettings(state?.settings ?? []);

		const changes = settings.filter(({ changed }) => changed)
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

				try {
					await loadLanguage(lng);
					dispatchToastMessage({ type: 'success', message: t('Settings_updated', { lng }) });
				} catch (error) {
					dispatchToastMessage({ type: 'error', message: error });
				}
				return;
			}

			dispatchToastMessage({ type: 'success', message: t('Settings_updated') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	const cancel = useMutableCallback(() => {
		const state = stateRef.current;
		const settings = filterSettings(state?.settings ?? []);
		const persistedSettings = filterSettings(state?.persistedSettings ?? []);

		const changes = settings.filter(({ changed }) => changed)
			.map((field) => {
				const { _id, value, editor } = persistedSettings.find(({ _id }) => _id === field._id);
				return { _id, value, editor, changed: false };
			});

		hydrate(changes);
	});

	return group && { ...group, sections, changed, save, cancel };
};

export const usePrivilegedSettingsSection = (groupId: string, sectionName?: string): any => {
	sectionName = sectionName || '';

	const filterSettings = (settings: any[]): any[] =>
		settings.filter(({ group, section }) => group === groupId && ((!sectionName && !section) || (sectionName === section)));

	const canReset = useSelector((state) => filterSettings(state.settings).some(({ value, packageValue }) => JSON.stringify(value) !== JSON.stringify(packageValue)));
	const settingsIds = useSelector((state) => filterSettings(state.settings).map(({ _id }) => _id), (a, b) => a.length === b.length && a.join() === b.join());

	const { stateRef, hydrate, isDisabled } = useContext(PrivilegedSettingsContext);

	const reset = useMutableCallback(() => {
		const state = stateRef.current;
		const settings = filterSettings(state?.settings ?? [])
			.filter((setting) => Tracker.nonreactive(() => !isDisabled(setting))); // Ignore disabled settings
		const persistedSettings = filterSettings(state?.persistedSettings ?? []);

		const changes = settings.map((setting) => {
			const { _id, value, packageValue, packageEditor } = persistedSettings.find(({ _id }) => _id === setting._id);
			return {
				_id,
				value: packageValue,
				editor: packageEditor,
				changed: JSON.stringify(packageValue) !== JSON.stringify(value),
			};
		});

		hydrate(changes);
	});

	return {
		name: sectionName,
		canReset,
		settings: settingsIds,
		reset,
	};
};

export const usePrivilegedSettingActions = (persistedSetting: PrivilegedSetting | null | undefined): {
	update: () => void;
	reset: () => void;
} => {
	const { hydrate } = useContext(PrivilegedSettingsContext);

	const update = useDebouncedCallback(({ value, editor }) => {
		const changes = [{
			_id: persistedSetting?._id,
			...value !== undefined && { value },
			...editor !== undefined && { editor },
			changed: JSON.stringify(persistedSetting?.value) !== JSON.stringify(value) || JSON.stringify(editor) !== JSON.stringify(persistedSetting?.editor),
		}];

		hydrate(changes);
	}, 100, [hydrate, persistedSetting]) as () => void;

	const reset = useDebouncedCallback(() => {
		const changes = [{
			_id: persistedSetting?._id,
			value: persistedSetting?.packageValue,
			editor: persistedSetting?.packageEditor,
			changed: JSON.stringify(persistedSetting?.packageValue) !== JSON.stringify(persistedSetting?.value) || JSON.stringify(persistedSetting?.packageEditor) !== JSON.stringify(persistedSetting?.editor),
		}];

		hydrate(changes);
	}, 100, [hydrate, persistedSetting]) as () => void;

	return { update, reset };
};

export const usePrivilegedSettingDisabledState = (setting: PrivilegedSetting | null | undefined): boolean => {
	const { isDisabled } = useContext(PrivilegedSettingsContext);
	return useReactiveValue(() => (setting ? isDisabled(setting) : false), [setting?.blocked, setting?.enableQuery]) as unknown as boolean;
};

export const usePrivilegedSettingsSectionChangedState = (groupId: string, sectionName: string): boolean =>
	!!useSelector((state) =>
		state.settings.some(({ group, section, changed }) =>
			group === groupId && ((!sectionName && !section) || (sectionName === section)) && changed));

export const usePrivilegedSetting = (_id: string): PrivilegedSetting | null | undefined => {
	const selectSetting = (settings: PrivilegedSetting[]): PrivilegedSetting | undefined => settings.find((setting) => setting._id === _id);

	const setting = useSelector((state) => selectSetting(state.settings));
	const persistedSetting = useSelector((state) => selectSetting(state.persistedSettings));

	const { update, reset } = usePrivilegedSettingActions(persistedSetting);
	const disabled = usePrivilegedSettingDisabledState(persistedSetting);

	if (!setting) {
		return null;
	}

	return {
		...setting,
		disabled,
		update,
		reset,
	};
};
