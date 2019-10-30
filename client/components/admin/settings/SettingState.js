import React, { createContext, useCallback, useContext, useMemo, useRef } from 'react';

import { useSettingsState } from './SettingsState';
import { useReactiveValue } from '../../../hooks/useReactiveValue';

const SettingContext = createContext({});

export function SettingState({ children, setting: _id }) {
	const { state, persistedState, hydrate, isDisabled } = useSettingsState();

	const setting = state.find((setting) => setting._id === _id);
	const disabled = useReactiveValue(() => isDisabled(setting), [setting.blocked, setting.enableQuery]);

	const settingRef = useRef();
	const persistedStateRef = useRef();

	settingRef.current = setting;
	persistedStateRef.current = persistedState;

	const update = useCallback((data) => {
		const setting = { ...settingRef.current, ...data };
		const { current: persistedState } = persistedStateRef;

		const persistedSetting = persistedState.find(({ _id }) => _id === setting._id);

		const changes = [{
			_id: setting._id,
			value: setting.value,
			editor: setting.editor,
			changed: (setting.value !== persistedSetting.value) || (setting.editor !== persistedSetting.editor),
		}];

		hydrate(changes);
	}, []);

	const reset = useCallback(() => {
		const { current: setting } = settingRef;
		const { current: persistedState } = persistedStateRef;

		const { _id, value, packageValue, editor } = persistedState.find(({ _id }) => _id === setting._id);
		const changes = [{
			_id,
			value: packageValue,
			editor,
			changed: packageValue !== value,
		}];

		hydrate(changes);
	}, []);

	const contextValue = useMemo(() => ({
		...setting,
		disabled,
		update,
		reset,
	}), [setting, disabled]);

	return <SettingContext.Provider children={children} value={contextValue} />;
}

export const useSetting = () => useContext(SettingContext);
