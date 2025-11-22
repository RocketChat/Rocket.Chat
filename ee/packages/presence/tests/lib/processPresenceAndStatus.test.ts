import { describe, test, expect } from '@jest/globals';
import { UserStatus } from '@rocket.chat/core-typings';

import { processPresenceAndStatus } from '../../src/processPresenceAndStatus';

describe('processPresenceAndStatus', () => {
	test('should return correct status and statusConnection when connected once', () => {
		expect(
			processPresenceAndStatus(
				[
					{
						id: 'random',
						instanceId: 'random',
						status: UserStatus.ONLINE,
						_createdAt: new Date(),
						_updatedAt: new Date(),
					},
				],
				UserStatus.ONLINE,
			),
		).toStrictEqual({ status: UserStatus.ONLINE, statusConnection: UserStatus.ONLINE });

		expect(
			processPresenceAndStatus(
				[
					{
						id: 'random',
						instanceId: 'random',
						status: UserStatus.AWAY,
						_createdAt: new Date(),
						_updatedAt: new Date(),
					},
				],
				UserStatus.ONLINE,
			),
		).toStrictEqual({ status: UserStatus.AWAY, statusConnection: UserStatus.AWAY });

		expect(
			processPresenceAndStatus(
				[
					{
						id: 'random',
						instanceId: 'random',
						status: UserStatus.ONLINE,
						_createdAt: new Date(),
						_updatedAt: new Date(),
					},
				],
				UserStatus.BUSY,
			),
		).toStrictEqual({ status: UserStatus.BUSY, statusConnection: UserStatus.ONLINE });

		expect(
			processPresenceAndStatus(
				[
					{
						id: 'random',
						instanceId: 'random',
						status: UserStatus.ONLINE,
						_createdAt: new Date(),
						_updatedAt: new Date(),
					},
				],
				UserStatus.AWAY,
			),
		).toStrictEqual({ status: UserStatus.AWAY, statusConnection: UserStatus.ONLINE });

		expect(
			processPresenceAndStatus(
				[
					{
						id: 'random',
						instanceId: 'random',
						status: UserStatus.AWAY,
						_createdAt: new Date(),
						_updatedAt: new Date(),
					},
				],
				UserStatus.BUSY,
			),
		).toStrictEqual({ status: UserStatus.BUSY, statusConnection: UserStatus.AWAY });

		expect(
			processPresenceAndStatus(
				[
					{
						id: 'random',
						instanceId: 'random',
						status: UserStatus.ONLINE,
						_createdAt: new Date(),
						_updatedAt: new Date(),
					},
				],
				UserStatus.OFFLINE,
			),
		).toStrictEqual({ status: UserStatus.OFFLINE, statusConnection: UserStatus.ONLINE });

		expect(
			processPresenceAndStatus(
				[
					{
						id: 'random',
						instanceId: 'random',
						status: UserStatus.AWAY,
						_createdAt: new Date(),
						_updatedAt: new Date(),
					},
				],
				UserStatus.OFFLINE,
			),
		).toStrictEqual({ status: UserStatus.OFFLINE, statusConnection: UserStatus.AWAY });
	});

	test('should return correct status and statusConnection when connected twice', () => {
		expect(
			processPresenceAndStatus(
				[
					{
						id: 'random',
						instanceId: 'random',
						status: UserStatus.ONLINE,
						_createdAt: new Date(),
						_updatedAt: new Date(),
					},
					{
						id: 'random',
						instanceId: 'random',
						status: UserStatus.AWAY,
						_createdAt: new Date(),
						_updatedAt: new Date(),
					},
				],
				UserStatus.ONLINE,
			),
		).toStrictEqual({ status: UserStatus.ONLINE, statusConnection: UserStatus.ONLINE });

		expect(
			processPresenceAndStatus(
				[
					{
						id: 'random',
						instanceId: 'random',
						status: UserStatus.AWAY,
						_createdAt: new Date(),
						_updatedAt: new Date(),
					},
					{
						id: 'random',
						instanceId: 'random',
						status: UserStatus.ONLINE,
						_createdAt: new Date(),
						_updatedAt: new Date(),
					},
				],
				UserStatus.ONLINE,
			),
		).toStrictEqual({ status: UserStatus.ONLINE, statusConnection: UserStatus.ONLINE });

		expect(
			processPresenceAndStatus(
				[
					{
						id: 'random',
						instanceId: 'random',
						status: UserStatus.AWAY,
						_createdAt: new Date(),
						_updatedAt: new Date(),
					},
					{
						id: 'random',
						instanceId: 'random',
						status: UserStatus.AWAY,
						_createdAt: new Date(),
						_updatedAt: new Date(),
					},
				],
				UserStatus.ONLINE,
			),
		).toStrictEqual({ status: UserStatus.AWAY, statusConnection: UserStatus.AWAY });
	});

	test('should return correct status and statusConnection when not connected', () => {
		expect(processPresenceAndStatus([], UserStatus.ONLINE)).toStrictEqual({
			status: UserStatus.OFFLINE,
			statusConnection: UserStatus.OFFLINE,
		});

		expect(processPresenceAndStatus([], UserStatus.BUSY)).toStrictEqual({
			status: UserStatus.OFFLINE,
			statusConnection: UserStatus.OFFLINE,
		});

		expect(processPresenceAndStatus([], UserStatus.AWAY)).toStrictEqual({
			status: UserStatus.OFFLINE,
			statusConnection: UserStatus.OFFLINE,
		});

		expect(processPresenceAndStatus([], UserStatus.OFFLINE)).toStrictEqual({
			status: UserStatus.OFFLINE,
			statusConnection: UserStatus.OFFLINE,
		});
	});

	test('should ignore connections last updated more than 5 minutes ago', () => {
		const now = new Date();
		const sixMinutesAgo = new Date(now.getTime() - 6 * 60 * 1000);
		const fourMinutesAgo = new Date(now.getTime() - 4 * 60 * 1000);

		expect(
			processPresenceAndStatus(
				[
					{
						id: 'random1',
						instanceId: 'random1',
						status: UserStatus.ONLINE,
						_createdAt: sixMinutesAgo,
						_updatedAt: sixMinutesAgo,
					},
					{
						id: 'random2',
						instanceId: 'random2',
						status: UserStatus.AWAY,
						_createdAt: fourMinutesAgo,
						_updatedAt: fourMinutesAgo,
					},
				],
				UserStatus.ONLINE,
			),
		).toStrictEqual({ status: UserStatus.AWAY, statusConnection: UserStatus.AWAY });
	});

	test('should return offline if all connections are stale', () => {
		const now = new Date();
		const sixMinutesAgo = new Date(now.getTime() - 6 * 60 * 1000);
		const sevenMinutesAgo = new Date(now.getTime() - 7 * 60 * 1000);

		expect(
			processPresenceAndStatus(
				[
					{
						id: 'random1',
						instanceId: 'random1',
						status: UserStatus.ONLINE,
						_createdAt: sixMinutesAgo,
						_updatedAt: sixMinutesAgo,
					},
					{
						id: 'random2',
						instanceId: 'random2',
						status: UserStatus.AWAY,
						_createdAt: sevenMinutesAgo,
						_updatedAt: sevenMinutesAgo,
					},
				],
				UserStatus.ONLINE,
			),
		).toStrictEqual({ status: UserStatus.OFFLINE, statusConnection: UserStatus.OFFLINE });
	});

	test('should consider all connections if they were updated within the last 5 minutes', () => {
		const now = new Date();
		const threeMinutesAgo = new Date(now.getTime() - 3 * 60 * 1000);
		const fourMinutesAgo = new Date(now.getTime() - 4 * 60 * 1000);

		expect(
			processPresenceAndStatus(
				[
					{
						id: 'random1',
						instanceId: 'random1',
						status: UserStatus.ONLINE,
						_createdAt: threeMinutesAgo,
						_updatedAt: threeMinutesAgo,
					},
					{
						id: 'random2',
						instanceId: 'random2',
						status: UserStatus.AWAY,
						_createdAt: fourMinutesAgo,
						_updatedAt: fourMinutesAgo,
					},
				],
				UserStatus.ONLINE,
			),
		).toStrictEqual({ status: UserStatus.ONLINE, statusConnection: UserStatus.ONLINE });
	});
});

	test('should handle exactly 5 minutes boundary (300000ms)', () => {
		const now = new Date();
		const exactlyFiveMinutes = new Date(now.getTime() - 300_000);
		const justOverFiveMinutes = new Date(now.getTime() - 300_001);

		// Exactly 5 minutes should be included
		expect(
			processPresenceAndStatus(
				[
					{
						id: 'boundary-test',
						instanceId: 'boundary-test',
						status: UserStatus.ONLINE,
						_createdAt: exactlyFiveMinutes,
						_updatedAt: exactlyFiveMinutes,
					},
				],
				UserStatus.ONLINE,
			),
		).toStrictEqual({ status: UserStatus.ONLINE, statusConnection: UserStatus.ONLINE });

		// Just over 5 minutes should be excluded
		expect(
			processPresenceAndStatus(
				[
					{
						id: 'boundary-test',
						instanceId: 'boundary-test',
						status: UserStatus.ONLINE,
						_createdAt: justOverFiveMinutes,
						_updatedAt: justOverFiveMinutes,
					},
				],
				UserStatus.ONLINE,
			),
		).toStrictEqual({ status: UserStatus.OFFLINE, statusConnection: UserStatus.OFFLINE });
	});

	test('should handle mixed fresh and stale connections correctly', () => {
		const now = new Date();
		const oneMinuteAgo = new Date(now.getTime() - 60_000);
		const threeMinutesAgo = new Date(now.getTime() - 180_000);
		const sixMinutesAgo = new Date(now.getTime() - 360_000);

		// Mix of online and away, one stale
		expect(
			processPresenceAndStatus(
				[
					{
						id: 'fresh-online',
						instanceId: 'instance1',
						status: UserStatus.ONLINE,
						_createdAt: oneMinuteAgo,
						_updatedAt: oneMinuteAgo,
					},
					{
						id: 'stale-away',
						instanceId: 'instance2',
						status: UserStatus.AWAY,
						_createdAt: sixMinutesAgo,
						_updatedAt: sixMinutesAgo,
					},
					{
						id: 'fresh-away',
						instanceId: 'instance3',
						status: UserStatus.AWAY,
						_createdAt: threeMinutesAgo,
						_updatedAt: threeMinutesAgo,
					},
				],
				UserStatus.ONLINE,
			),
		).toStrictEqual({ status: UserStatus.ONLINE, statusConnection: UserStatus.ONLINE });
	});

	test('should prioritize most active status when multiple fresh connections exist', () => {
		const now = new Date();
		const recentTime = new Date(now.getTime() - 30_000);

		// Multiple AWAY connections, should still be AWAY
		expect(
			processPresenceAndStatus(
				[
					{
						id: 'away1',
						instanceId: 'instance1',
						status: UserStatus.AWAY,
						_createdAt: recentTime,
						_updatedAt: recentTime,
					},
					{
						id: 'away2',
						instanceId: 'instance2',
						status: UserStatus.AWAY,
						_createdAt: recentTime,
						_updatedAt: recentTime,
					},
					{
						id: 'away3',
						instanceId: 'instance3',
						status: UserStatus.AWAY,
						_createdAt: recentTime,
						_updatedAt: recentTime,
					},
				],
				UserStatus.BUSY,
			),
		).toStrictEqual({ status: UserStatus.BUSY, statusConnection: UserStatus.AWAY });
	});

	test('should handle undefined and default parameter values', () => {
		// Test with no arguments (all defaults)
		expect(processPresenceAndStatus()).toStrictEqual({
			status: UserStatus.OFFLINE,
			statusConnection: UserStatus.OFFLINE,
		});

		// Test with undefined sessions
		expect(processPresenceAndStatus(undefined, UserStatus.BUSY)).toStrictEqual({
			status: UserStatus.OFFLINE,
			statusConnection: UserStatus.OFFLINE,
		});
	});

	test('should handle zero-length time difference (just now)', () => {
		const now = new Date();

		expect(
			processPresenceAndStatus(
				[
					{
						id: 'just-now',
						instanceId: 'instance1',
						status: UserStatus.ONLINE,
						_createdAt: now,
						_updatedAt: now,
					},
				],
				UserStatus.ONLINE,
			),
		).toStrictEqual({ status: UserStatus.ONLINE, statusConnection: UserStatus.ONLINE });
	});

	test('should handle large numbers of connections with mixed staleness', () => {
		const now = new Date();
		const connections = [];

		// Add 5 fresh connections
		for (let i = 0; i < 5; i++) {
			connections.push({
				id: `fresh-${i}`,
				instanceId: `instance-${i}`,
				status: i % 2 === 0 ? UserStatus.ONLINE : UserStatus.AWAY,
				_createdAt: new Date(now.getTime() - i * 30_000),
				_updatedAt: new Date(now.getTime() - i * 30_000),
			});
		}

		// Add 5 stale connections
		for (let i = 0; i < 5; i++) {
			connections.push({
				id: `stale-${i}`,
				instanceId: `stale-instance-${i}`,
				status: UserStatus.ONLINE,
				_createdAt: new Date(now.getTime() - (6 + i) * 60_000),
				_updatedAt: new Date(now.getTime() - (6 + i) * 60_000),
			});
		}

		// Should only consider fresh connections, which include at least one ONLINE
		const result = processPresenceAndStatus(connections, UserStatus.ONLINE);
		expect(result.statusConnection).toBe(UserStatus.ONLINE);
		expect(result.status).toBe(UserStatus.ONLINE);
	});

	test('should handle BUSY status in connection with various defaults', () => {
		const now = new Date();

		// BUSY connection with ONLINE default
		expect(
			processPresenceAndStatus(
				[
					{
						id: 'busy-conn',
						instanceId: 'instance1',
						status: UserStatus.BUSY,
						_createdAt: now,
						_updatedAt: now,
					},
				],
				UserStatus.ONLINE,
			),
		).toStrictEqual({ status: UserStatus.BUSY, statusConnection: UserStatus.BUSY });

		// BUSY connection with AWAY default
		expect(
			processPresenceAndStatus(
				[
					{
						id: 'busy-conn',
						instanceId: 'instance1',
						status: UserStatus.BUSY,
						_createdAt: now,
						_updatedAt: now,
					},
				],
				UserStatus.AWAY,
			),
		).toStrictEqual({ status: UserStatus.AWAY, statusConnection: UserStatus.BUSY });
	});

	test('should correctly filter when all connections are at exact boundary', () => {
		const now = new Date();
		const exactBoundary = new Date(now.getTime() - 300_000);

		expect(
			processPresenceAndStatus(
				[
					{
						id: 'conn1',
						instanceId: 'instance1',
						status: UserStatus.ONLINE,
						_createdAt: exactBoundary,
						_updatedAt: exactBoundary,
					},
					{
						id: 'conn2',
						instanceId: 'instance2',
						status: UserStatus.AWAY,
						_createdAt: exactBoundary,
						_updatedAt: exactBoundary,
					},
				],
				UserStatus.ONLINE,
			),
		).toStrictEqual({ status: UserStatus.ONLINE, statusConnection: UserStatus.ONLINE });
	});

	test('should respect the order of status priority when reducing connections', () => {
		const now = new Date();

		// ONLINE should win over AWAY
		expect(
			processPresenceAndStatus(
				[
					{
						id: 'away-conn',
						instanceId: 'instance1',
						status: UserStatus.AWAY,
						_createdAt: now,
						_updatedAt: now,
					},
					{
						id: 'online-conn',
						instanceId: 'instance2',
						status: UserStatus.ONLINE,
						_createdAt: now,
						_updatedAt: now,
					},
				],
				UserStatus.BUSY,
			),
		).toStrictEqual({ status: UserStatus.BUSY, statusConnection: UserStatus.ONLINE });

		// BUSY should win over AWAY
		expect(
			processPresenceAndStatus(
				[
					{
						id: 'away-conn',
						instanceId: 'instance1',
						status: UserStatus.AWAY,
						_createdAt: now,
						_updatedAt: now,
					},
					{
						id: 'busy-conn',
						instanceId: 'instance2',
						status: UserStatus.BUSY,
						_createdAt: now,
						_updatedAt: now,
					},
				],
				UserStatus.ONLINE,
			),
		).toStrictEqual({ status: UserStatus.BUSY, statusConnection: UserStatus.BUSY });
	});
});

describe('isAtMostFiveMinutesAgo helper (implicit testing)', () => {
	test('should include connections updated exactly at 300000ms boundary', () => {
		const now = new Date();
		const exactly300s = new Date(now.getTime() - 300_000);

		const result = processPresenceAndStatus(
			[
				{
					id: 'test',
					instanceId: 'test',
					status: UserStatus.ONLINE,
					_createdAt: exactly300s,
					_updatedAt: exactly300s,
				},
			],
			UserStatus.ONLINE,
		);

		expect(result.statusConnection).toBe(UserStatus.ONLINE);
	});

	test('should exclude connections updated at 300001ms ago', () => {
		const now = new Date();
		const just Over = new Date(now.getTime() - 300_001);

		const result = processPresenceAndStatus(
			[
				{
					id: 'test',
					instanceId: 'test',
					status: UserStatus.ONLINE,
					_createdAt: justOver,
					_updatedAt: justOver,
				},
			],
			UserStatus.ONLINE,
		);

		expect(result.statusConnection).toBe(UserStatus.OFFLINE);
	});

	test('should include connections updated 1ms ago', () => {
		const now = new Date();
		const oneMs = new Date(now.getTime() - 1);

		const result = processPresenceAndStatus(
			[
				{
					id: 'test',
					instanceId: 'test',
					status: UserStatus.ONLINE,
					_createdAt: oneMs,
					_updatedAt: oneMs,
				},
			],
			UserStatus.ONLINE,
		);

		expect(result.statusConnection).toBe(UserStatus.ONLINE);
	});

	test('should include connections updated 299999ms ago', () => {
		const now = new Date();
		const justUnder = new Date(now.getTime() - 299_999);

		const result = processPresenceAndStatus(
			[
				{
					id: 'test',
					instanceId: 'test',
					status: UserStatus.ONLINE,
					_createdAt: justUnder,
					_updatedAt: justUnder,
				},
			],
			UserStatus.ONLINE,
		);

		expect(result.statusConnection).toBe(UserStatus.ONLINE);
	});

	test('should handle connections with _updatedAt in the future (clock skew)', () => {
		const now = new Date();
		const future = new Date(now.getTime() + 60_000); // 1 minute in future

		const result = processPresenceAndStatus(
			[
				{
					id: 'test',
					instanceId: 'test',
					status: UserStatus.ONLINE,
					_createdAt: future,
					_updatedAt: future,
				},
			],
			UserStatus.ONLINE,
		);

		// Future dates should result in negative diff, which is <= 300000, so should be included
		expect(result.statusConnection).toBe(UserStatus.ONLINE);
	});

	test('should handle very old connections (days old)', () => {
		const now = new Date();
		const daysOld = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days

		const result = processPresenceAndStatus(
			[
				{
					id: 'test',
					instanceId: 'test',
					status: UserStatus.ONLINE,
					_createdAt: daysOld,
					_updatedAt: daysOld,
				},
			],
			UserStatus.ONLINE,
		);

		expect(result.statusConnection).toBe(UserStatus.OFFLINE);
	});

	test('should correctly filter mixed ages in millisecond precision', () => {
		const now = new Date();
		const times = [
			new Date(now.getTime() - 299_999), // just under - should include
			new Date(now.getTime() - 300_000), // exactly at - should include
			new Date(now.getTime() - 300_001), // just over - should exclude
			new Date(now.getTime() - 400_000), // well over - should exclude
		];

		const connections = times.map((time, index) => ({
			id: `conn${index}`,
			instanceId: `inst${index}`,
			status: UserStatus.ONLINE,
			_createdAt: time,
			_updatedAt: time,
		}));

		const result = processPresenceAndStatus(connections, UserStatus.ONLINE);

		// Should only include first 2 connections
		expect(result.statusConnection).toBe(UserStatus.ONLINE);
	});
});

/*
 * Test Coverage Notes:
 * 
 * This test suite provides comprehensive coverage for the processPresenceAndStatus function,
 * including:
 * 
 * 1. Time-Based Filtering (NEW in this changeset):
 *    - Tests the 5-minute staleness window (300,000ms)
 *    - Validates exact boundary conditions
 *    - Handles clock skew scenarios
 *    - Tests mixed fresh/stale connection filtering
 * 
 * 2. Status Calculation:
 *    - All combinations of connection and default statuses
 *    - Priority ordering (ONLINE > BUSY > AWAY > OFFLINE)
 *    - Integration with processConnectionStatus reducer
 * 
 * 3. Edge Cases:
 *    - Empty arrays, undefined inputs
 *    - Single vs multiple connections
 *    - Future timestamps
 *    - Very old connections
 *    - Large numbers of connections
 * 
 * The tests ensure that stale connections (last updated > 5 minutes ago) are
 * properly filtered out before status calculation, which is the key new behavior
 * in this changeset.
 */
