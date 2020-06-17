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
	dispatch: () => undefined,
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

export const useSettingsDispatch = () =>
	useContext(SettingsContext).dispatch;

export const useSettingSetValue = (_id) => {
	const dispatch = useSettingsDispatch();
	return useCallback((value) => dispatch([{ _id, value }]), [dispatch, _id]);
};
