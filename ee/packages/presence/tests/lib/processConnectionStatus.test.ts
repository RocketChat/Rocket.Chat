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

	test('should handle all possible status combinations', () => {
		const statuses = [UserStatus.ONLINE, UserStatus.AWAY, UserStatus.BUSY, UserStatus.OFFLINE];

		statuses.forEach((current) => {
			statuses.forEach((incoming) => {
				const result = processConnectionStatus(current, incoming);

				// ONLINE always wins except against itself
				if (incoming === UserStatus.ONLINE) {
					expect(result).toBe(UserStatus.ONLINE);
				}
				// BUSY wins over AWAY and OFFLINE
				else if (incoming === UserStatus.BUSY) {
					if (current === UserStatus.ONLINE) {
						expect(result).toBe(UserStatus.ONLINE);
					} else {
						expect(result).toBe(UserStatus.BUSY);
					}
				}
				// AWAY wins over OFFLINE
				else if (incoming === UserStatus.AWAY) {
					if (current === UserStatus.ONLINE || current === UserStatus.BUSY) {
						expect(result).toBe(current);
					} else {
						expect(result).toBe(UserStatus.AWAY);
					}
				}
				// OFFLINE doesn't change anything unless current is also OFFLINE
				else {
					expect(result).toBe(current);
				}
			});
		});
	});

	test('should maintain transitivity in status precedence', () => {
		// If A > B and B > C, then A > C
		// ONLINE > BUSY > AWAY > OFFLINE

		// ONLINE > BUSY
		expect(processConnectionStatus(UserStatus.BUSY, UserStatus.ONLINE)).toBe(UserStatus.ONLINE);

		// BUSY > AWAY
		expect(processConnectionStatus(UserStatus.AWAY, UserStatus.BUSY)).toBe(UserStatus.BUSY);

		// AWAY > OFFLINE
		expect(processConnectionStatus(UserStatus.OFFLINE, UserStatus.AWAY)).toBe(UserStatus.AWAY);

		// Therefore ONLINE > AWAY (transitivity)
		expect(processConnectionStatus(UserStatus.AWAY, UserStatus.ONLINE)).toBe(UserStatus.ONLINE);

		// And ONLINE > OFFLINE (transitivity)
		expect(processConnectionStatus(UserStatus.OFFLINE, UserStatus.ONLINE)).toBe(UserStatus.ONLINE);

		// And BUSY > OFFLINE (transitivity)
		expect(processConnectionStatus(UserStatus.OFFLINE, UserStatus.BUSY)).toBe(UserStatus.BUSY);
	});

	test('should be commutative for same status values', () => {
		const statuses = [UserStatus.ONLINE, UserStatus.AWAY, UserStatus.BUSY, UserStatus.OFFLINE];

		statuses.forEach((status) => {
			// processConnectionStatus(A, A) should equal A
			expect(processConnectionStatus(status, status)).toBe(status);
		});
	});

	test('should handle reduce operation correctly', () => {
		const connections = [UserStatus.OFFLINE, UserStatus.AWAY, UserStatus.ONLINE, UserStatus.BUSY];

		// Reduce from left to right
		const result = connections.reduce(processConnectionStatus, UserStatus.OFFLINE);

		// ONLINE should win in this sequence
		expect(result).toBe(UserStatus.ONLINE);
	});

	test('should handle reduce operation with different orders', () => {
		// Test that order doesn't matter for the final result when ONLINE is present
		const combinations = [
			[UserStatus.ONLINE, UserStatus.AWAY, UserStatus.BUSY],
			[UserStatus.AWAY, UserStatus.ONLINE, UserStatus.BUSY],
			[UserStatus.BUSY, UserStatus.AWAY, UserStatus.ONLINE],
		];

		combinations.forEach((combo) => {
			const result = combo.reduce(processConnectionStatus, UserStatus.OFFLINE);
			expect(result).toBe(UserStatus.ONLINE);
		});
	});

	test('should handle reduce with only AWAY and BUSY statuses', () => {
		const combinations = [
			[UserStatus.AWAY, UserStatus.BUSY],
			[UserStatus.BUSY, UserStatus.AWAY],
			[UserStatus.BUSY, UserStatus.BUSY, UserStatus.AWAY],
			[UserStatus.AWAY, UserStatus.AWAY, UserStatus.BUSY],
		];

		combinations.forEach((combo) => {
			const result = combo.reduce(processConnectionStatus, UserStatus.OFFLINE);
			// BUSY should win
			expect(result).toBe(UserStatus.BUSY);
		});
	});

	test('should handle empty array reduce to OFFLINE', () => {
		const result = [].reduce(processConnectionStatus, UserStatus.OFFLINE);
		expect(result).toBe(UserStatus.OFFLINE);
	});

	test('should handle single element reduce', () => {
		const statuses = [UserStatus.ONLINE, UserStatus.AWAY, UserStatus.BUSY, UserStatus.OFFLINE];

		statuses.forEach((status) => {
			const result = [status].reduce(processConnectionStatus, UserStatus.OFFLINE);
			expect(result).toBe(status === UserStatus.OFFLINE ? UserStatus.OFFLINE : status);
		});
	});

	test('should be associative', () => {
		// (A op B) op C should equal A op (B op C)
		const a = UserStatus.AWAY;
		const b = UserStatus.BUSY;
		const c = UserStatus.ONLINE;

		const leftAssoc = processConnectionStatus(processConnectionStatus(a, b), c);
		const rightAssoc = processConnectionStatus(a, processConnectionStatus(b, c));

		expect(leftAssoc).toBe(rightAssoc);
	});
});
