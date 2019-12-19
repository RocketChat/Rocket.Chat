import { createContext, useCallback, useContext } from 'react';

import { useObservableValue } from '../hooks/useObservableValue';

export const SettingsContext = createContext({
	get: () => {},
	set: async () => {},
	batchSet: async () => {},
});

export const useSetting = (name) => {
	const { get } = useContext(SettingsContext);
	return useObservableValue((listener) => get(name, listener), [name]);
};

export const useSettingDispatch = (name) => {
	const { set } = useContext(SettingsContext);
	return useCallback((value) => set(name, value), [set, name]);
};

export const useBatchSettingsDispatch = () => {
	const { batchSet } = useContext(SettingsContext);
	return useCallback((entries) => batchSet(entries), []);
};
