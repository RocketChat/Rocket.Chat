import type { ISetting } from '@rocket.chat/core-typings';
import { SettingsContext } from '@rocket.chat/ui-contexts';
import type { ContextType, ReactNode } from 'react';

const settingContextValue: ContextType<typeof SettingsContext> = {
	hasPrivateAccess: true,
	querySetting: (_id: string) => [() => () => undefined, () => undefined],
	querySettings: () => [() => () => undefined, () => []],
	dispatch: async () => undefined,
};

const createSettingContextValue = ({ settings }: { settings?: Record<string, ISetting['value']> }): ContextType<typeof SettingsContext> => {
	const cache = new Map<string, ISetting>();

	return {
		...settingContextValue,
		...(settings && {
			querySetting: (_id: string) => [
				() => () => undefined,
				() => {
					if (cache.has(_id)) {
						return cache.get(_id);
					}
					cache.set(_id, { value: settings[_id] } as ISetting);
					return cache.get(_id);
				},
			],
		}),
	};
};

export type MockedSettingsContextProps = { children: ReactNode; settings?: Record<string, ISetting['value']> };

export const MockedSettingsContext = ({ settings, children }: MockedSettingsContextProps) => {
	return <SettingsContext.Provider value={createSettingContextValue({ settings })}>{children}</SettingsContext.Provider>;
};
