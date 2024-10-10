import type { SettingId, ISetting, GroupId, SectionName, TabId } from '@rocket.chat/core-typings';
import { createContext } from 'react';

export type SettingsContextQuery = {
	_id?: SettingId[] | RegExp;
	group?: GroupId;
	section?: SectionName;
	tab?: TabId;
};

export type SettingsContextValue = {
	hasPrivateAccess: boolean;
	isLoading: boolean;
	querySetting: (_id: SettingId) => [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => ISetting | undefined];
	querySettings: (query: SettingsContextQuery) => [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => ISetting[]];
	dispatch: (
		changes: {
			_id: ISetting['_id'];
			value: ISetting['value'];
		}[],
	) => Promise<void>;
};

export const SettingsContext = createContext<SettingsContextValue>({
	hasPrivateAccess: false,
	isLoading: false,
	querySetting: () => [(): (() => void) => (): void => undefined, (): undefined => undefined],
	querySettings: () => [(): (() => void) => (): void => undefined, (): ISetting[] => []],
	dispatch: async () => undefined,
});
