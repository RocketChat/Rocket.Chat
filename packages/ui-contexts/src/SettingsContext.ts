import type { ISetting } from '@rocket.chat/core-typings';
import { createContext } from 'react';

export type SettingsContextQuery = {
	readonly _id?: ISetting['_id'][] | RegExp;
	readonly group?: ISetting['_id'];
	readonly section?: string;
	readonly tab?: ISetting['_id'];
	readonly skip?: number;
	readonly limit?: number;
};

export type SettingsContextValue = {
	readonly hasPrivateAccess: boolean;
	readonly isLoading: boolean;
	readonly querySetting: (
		_id: ISetting['_id'],
	) => [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => ISetting | undefined];
	readonly querySettings: (
		query: SettingsContextQuery,
	) => [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => ISetting[]];
	readonly countSettings: () => number;
	readonly dispatch: (changes: Partial<ISetting>[]) => Promise<void>;
};

export const SettingsContext = createContext<SettingsContextValue>({
	hasPrivateAccess: false,
	isLoading: false,
	querySetting: () => [(): (() => void) => (): void => undefined, (): undefined => undefined],
	querySettings: () => [(): (() => void) => (): void => undefined, (): ISetting[] => []],
	countSettings: () => 0,
	dispatch: async () => undefined,
});
