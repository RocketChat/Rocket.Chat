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
