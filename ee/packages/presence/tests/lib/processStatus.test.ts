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

	test('should handle all status combinations comprehensively', () => {
		const statuses = [UserStatus.ONLINE, UserStatus.AWAY, UserStatus.BUSY, UserStatus.OFFLINE];

		// Test all combinations
		statuses.forEach((connection) => {
			statuses.forEach((defaultStatus) => {
				const result = processStatus(connection, defaultStatus);

				// OFFLINE connection always returns OFFLINE
				if (connection === UserStatus.OFFLINE) {
					expect(result).toBe(UserStatus.OFFLINE);
				}
				// ONLINE default returns connection status
				else if (defaultStatus === UserStatus.ONLINE) {
					expect(result).toBe(connection);
				}
				// Any other default returns that default
				else {
					expect(result).toBe(defaultStatus);
				}
			});
		});
	});

	test('should prioritize OFFLINE connection over any default', () => {
		const defaults = [UserStatus.ONLINE, UserStatus.AWAY, UserStatus.BUSY, UserStatus.OFFLINE];

		defaults.forEach((defaultStatus) => {
			const result = processStatus(UserStatus.OFFLINE, defaultStatus);
			expect(result).toBe(UserStatus.OFFLINE);
		});
	});

	test('should return connection status when default is ONLINE', () => {
		const connections = [UserStatus.ONLINE, UserStatus.AWAY, UserStatus.BUSY, UserStatus.OFFLINE];

		connections.forEach((connection) => {
			const result = processStatus(connection, UserStatus.ONLINE);
			expect(result).toBe(connection);
		});
	});

	test('should override non-offline connection with non-online default', () => {
		const connections = [UserStatus.ONLINE, UserStatus.AWAY, UserStatus.BUSY];
		const defaults = [UserStatus.AWAY, UserStatus.BUSY, UserStatus.OFFLINE];

		connections.forEach((connection) => {
			defaults.forEach((defaultStatus) => {
				const result = processStatus(connection, defaultStatus);
				expect(result).toBe(defaultStatus);
			});
		});
	});

	test('should be deterministic with same inputs', () => {
		// Multiple calls with same arguments should return same result
		for (let i = 0; i < 100; i++) {
			expect(processStatus(UserStatus.ONLINE, UserStatus.BUSY)).toBe(UserStatus.BUSY);
			expect(processStatus(UserStatus.AWAY, UserStatus.ONLINE)).toBe(UserStatus.AWAY);
			expect(processStatus(UserStatus.OFFLINE, UserStatus.ONLINE)).toBe(UserStatus.OFFLINE);
		}
	});

	test('should handle the "user is actively offline" case', () => {
		// When connection is OFFLINE and default is OFFLINE
		const result = processStatus(UserStatus.OFFLINE, UserStatus.OFFLINE);
		expect(result).toBe(UserStatus.OFFLINE);
	});

	test('should respect user preference when connected', () => {
		// User sets themselves to BUSY, they're connected
		expect(processStatus(UserStatus.ONLINE, UserStatus.BUSY)).toBe(UserStatus.BUSY);
		expect(processStatus(UserStatus.AWAY, UserStatus.BUSY)).toBe(UserStatus.BUSY);
		expect(processStatus(UserStatus.BUSY, UserStatus.BUSY)).toBe(UserStatus.BUSY);

		// User sets themselves to AWAY, they're connected
		expect(processStatus(UserStatus.ONLINE, UserStatus.AWAY)).toBe(UserStatus.AWAY);
		expect(processStatus(UserStatus.AWAY, UserStatus.AWAY)).toBe(UserStatus.AWAY);
		expect(processStatus(UserStatus.BUSY, UserStatus.AWAY)).toBe(UserStatus.AWAY);
	});

	test('should reflect actual connection state when default is ONLINE', () => {
		// User preference is ONLINE, show actual connection state
		expect(processStatus(UserStatus.ONLINE, UserStatus.ONLINE)).toBe(UserStatus.ONLINE);
		expect(processStatus(UserStatus.AWAY, UserStatus.ONLINE)).toBe(UserStatus.AWAY);
		expect(processStatus(UserStatus.BUSY, UserStatus.ONLINE)).toBe(UserStatus.BUSY);
	});

	test('should handle contradiction: user wants OFFLINE but is connected', () => {
		// User sets default to OFFLINE but is actually connected
		expect(processStatus(UserStatus.ONLINE, UserStatus.OFFLINE)).toBe(UserStatus.OFFLINE);
		expect(processStatus(UserStatus.AWAY, UserStatus.OFFLINE)).toBe(UserStatus.OFFLINE);
		expect(processStatus(UserStatus.BUSY, UserStatus.OFFLINE)).toBe(UserStatus.OFFLINE);
	});

	test('should validate the two-rule logic structure', () => {
		// Rule 1: OFFLINE connection always wins
		expect(processStatus(UserStatus.OFFLINE, UserStatus.ONLINE)).toBe(UserStatus.OFFLINE);
		expect(processStatus(UserStatus.OFFLINE, UserStatus.AWAY)).toBe(UserStatus.OFFLINE);
		expect(processStatus(UserStatus.OFFLINE, UserStatus.BUSY)).toBe(UserStatus.OFFLINE);
		expect(processStatus(UserStatus.OFFLINE, UserStatus.OFFLINE)).toBe(UserStatus.OFFLINE);

		// Rule 2: ONLINE default shows connection status
		expect(processStatus(UserStatus.ONLINE, UserStatus.ONLINE)).toBe(UserStatus.ONLINE);
		expect(processStatus(UserStatus.AWAY, UserStatus.ONLINE)).toBe(UserStatus.AWAY);
		expect(processStatus(UserStatus.BUSY, UserStatus.ONLINE)).toBe(UserStatus.BUSY);

		// Default: everything else returns default
		expect(processStatus(UserStatus.ONLINE, UserStatus.AWAY)).toBe(UserStatus.AWAY);
		expect(processStatus(UserStatus.ONLINE, UserStatus.BUSY)).toBe(UserStatus.BUSY);
		expect(processStatus(UserStatus.AWAY, UserStatus.BUSY)).toBe(UserStatus.BUSY);
		expect(processStatus(UserStatus.BUSY, UserStatus.AWAY)).toBe(UserStatus.AWAY);
	});

	test('should be a pure function (no side effects)', () => {
		const connection = UserStatus.ONLINE;
		const defaultStatus = UserStatus.BUSY;

		const result1 = processStatus(connection, defaultStatus);
		const result2 = processStatus(connection, defaultStatus);

		// Same inputs should produce same outputs
		expect(result1).toBe(result2);
		expect(result1).toBe(UserStatus.BUSY);
	});
});
