import type { ISetting } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { useSetting, useSettings } from '@rocket.chat/ui-contexts';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';

import SettingsProvider from './SettingsProvider';
import { LoggedSettingsCachedStore, PrivateSettingsCachedStore, PublicSettingsCachedStore } from '../cachedStores';

jest.mock('../cachedStores', () => {
	const { createDocumentMapStore } = jest.requireActual<typeof import('../lib/cachedStores/DocumentMapStore')>(
		'../lib/cachedStores/DocumentMapStore',
	);

	const createCachedStore = () => ({ store: createDocumentMapStore<ISetting>(), useReady: () => true });

	return {
		LoggedSettingsCachedStore: createCachedStore(),
		PublicSettingsCachedStore: createCachedStore(),
		PrivateSettingsCachedStore: createCachedStore(),
	};
});

jest.mock('../lib/cachedStores/CachedStore', () => ({
	PrivateCachedStore: class {},
}));

jest.mock('../hooks/useShowSettingAlerts', () => ({
	useShowSettingAlerts: () => jest.fn(),
}));

const createSetting = (_id: string, value: string): ISetting => ({
	_id,
	value,
	packageValue: value,
	type: 'string',
	public: false,
	env: false,
	blocked: false,
	sorter: 0,
	i18nLabel: _id,
	ts: new Date(),
	createdAt: new Date(),
	_updatedAt: new Date(),
});

const settingsQuery = { _id: ['Logged_Setting'] };

const wrapperWith = (permissions: string[]) => {
	const root = mockAppRoot();
	permissions.forEach((permission) => root.withPermission(permission));
	const AppRoot = root.build();

	return ({ children }: { children: ReactNode }) => (
		<AppRoot>
			<SettingsProvider>{children}</SettingsProvider>
		</AppRoot>
	);
};

describe('SettingsProvider', () => {
	beforeEach(() => {
		LoggedSettingsCachedStore.store.getState().replaceAll([createSetting('Logged_Setting', 'logged-value')]);
		PublicSettingsCachedStore.store.getState().replaceAll([createSetting('Public_Setting', 'public-value')]);
		PrivateSettingsCachedStore.store.getState().replaceAll([]);
	});

	it('reads signed-in and public settings for a user who cannot manage settings', () => {
		const wrapper = wrapperWith([]);

		expect(renderHook(() => useSetting('Logged_Setting'), { wrapper }).result.current).toBe('logged-value');
		expect(renderHook(() => useSetting('Public_Setting'), { wrapper }).result.current).toBe('public-value');
	});

	it('falls back to the signed-in settings when the private store does not hold the setting', () => {
		const wrapper = wrapperWith(['manage-selected-settings']);

		expect(renderHook(() => useSetting('Logged_Setting'), { wrapper }).result.current).toBe('logged-value');
	});

	it('prefers the private store value for a settings manager', () => {
		PrivateSettingsCachedStore.store.getState().replaceAll([createSetting('Logged_Setting', 'private-value')]);
		const wrapper = wrapperWith(['view-privileged-setting']);

		expect(renderHook(() => useSetting('Logged_Setting'), { wrapper }).result.current).toBe('private-value');
	});

	it('lists a setting held by both stores only once, with the private store value', () => {
		PrivateSettingsCachedStore.store.getState().replaceAll([createSetting('Logged_Setting', 'private-value')]);
		const wrapper = wrapperWith(['view-privileged-setting']);

		const { result } = renderHook(() => useSettings(settingsQuery), { wrapper });

		expect(result.current).toEqual([expect.objectContaining({ _id: 'Logged_Setting', value: 'private-value' })]);
	});
});
