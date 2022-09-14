import tap from 'tap';
import { UserStatus } from '@rocket.chat/core-typings';

import { processConnectionStatus, processStatus, processPresenceAndStatus } from '../../src/lib/processConnectionStatus';

tap.test('Presence micro service', (t) => {
	t.test('should return connection as online when there is a connection online', (t) => {
		t.equal(processConnectionStatus(UserStatus.OFFLINE, UserStatus.ONLINE), UserStatus.ONLINE);
		t.equal(processConnectionStatus(UserStatus.ONLINE, UserStatus.ONLINE), UserStatus.ONLINE);
		t.equal(processConnectionStatus(UserStatus.BUSY, UserStatus.ONLINE), UserStatus.ONLINE);
		t.equal(processConnectionStatus(UserStatus.AWAY, UserStatus.ONLINE), UserStatus.ONLINE);
		t.end();
	});

	t.test('should return the connections status if the other connection is offline', (t) => {
		t.equal(processConnectionStatus(UserStatus.OFFLINE, UserStatus.OFFLINE), UserStatus.OFFLINE);
		t.equal(processConnectionStatus(UserStatus.ONLINE, UserStatus.OFFLINE), UserStatus.ONLINE);
		t.equal(processConnectionStatus(UserStatus.AWAY, UserStatus.OFFLINE), UserStatus.AWAY);
		t.end();
	});

	t.test('should return the connection status when the default status is online', (t) => {
		t.equal(processStatus(UserStatus.ONLINE, UserStatus.ONLINE), UserStatus.ONLINE);
		t.equal(processStatus(UserStatus.AWAY, UserStatus.ONLINE), UserStatus.AWAY);
		t.equal(processStatus(UserStatus.OFFLINE, UserStatus.ONLINE), UserStatus.OFFLINE);
		t.end();
	});

	t.test('should return status busy when the default status is busy', (t) => {
		t.equal(processStatus(UserStatus.ONLINE, UserStatus.BUSY), UserStatus.BUSY);
		t.equal(processStatus(UserStatus.AWAY, UserStatus.BUSY), UserStatus.BUSY);
		t.equal(processStatus(UserStatus.OFFLINE, UserStatus.BUSY), UserStatus.OFFLINE);
		t.end();
	});

	t.test('should return status away when the default status is away', (t) => {
		t.equal(processStatus(UserStatus.ONLINE, UserStatus.AWAY), UserStatus.AWAY);
		t.equal(processStatus(UserStatus.AWAY, UserStatus.AWAY), UserStatus.AWAY);
		t.equal(processStatus(UserStatus.OFFLINE, UserStatus.AWAY), UserStatus.OFFLINE);
		t.end();
	});

	t.test('should return status offline when the default status is offline', (t) => {
		t.equal(processStatus(UserStatus.ONLINE, UserStatus.OFFLINE), UserStatus.OFFLINE);
		t.equal(processStatus(UserStatus.AWAY, UserStatus.OFFLINE), UserStatus.OFFLINE);
		t.equal(processStatus(UserStatus.OFFLINE, UserStatus.OFFLINE), UserStatus.OFFLINE);
		t.end();
	});

	t.test('should return correct status and statusConnection when connected once', (t) => {
		t.same(
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
			{ status: UserStatus.ONLINE, statusConnection: UserStatus.ONLINE },
		);

		t.same(
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
			{ status: UserStatus.AWAY, statusConnection: UserStatus.AWAY },
		);

		t.same(
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
			{ status: UserStatus.BUSY, statusConnection: UserStatus.ONLINE },
		);

		t.same(
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
			{ status: UserStatus.AWAY, statusConnection: UserStatus.ONLINE },
		);

		t.same(
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
			{ status: UserStatus.BUSY, statusConnection: UserStatus.AWAY },
		);

		t.same(
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
			{ status: UserStatus.OFFLINE, statusConnection: UserStatus.ONLINE },
		);

		t.same(
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
			{ status: UserStatus.OFFLINE, statusConnection: UserStatus.AWAY },
		);

		t.end();
	});

	t.test('should return correct status and statusConnection when connected twice', (t) => {
		t.same(
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
			{ status: UserStatus.ONLINE, statusConnection: UserStatus.ONLINE },
		);

		t.same(
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
			{ status: UserStatus.ONLINE, statusConnection: UserStatus.ONLINE },
		);

		t.same(
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
			{ status: UserStatus.AWAY, statusConnection: UserStatus.AWAY },
		);
		t.end();
	});

	t.test('should return correct status and statusConnection when not connected', (t) => {
		t.same(processPresenceAndStatus([], UserStatus.ONLINE), {
			status: UserStatus.OFFLINE,
			statusConnection: UserStatus.OFFLINE,
		});

		t.same(processPresenceAndStatus([], UserStatus.BUSY), {
			status: UserStatus.OFFLINE,
			statusConnection: UserStatus.OFFLINE,
		});

		t.same(processPresenceAndStatus([], UserStatus.AWAY), {
			status: UserStatus.OFFLINE,
			statusConnection: UserStatus.OFFLINE,
		});

		t.same(processPresenceAndStatus([], UserStatus.OFFLINE), {
			status: UserStatus.OFFLINE,
			statusConnection: UserStatus.OFFLINE,
		});
		t.end();
	});

	t.end();
});
