import { createContext, useCallback, useContext, useMemo } from 'react';
import { useSubscription } from 'use-subscription';

export const SettingsContext = createContext({
	isLoading: false,
	querySetting: () => ({
		getCurrentValue: () => undefined,
		subscribe: () => () => undefined,
	}),
	querySettings: () => ({
		getCurrentValue: () => [],
		subscribe: () => () => undefined,
	}),
	set: async () => {},
	batchSet: async () => {},
});

export const useIsSettingsContextLoading = () =>
	useContext(SettingsContext).isLoading;

export const useSettingStructure = (_id) => {
	const { querySetting } = useContext(SettingsContext);
	const subscription = useMemo(() => querySetting(_id), [querySetting, _id]);
	return useSubscription(subscription);
};

export const useSetting = (_id) =>
	useSettingStructure(_id)?.value;

export const useSettings = (query) => {
	const { querySettings } = useContext(SettingsContext);
	const subscription = useMemo(() => querySettings(query ?? {}), [querySettings, query]);
	return useSubscription(subscription);
};

export const useSettingDispatch = (name) => {
	const { set } = useContext(SettingsContext);
	return useCallback((value) => set(name, value), [set, name]);
};

export const useBatchSettingsDispatch = () => {
	const { batchSet } = useContext(SettingsContext);
	return useCallback((entries) => batchSet(entries), [batchSet]);
};
