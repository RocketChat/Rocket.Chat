import { useDebouncedCallback, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { Tracker } from 'meteor/tracker';
import { createContext, createRef, useContext, RefObject, useState, useEffect, useLayoutEffect } from 'react';

import { useReactiveValue } from '../hooks/useReactiveValue';
import { useBatchSettingsDispatch } from './SettingsContext';
import { useToastMessageDispatch } from './ToastMessagesContext';
import { useTranslation, useLoadLanguage } from './TranslationContext';
import { useUser } from './UserContext';

type PrivateSettingsState = {
	settings: any[];
	persistedSettings: any[];
};

type EqualityFunction = (a: any, b: any) => boolean;

type PrivateSettingsContextValue = {
	subscribers: Set<(state: PrivateSettingsState) => void>;
	stateRef: RefObject<PrivateSettingsState>;
	hydrate: (changes: any[]) => void;
	isDisabled: (setting: any) => boolean;
};

export const PrivateSettingsContext = createContext<PrivateSettingsContextValue>({
	subscribers: new Set<(state: PrivateSettingsState) => void>(),
	stateRef: createRef(),
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	hydrate: () => {},
	isDisabled: () => false,
});

const useSelector = (
	selector: (state: PrivateSettingsState) => any,
	equalityFunction: EqualityFunction = Object.is,
): any => {
	const { subscribers, stateRef } = useContext(PrivateSettingsContext);
	const [value, setValue] = useState<any>(() => (stateRef.current ? selector(stateRef.current) : null));

	const handleUpdate = useMutableCallback((state) => {
		const newValue = selector(state);

		if (!equalityFunction(newValue, value)) {
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

export const useGroup = (groupId: string): any => {
	const group = useSelector((state) => state.settings.find(({ _id, type }) => _id === groupId && type === 'group'));

	const filterSettings = (settings: any[]): any[] => settings.filter(({ group }) => group === groupId);

	const changed = useSelector((state) => filterSettings(state.settings).some(({ changed }) => changed));
	const sections = useSelector((state) => Array.from(new Set(filterSettings(state.settings).map(({ section }) => section || ''))), (a, b) => a.length === b.length && a.join() === b.join());

	const batchSetSettings = useBatchSettingsDispatch();
	const { stateRef, hydrate } = useContext(PrivateSettingsContext);

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

export const useSection = (groupId: string, sectionName?: string): any => {
	sectionName = sectionName || '';

	const filterSettings = (settings: any[]): any[] =>
		settings.filter(({ group, section }) => group === groupId && ((!sectionName && !section) || (sectionName === section)));

	const canReset = useSelector((state) => filterSettings(state.settings).some(({ value, packageValue }) => JSON.stringify(value) !== JSON.stringify(packageValue)));
	const settingsIds = useSelector((state) => filterSettings(state.settings).map(({ _id }) => _id), (a, b) => a.length === b.length && a.join() === b.join());

	const { stateRef, hydrate, isDisabled } = useContext(PrivateSettingsContext);

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

export const useSettingActions = (persistedSetting: any): any => {
	const { hydrate } = useContext(PrivateSettingsContext);

	const update = useDebouncedCallback(({ value, editor }) => {
		const changes = [{
			_id: persistedSetting._id,
			...value !== undefined && { value },
			...editor !== undefined && { editor },
			changed: JSON.stringify(persistedSetting.value) !== JSON.stringify(value) || JSON.stringify(editor) !== JSON.stringify(persistedSetting.editor),
		}];

		hydrate(changes);
	}, 100, [hydrate, persistedSetting]);

	const reset = useDebouncedCallback(() => {
		const { _id, value, packageValue, packageEditor, editor } = persistedSetting;

		const changes = [{
			_id,
			value: packageValue,
			editor: packageEditor,
			changed: JSON.stringify(packageValue) !== JSON.stringify(value) || JSON.stringify(packageEditor) !== JSON.stringify(editor),
		}];

		hydrate(changes);
	}, 100, [hydrate, persistedSetting]);

	return { update, reset };
};

export const useSettingDisabledState = ({ blocked, enableQuery }: any): any => {
	const { isDisabled } = useContext(PrivateSettingsContext);
	return useReactiveValue(() => isDisabled({ blocked, enableQuery }), [blocked, enableQuery]);
};

export const useSectionChangedState = (groupId: string, sectionName: string): any =>
	useSelector((state) =>
		state.settings.some(({ group, section, changed }) =>
			group === groupId && ((!sectionName && !section) || (sectionName === section)) && changed));

export const useSetting = (_id: string): any => {
	const selectSetting = (settings: any[]): any => settings.find((setting) => setting._id === _id);

	const setting = useSelector((state) => selectSetting(state.settings));
	const persistedSetting = useSelector((state) => selectSetting(state.persistedSettings));

	const { update, reset } = useSettingActions(persistedSetting);
	const disabled = useSettingDisabledState(persistedSetting);

	return {
		...setting,
		disabled,
		update,
		reset,
	};
};
