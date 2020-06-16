import { createContext, useCallback, useContext, useMemo } from 'react';
import { useSubscription } from 'use-subscription';

export const SettingsContext = createContext({
	querySetting: () => ({
		getCurrentValue: () => undefined,
		subscribe: () => undefined,
	}),
	set: async () => {},
	batchSet: async () => {},
});

export const useSetting = (name) => {
	const { querySetting } = useContext(SettingsContext);
	return useSubscription(useMemo(() => querySetting(name), [querySetting, name]))?.value;
};

export const useSettingDispatch = (name) => {
	const { set } = useContext(SettingsContext);
	return useCallback((value) => set(name, value), [set, name]);
};

export const useBatchSettingsDispatch = () => {
	const { batchSet } = useContext(SettingsContext);
	return useCallback((entries) => batchSet(entries), [batchSet]);
};
