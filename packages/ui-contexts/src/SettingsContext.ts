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
	readonly querySetting: (
		_id: ISetting['_id'],
	) => [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => ISetting | undefined];
	readonly querySettings: (
		query: SettingsContextQuery,
	) => [subscribe: (onStoreChange: () => void) => () => void, getSnapshot: () => ISetting[]];
	readonly dispatch: (changes: Partial<ISetting>[]) => Promise<void>;
};

export const SettingsContext = createContext<SettingsContextValue>({
	hasPrivateAccess: false,
	querySetting: () => [(): (() => void) => (): void => undefined, (): undefined => undefined],
	querySettings: () => [(): (() => void) => (): void => undefined, (): ISetting[] => []],
	dispatch: async () => undefined,
});
