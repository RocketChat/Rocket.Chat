import { createContext, useCallback, useContext, useMemo } from 'react';
import { useSubscription, Subscription, Unsubscribe } from 'use-subscription';

import { SettingId, ISetting, GroupId, SectionName, TabId } from '../../definition/ISetting';

export type SettingsContextQuery = {
	readonly _id?: SettingId[];
	readonly group?: GroupId;
	readonly section?: SectionName;
	readonly tab?: TabId;
};

export type SettingsContextValue = {
	readonly hasPrivateAccess: boolean;
	readonly isLoading: boolean;
	readonly querySetting: (_id: SettingId) => Subscription<ISetting | undefined>;
	readonly querySettings: (query: SettingsContextQuery) => Subscription<ISetting[]>;
	readonly dispatch: (changes: Partial<ISetting>[]) => Promise<void>;
};

export const SettingsContext = createContext<SettingsContextValue>({
	hasPrivateAccess: false,
	isLoading: false,
	querySetting: () => ({
		getCurrentValue: (): undefined => undefined,
		subscribe: (): Unsubscribe => (): void => undefined,
	}),
	querySettings: () => ({
		getCurrentValue: (): ISetting[] => [],
		subscribe: (): Unsubscribe => (): void => undefined,
	}),
	dispatch: async () => undefined,
});

export const useIsPrivilegedSettingsContext = (): boolean => useContext(SettingsContext).hasPrivateAccess;

export const useIsSettingsContextLoading = (): boolean => useContext(SettingsContext).isLoading;

export const useSettingStructure = (_id: SettingId): ISetting | undefined => {
	const { querySetting } = useContext(SettingsContext);
	const subscription = useMemo(() => querySetting(_id), [querySetting, _id]);
	return useSubscription(subscription);
};

export const useSetting = (_id: SettingId): unknown | undefined => useSettingStructure(_id)?.value;

export const useSettings = (query?: SettingsContextQuery): ISetting[] => {
	const { querySettings } = useContext(SettingsContext);
	const subscription = useMemo(() => querySettings(query ?? {}), [querySettings, query]);
	return useSubscription(subscription);
};

export const useSettingsDispatch = (): ((changes: Partial<ISetting>[]) => Promise<void>) => useContext(SettingsContext).dispatch;

export const useSettingSetValue = <T extends ISetting['value']>(_id: SettingId): ((value: T) => Promise<void>) => {
	const dispatch = useSettingsDispatch();
	return useCallback((value: T) => dispatch([{ _id, value }]), [dispatch, _id]);
};
