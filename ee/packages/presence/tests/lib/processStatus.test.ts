import { describe, test, expect } from '@jest/globals';
import { UserStatus } from '@rocket.chat/core-typings';

import { processStatus } from '../../src/lib/processStatus';

describe('processStatus', () => {
	test('should return the connection status when the default status is online', () => {
		expect(processStatus(UserStatus.ONLINE, UserStatus.ONLINE)).toBe(UserStatus.ONLINE);
		expect(processStatus(UserStatus.AWAY, UserStatus.ONLINE)).toBe(UserStatus.AWAY);
		expect(processStatus(UserStatus.OFFLINE, UserStatus.ONLINE)).toBe(UserStatus.OFFLINE);
	});

	test('should return status busy when the default status is busy', () => {
		expect(processStatus(UserStatus.ONLINE, UserStatus.BUSY)).toBe(UserStatus.BUSY);
		expect(processStatus(UserStatus.AWAY, UserStatus.BUSY)).toBe(UserStatus.BUSY);
		expect(processStatus(UserStatus.OFFLINE, UserStatus.BUSY)).toBe(UserStatus.OFFLINE);
	});

	test('should return status away when the default status is away', () => {
		expect(processStatus(UserStatus.ONLINE, UserStatus.AWAY)).toBe(UserStatus.AWAY);
		expect(processStatus(UserStatus.AWAY, UserStatus.AWAY)).toBe(UserStatus.AWAY);
		expect(processStatus(UserStatus.OFFLINE, UserStatus.AWAY)).toBe(UserStatus.OFFLINE);
	});

	test('should return status offline when the default status is offline', () => {
		expect(processStatus(UserStatus.ONLINE, UserStatus.OFFLINE)).toBe(UserStatus.OFFLINE);
		expect(processStatus(UserStatus.AWAY, UserStatus.OFFLINE)).toBe(UserStatus.OFFLINE);
		expect(processStatus(UserStatus.OFFLINE, UserStatus.OFFLINE)).toBe(UserStatus.OFFLINE);
	});
});
