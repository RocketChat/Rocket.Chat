import { describe, expect, test } from '@jest/globals';
import { UserStatus } from '@rocket.chat/core-typings';

import { processConnectionStatus, processStatus, processPresenceAndStatus } from '../../src/lib/processConnectionStatus';

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
});
