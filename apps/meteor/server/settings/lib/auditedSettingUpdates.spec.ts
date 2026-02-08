import type { ISetting, SettingValue } from '@rocket.chat/core-typings';

import { updateAuditedByUser, updateAuditedBySystem, updateAuditedByApp, resetAuditedSettingByUser } from './auditedSettingUpdates';

const mockCreateAuditServerEvent = jest.fn();
jest.mock('@rocket.chat/models', () => ({
	ServerEvents: {
		createAuditServerEvent: (...args: any[]) => mockCreateAuditServerEvent(...args),
	},
}));

const mockSettings = new Map<string, ISetting>();

jest.mock('../../../app/settings/server/cached', () => {
	const mockGetSetting = jest.fn((key: string) => mockSettings.get(key));
	return {
		settings: {
			getSetting: mockGetSetting,
		},
	};
});

describe('auditedSettingUpdates', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockSettings.clear();
	});

	describe('Masking sensitive settings', () => {
		it('should mask password type settings with more than 8 characters', () => {
			const settingId = 'SMTP_Password';
			const originalValue = 'secretpassword123';
			const newValue = 'newpassword456';

			mockSettings.set(settingId, {
				_id: settingId,
				type: 'password',
				value: originalValue,
			} as ISetting);

			const actor = {
				_id: 'user1234567',
				username: 'testuser133532',
				ip: '127.0.0.1',
				useragent: 'test-agent',
			};

			const mockFn = jest.fn((_key: string, value: SettingValue) => value);
			const auditedFn = updateAuditedByUser(actor)(mockFn, settingId, newValue);

			expect(auditedFn).toBe(newValue);
			expect(mockCreateAuditServerEvent).toHaveBeenCalledWith(
				'settings.changed',
				{
					id: settingId,
					previous: 'sec**************',
					current: 'new***********',
				},
				{
					type: 'user',
					...actor,
				},
			);
		});

		it('should mask password type settings with 8 or fewer characters completely', () => {
			const settingId = 'Short_Password';

			mockSettings.set(settingId, {
				_id: settingId,
				type: 'password',
				value: 'abc',
			} as ISetting);

			const actor = {
				_id: 'user123',
				username: 'testuser',
				ip: '127.0.0.1',
				useragent: 'test-agent',
			};

			const mockFn = jest.fn((_key: string, value: SettingValue) => value);
			const auditedFn = updateAuditedByUser(actor)(mockFn, settingId, 'xy');

			expect(auditedFn).toBe('xy');
			expect(mockCreateAuditServerEvent).toHaveBeenCalledWith(
				'settings.changed',
				{
					id: settingId,
					previous: '***',
					current: '**',
				},
				{
					type: 'user',
					...actor,
				},
			);
		});

		it('should mask secret type settings', () => {
			const settingId = 'SMTP_Username';

			mockSettings.set(settingId, {
				_id: settingId,
				type: 'string',
				secret: true,
				value: 'myusername',
			} as ISetting);

			const actor = {
				_id: 'user123',
				username: 'testuser',
				ip: '127.0.0.1',
				useragent: 'test-agent',
			};

			const mockFn = jest.fn((_key: string, value: SettingValue) => value);
			const auditedFn = updateAuditedByUser(actor)(mockFn, settingId, 'newusername');

			expect(auditedFn).toBe('newusername');
			expect(mockCreateAuditServerEvent).toHaveBeenCalledWith(
				'settings.changed',
				{
					id: settingId,
					previous: 'myu*******',
					current: 'new********',
				},
				{
					type: 'user',
					...actor,
				},
			);
		});
	});

	describe('updateAuditedBySystem', () => {
		it('should mask sensitive settings for system actor', () => {
			const settingId = 'SMTP_Password';

			mockSettings.set(settingId, {
				_id: settingId,
				type: 'password',
				value: 'oldpassword',
			} as ISetting);

			const mockFn = jest.fn((_key: string, value: SettingValue) => value);
			const auditedFn = updateAuditedBySystem({});

			auditedFn(mockFn, settingId, 'newpassword123');

			expect(mockCreateAuditServerEvent).toHaveBeenCalledWith(
				'settings.changed',
				{
					id: settingId,
					previous: 'old********',
					current: 'new***********',
				},
				{
					type: 'system',
				},
			);
		});
	});

	describe('updateAuditedByApp', () => {
		it('should mask sensitive settings for app actor', () => {
			const settingId = 'LDAP_Authentication_Password';

			mockSettings.set(settingId, {
				_id: settingId,
				type: 'password',
				value: 'oldpass',
			} as ISetting);

			const actor = {
				type: 'app' as const,
				_id: 'app123',
			};

			const mockFn = jest.fn((_key: string, value: SettingValue) => value);
			const auditedFn = updateAuditedByApp(actor);

			auditedFn(mockFn, settingId, 'ldappass');

			expect(mockCreateAuditServerEvent).toHaveBeenCalledWith(
				'settings.changed',
				{
					id: settingId,
					previous: '*******',
					current: '********',
				},
				{
					type: 'app',
					_id: 'app123',
				},
			);
		});
	});

	describe('resetAuditedSettingByUser', () => {
		it('should mask sensitive settings when resetting', () => {
			const settingId = 'SMTP_Password';

			mockSettings.set(settingId, {
				_id: settingId,
				type: 'password',
				value: 'currentpassword123',
				packageValue: 'packagepassword456',
			} as ISetting);

			const actor = {
				_id: 'user123',
				username: 'testuser',
				ip: '127.0.0.1',
				useragent: 'test-agent',
			};

			const mockFn = jest.fn((key: string) => key);
			const auditedFn = resetAuditedSettingByUser(actor);

			auditedFn(mockFn, settingId);

			expect(mockCreateAuditServerEvent).toHaveBeenCalledWith(
				'settings.changed',
				{
					id: settingId,
					previous: 'cur***************',
					current: 'pac***************',
				},
				{
					type: 'user',
					...actor,
				},
			);
		});
	});

	describe('Edge cases', () => {
		it('should handle exactly 8 character values', () => {
			const settingId = 'Three_Char_Password';

			mockSettings.set(settingId, {
				_id: settingId,
				type: 'password',
				value: 'abc',
			} as ISetting);

			const actor = {
				_id: 'user1234',
				username: 'testuser',
				ip: '127.0.0.1',
				useragent: 'test-agent',
			};

			const mockFn = jest.fn((_key: string, value: SettingValue) => value);
			const auditedFn = updateAuditedByUser(actor)(mockFn, settingId, 'xyz');

			expect(auditedFn).toBe('xyz');
			expect(mockCreateAuditServerEvent).toHaveBeenCalledWith(
				'settings.changed',
				{
					id: settingId,
					previous: '***',
					current: '***',
				},
				{
					type: 'user',
					...actor,
				},
			);
		});

		it('should handle non-string values (numbers)', () => {
			const settingId = 'Numeric_Password';

			mockSettings.set(settingId, {
				_id: settingId,
				type: 'password',
				value: 12345,
			} as ISetting);

			const actor = {
				_id: 'user123',
				username: 'testuser',
				ip: '127.0.0.1',
				useragent: 'test-agent',
			};

			const mockFn = jest.fn((_key: string, value: SettingValue) => value);
			const auditedFn = updateAuditedByUser(actor)(mockFn, settingId, 67890);

			expect(auditedFn).toBe(67890);
			expect(mockCreateAuditServerEvent).toHaveBeenCalledWith(
				'settings.changed',
				{
					id: settingId,
					previous: '*****',
					current: '*****',
				},
				{
					type: 'user',
					...actor,
				},
			);
		});
	});
});
