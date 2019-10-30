import React, { createContext, useCallback, useContext, useMemo, useRef } from 'react';

import { useSettingsState } from './SettingsState';
import { useReactiveValue } from '../../../hooks/useReactiveValue';

const SettingContext = createContext({});

export function SettingState({ children, setting: _id }) {
	const { state, update, reset, isDisabled } = useSettingsState();

	const setting = state.find((setting) => setting._id === _id);
	const disabled = useReactiveValue(() => isDisabled(setting), [setting.blocked, setting.enableQuery]);

	const updateRef = useRef(update);
	const resetRef = useRef(reset);
	const settingRef = useRef(setting);
	updateRef.current = update;
	resetRef.current = reset;
	settingRef.current = setting;

	const updateSetting = useCallback((data) => {
		const { current: update } = updateRef;
		const { current: setting } = settingRef;
		update({ fields: [{ ...setting, ...data }] });
	}, []);

	const resetSetting = useCallback(() => {
		const { current: reset } = resetRef;
		const { current: setting } = settingRef;
		reset({ fields: [setting] });
	}, []);

	const contextValue = useMemo(() => ({
		...setting,
		disabled,
		update: updateSetting,
		reset: resetSetting,
	}), [setting, disabled]);

	return <SettingContext.Provider children={children} value={contextValue} />;
}

export const useSetting = () => useContext(SettingContext);
