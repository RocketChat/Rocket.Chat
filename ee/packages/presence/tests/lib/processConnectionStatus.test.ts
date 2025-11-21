import { describe, expect, test } from '@jest/globals';
import { UserStatus } from '@rocket.chat/core-typings';

import { processConnectionStatus } from '../../src/lib/processConnectionStatus';

describe('Presence micro service', () => {
	test('should return connection as online when there is a connection online', () => {
		expect(processConnectionStatus(UserStatus.OFFLINE, UserStatus.ONLINE)).toBe(UserStatus.ONLINE);
		expect(processConnectionStatus(UserStatus.ONLINE, UserStatus.ONLINE)).toBe(UserStatus.ONLINE);
		expect(processConnectionStatus(UserStatus.BUSY, UserStatus.ONLINE)).toBe(UserStatus.ONLINE);
		expect(processConnectionStatus(UserStatus.AWAY, UserStatus.ONLINE)).toBe(UserStatus.ONLINE);
	});

	test('should return the connections status if the other connection is offline', () => {
		expect(processConnectionStatus(UserStatus.OFFLINE, UserStatus.OFFLINE)).toBe(UserStatus.OFFLINE);
		expect(processConnectionStatus(UserStatus.ONLINE, UserStatus.OFFLINE)).toBe(UserStatus.ONLINE);
		expect(processConnectionStatus(UserStatus.AWAY, UserStatus.OFFLINE)).toBe(UserStatus.AWAY);
	});
});
