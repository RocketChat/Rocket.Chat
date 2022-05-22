import type { SettingId, ISetting, GroupId, SectionName, TabId } from '@rocket.chat/core-typings';
import { createContext } from 'react';
import type { Subscription, Unsubscribe } from 'use-subscription';

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
