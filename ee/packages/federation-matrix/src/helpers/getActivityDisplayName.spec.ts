import { LocalBroker, ServiceClass, api } from '@rocket.chat/core-services';
import type { SettingValue } from '@rocket.chat/core-typings';

import { getActivityDisplayName } from './getActivityDisplayName';

class SettingsService extends ServiceClass {
	protected name = 'settings';

	private values = new Map<string, SettingValue>();

	stub(settingId: string, value: SettingValue): void {
		this.values.set(settingId, value);
	}

	async get(settingId: string): Promise<SettingValue> {
		return this.values.get(settingId) as SettingValue;
	}
}

const settings = new SettingsService();

beforeAll(() => {
	api.setBroker(new LocalBroker());
	api.registerService(settings);
});

afterAll(async () => {
	await api.destroyService(settings);
});

const withRealName = (value: boolean) => settings.stub('UI_Use_Real_Name', value);

describe('getActivityDisplayName', () => {
	describe('when UI_Use_Real_Name is disabled', () => {
		beforeEach(() => withRealName(false));

		it('should return the username', async () => {
			await expect(getActivityDisplayName({ username: '@alice:example.com', name: 'Alice' })).resolves.toBe('@alice:example.com');
		});

		it('should not fall back to the name when the username is missing', async () => {
			await expect(getActivityDisplayName({ username: undefined, name: 'Alice' })).resolves.toBeUndefined();
		});
	});

	describe('when UI_Use_Real_Name is enabled', () => {
		beforeEach(() => withRealName(true));

		it('should return the name', async () => {
			await expect(getActivityDisplayName({ username: '@alice:example.com', name: 'Alice' })).resolves.toBe('Alice');
		});

		it('should fall back to the username when the name is empty', async () => {
			await expect(getActivityDisplayName({ username: '@alice:example.com', name: '' })).resolves.toBe('@alice:example.com');
		});

		it('should fall back to the username when the name is missing', async () => {
			await expect(getActivityDisplayName({ username: '@alice:example.com' })).resolves.toBe('@alice:example.com');
		});
	});
});
