import type { SettingId, ISetting, GroupId, SectionName, TabId } from '@rocket.chat/core-typings';
import { createContext } from 'react';

export type SettingsContextQuery = {
	readonly _id?: SettingId[] | RegExp;
	readonly group?: GroupId;
	readonly section?: SectionName;
	readonly tab?: TabId;
};

export type SettingsContextValue = {
	readonly hasPrivateAccess: boolean;
	readonly isLoading: boolean;
	readonly querySetting: (
		_id: SettingId,
	) => [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => ISetting | undefined];
	readonly querySettings: (
		query: SettingsContextQuery,
	) => [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => ISetting[]];
	readonly dispatch: (changes: Partial<ISetting>[]) => Promise<void>;
};

export const SettingsContext = createContext<SettingsContextValue>({
	hasPrivateAccess: false,
	isLoading: false,
	querySetting: () => [(): (() => void) => (): void => undefined, (): undefined => undefined],
	querySettings: () => [(): (() => void) => (): void => undefined, (): ISetting[] => []],
	dispatch: async () => undefined,
});
