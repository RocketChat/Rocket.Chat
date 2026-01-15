import type { ISetting, SettingValue } from '@rocket.chat/core-typings';

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

import {
	updateAuditedByUser,
	updateAuditedBySystem,
	updateAuditedByApp,
	resetAuditedSettingByUser,
} from './auditedSettingUpdates';

describe('auditedSettingUpdates', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockSettings.clear();
	});

	describe('Masking sensitive settings', () => {
		it('should mask password type settings with more than 3 characters', () => {
			const settingId = 'SMTP_Password';
			const originalValue = 'secretpassword123';
			const newValue = 'newpassword456';

			mockSettings.set(settingId, {
				_id: settingId,
				type: 'password',
				value: originalValue,
			} as ISetting);

			const actor = {
				_id: 'user123',
				username: 'testuser',
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

		it('should mask password type settings with 3 or fewer characters completely', () => {
			const settingId = 'Short_Password';
			const originalValue = 'abc';
			const newValue = 'xy';

			mockSettings.set(settingId, {
				_id: settingId,
				type: 'password',
				value: originalValue,
			} as ISetting);

			const actor = {
				_id: 'user123',
				username: 'testuser',
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
			const originalValue = 'myusername';
			const newValue = 'newusername';

			mockSettings.set(settingId, {
				_id: settingId,
				type: 'string',
				secret: true,
				value: originalValue,
			} as ISetting);

			const actor = {
				_id: 'user123',
				username: 'testuser',
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
					previous: 'myu*******',
					current: 'new********',
				},
				{
					type: 'user',
					...actor,
				},
			);
		});

		it('should not mask non-sensitive settings', () => {
			const settingId = 'Site_Url';
			const originalValue = 'https://old.example.com';
			const newValue = 'https://new.example.com';

			mockSettings.set(settingId, {
				_id: settingId,
				type: 'string',
				secret: false,
				value: originalValue,
			} as ISetting);

			const actor = {
				_id: 'user123',
				username: 'testuser',
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
					previous: originalValue,
					current: newValue,
				},
				{
					type: 'user',
					...actor,
				},
			);
		});

		it('should preserve undefined/null/empty values for sensitive settings', () => {
			const settingId = 'SMTP_Password';

			mockSettings.set(settingId, {
				_id: settingId,
				type: 'password',
				value: undefined,
			} as ISetting);

			const actor = {
				_id: 'user123',
				username: 'testuser',
				ip: '127.0.0.1',
				useragent: 'test-agent',
			};

			const mockFn = jest.fn((_key: string, value: SettingValue) => value);
			const auditedFn = updateAuditedByUser(actor)(mockFn, settingId, '');

			expect(auditedFn).toBe('');
			expect(mockCreateAuditServerEvent).toHaveBeenCalledWith(
				'settings.changed',
				{
					id: settingId,
					previous: undefined,
					current: '',
				},
				{
					type: 'user',
					...actor,
				},
			);
		});
	});

	describe('updateAuditedByUser', () => {
		it('should call the original function and create audit event', () => {
			const settingId = 'Test_Setting';
			const newValue = 'newvalue';

			mockSettings.set(settingId, {
				_id: settingId,
				type: 'string',
				value: 'oldvalue',
			} as ISetting);

			const actor = {
				_id: 'user123',
				username: 'testuser',
				ip: '127.0.0.1',
				useragent: 'test-agent',
			};

			const mockFn = jest.fn((_key: string, value: SettingValue) => `result-${String(value)}`);
			const auditedFn = updateAuditedByUser(actor);

			const result = auditedFn(mockFn, settingId, newValue);

			expect(result).toBe(`result-${newValue}`);
			expect(mockFn).toHaveBeenCalledWith(settingId, newValue);
			expect(mockCreateAuditServerEvent).toHaveBeenCalledTimes(1);
		});
	});

	describe('updateAuditedBySystem', () => {
		it('should call the original function and create audit event with system actor', () => {
			const settingId = 'Test_Setting';
			const newValue = 'newvalue';

			mockSettings.set(settingId, {
				_id: settingId,
				type: 'string',
				value: 'oldvalue',
			} as ISetting);

			const actor = {
				type: 'system' as const,
				reason: 'System update',
			};

			const mockFn = jest.fn((_key: string, value: SettingValue) => value);
			const auditedFn = updateAuditedBySystem(actor);

			const result = auditedFn(mockFn, settingId, newValue);

			expect(result).toBe(newValue);
			expect(mockFn).toHaveBeenCalledWith(settingId, newValue);
			expect(mockCreateAuditServerEvent).toHaveBeenCalledWith(
				'settings.changed',
				{
					id: settingId,
					previous: 'oldvalue',
					current: newValue,
				},
				{
					type: 'system',
					reason: 'System update',
				},
			);
		});

		it('should mask sensitive settings for system actor', () => {
			const settingId = 'SMTP_Password';
			const newValue = 'newpassword123';

			mockSettings.set(settingId, {
				_id: settingId,
				type: 'password',
				value: 'oldpassword',
			} as ISetting);

			const actor = {};

			const mockFn = jest.fn((_key: string, value: SettingValue) => value);
			const auditedFn = updateAuditedBySystem(actor);

			auditedFn(mockFn, settingId, newValue);

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
		it('should call the original function and create audit event with app actor', () => {
			const settingId = 'Test_Setting';
			const newValue = 'newvalue';

			mockSettings.set(settingId, {
				_id: settingId,
				type: 'string',
				value: 'oldvalue',
			} as ISetting);

			const actor = {
				type: 'app' as const,
				_id: 'app123',
				reason: 'App update',
			};

			const mockFn = jest.fn((_key: string, value: SettingValue) => value);
			const auditedFn = updateAuditedByApp(actor);

			const result = auditedFn(mockFn, settingId, newValue);

			expect(result).toBe(newValue);
			expect(mockFn).toHaveBeenCalledWith(settingId, newValue);
			expect(mockCreateAuditServerEvent).toHaveBeenCalledWith(
				'settings.changed',
				{
					id: settingId,
					previous: 'oldvalue',
					current: newValue,
				},
				{
					type: 'app',
					_id: 'app123',
					reason: 'App update',
				},
			);
		});

		it('should mask sensitive settings for app actor', () => {
			const settingId = 'LDAP_Authentication_Password';
			const newValue = 'ldappass';

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

			auditedFn(mockFn, settingId, newValue);

			expect(mockCreateAuditServerEvent).toHaveBeenCalledWith(
				'settings.changed',
				{
					id: settingId,
					previous: 'old****',
					current: 'lda*****',
				},
				{
					type: 'app',
					_id: 'app123',
				},
			);
		});
	});

	describe('resetAuditedSettingByUser', () => {
		it('should call the original function and create audit event', () => {
			const settingId = 'Test_Setting';

			mockSettings.set(settingId, {
				_id: settingId,
				type: 'string',
				value: 'currentvalue',
				packageValue: 'packagevalue',
			} as ISetting);

			const actor = {
				_id: 'user123',
				username: 'testuser',
				ip: '127.0.0.1',
				useragent: 'test-agent',
			};

			const mockFn = jest.fn((key: string) => `reset-${key}`);
			const auditedFn = resetAuditedSettingByUser(actor);

			const result = auditedFn(mockFn, settingId);

			expect(result).toBe(`reset-${settingId}`);
			expect(mockFn).toHaveBeenCalledWith(settingId);
			expect(mockCreateAuditServerEvent).toHaveBeenCalledWith(
				'settings.changed',
				{
					id: settingId,
					previous: 'currentvalue',
					current: 'packagevalue',
				},
				{
					type: 'user',
					...actor,
				},
			);
		});

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
		it('should handle single character values', () => {
			const settingId = 'Single_Char_Password';

			mockSettings.set(settingId, {
				_id: settingId,
				type: 'password',
				value: 'a',
			} as ISetting);

			const actor = {
				_id: 'user123',
				username: 'testuser',
				ip: '127.0.0.1',
				useragent: 'test-agent',
			};

			const mockFn = jest.fn((_key: string, value: SettingValue) => value);
			const auditedFn = updateAuditedByUser(actor)(mockFn, settingId, 'b');

			expect(auditedFn).toBe('b');
			expect(mockCreateAuditServerEvent).toHaveBeenCalledWith(
				'settings.changed',
				{
					id: settingId,
					previous: '*', 
					current: '*',
				},
				{
					type: 'user',
					...actor,
				},
			);
		});

		it('should handle exactly 3 character values', () => {
			const settingId = 'Three_Char_Password';

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
					previous: '123**',
					current: '678**',
				},
				{
					type: 'user',
					...actor,
				},
			);
		});
	});
});

