/* eslint-disable @typescript-eslint/camelcase */
import { expect } from 'chai';
import { UserStatus } from '@rocket.chat/core-typings';

import {
	processConnectionStatus,
	processStatus,
	processPresenceAndStatus,
} from '../../../../../../server/services/presence/lib/processConnectionStatus';

describe('Presence micro service', () => {
	it('should return connection as online when there is a connection online', () => {
		expect(processConnectionStatus(UserStatus.OFFLINE, UserStatus.ONLINE)).to.equal(UserStatus.ONLINE);
		expect(processConnectionStatus(UserStatus.ONLINE, UserStatus.ONLINE)).to.equal(UserStatus.ONLINE);
		expect(processConnectionStatus(UserStatus.BUSY, UserStatus.ONLINE)).to.equal(UserStatus.ONLINE);
		expect(processConnectionStatus(UserStatus.AWAY, UserStatus.ONLINE)).to.equal(UserStatus.ONLINE);
	});

	it('should return the connections status if the other connection is offline', () => {
		expect(processConnectionStatus(UserStatus.OFFLINE, UserStatus.OFFLINE)).to.equal(UserStatus.OFFLINE);
		expect(processConnectionStatus(UserStatus.ONLINE, UserStatus.OFFLINE)).to.equal(UserStatus.ONLINE);
		expect(processConnectionStatus(UserStatus.AWAY, UserStatus.OFFLINE)).to.equal(UserStatus.AWAY);
	});

	it('should return the connection status when the default status is online', () => {
		expect(processStatus(UserStatus.ONLINE, UserStatus.ONLINE)).to.equal(UserStatus.ONLINE);
		expect(processStatus(UserStatus.AWAY, UserStatus.ONLINE)).to.equal(UserStatus.AWAY);
		expect(processStatus(UserStatus.OFFLINE, UserStatus.ONLINE)).to.equal(UserStatus.OFFLINE);
	});

	it('should return status busy when the default status is busy', () => {
		expect(processStatus(UserStatus.ONLINE, UserStatus.BUSY)).to.equal(UserStatus.BUSY);
		expect(processStatus(UserStatus.AWAY, UserStatus.BUSY)).to.equal(UserStatus.BUSY);
		expect(processStatus(UserStatus.OFFLINE, UserStatus.BUSY)).to.equal(UserStatus.OFFLINE);
	});

	it('should return status away when the default status is away', () => {
		expect(processStatus(UserStatus.ONLINE, UserStatus.AWAY)).to.equal(UserStatus.AWAY);
		expect(processStatus(UserStatus.AWAY, UserStatus.AWAY)).to.equal(UserStatus.AWAY);
		expect(processStatus(UserStatus.OFFLINE, UserStatus.AWAY)).to.equal(UserStatus.OFFLINE);
	});

	it('should return status offline when the default status is offline', () => {
		expect(processStatus(UserStatus.ONLINE, UserStatus.OFFLINE)).to.equal(UserStatus.OFFLINE);
		expect(processStatus(UserStatus.AWAY, UserStatus.OFFLINE)).to.equal(UserStatus.OFFLINE);
		expect(processStatus(UserStatus.OFFLINE, UserStatus.OFFLINE)).to.equal(UserStatus.OFFLINE);
	});

	it('should return correct status and statusConnection when connected once', () => {
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
		).to.deep.equal({ status: UserStatus.ONLINE, statusConnection: UserStatus.ONLINE });

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
		).to.deep.equal({ status: UserStatus.AWAY, statusConnection: UserStatus.AWAY });

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
		).to.deep.equal({ status: UserStatus.BUSY, statusConnection: UserStatus.ONLINE });

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
		).to.deep.equal({ status: UserStatus.AWAY, statusConnection: UserStatus.ONLINE });

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
		).to.deep.equal({ status: UserStatus.BUSY, statusConnection: UserStatus.AWAY });

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
		).to.deep.equal({ status: UserStatus.OFFLINE, statusConnection: UserStatus.ONLINE });

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
		).to.deep.equal({ status: UserStatus.OFFLINE, statusConnection: UserStatus.AWAY });
	});

	it('should return correct status and statusConnection when connected twice', () => {
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
		).to.deep.equal({ status: UserStatus.ONLINE, statusConnection: UserStatus.ONLINE });

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
		).to.deep.equal({ status: UserStatus.ONLINE, statusConnection: UserStatus.ONLINE });

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
		).to.deep.equal({ status: UserStatus.AWAY, statusConnection: UserStatus.AWAY });
	});

	it('should return correct status and statusConnection when not connected', () => {
		expect(processPresenceAndStatus([], UserStatus.ONLINE)).to.deep.equal({
			status: UserStatus.OFFLINE,
			statusConnection: UserStatus.OFFLINE,
		});

		expect(processPresenceAndStatus([], UserStatus.BUSY)).to.deep.equal({
			status: UserStatus.OFFLINE,
			statusConnection: UserStatus.OFFLINE,
		});

		expect(processPresenceAndStatus([], UserStatus.AWAY)).to.deep.equal({
			status: UserStatus.OFFLINE,
			statusConnection: UserStatus.OFFLINE,
		});

		expect(processPresenceAndStatus([], UserStatus.OFFLINE)).to.deep.equal({
			status: UserStatus.OFFLINE,
			statusConnection: UserStatus.OFFLINE,
		});
	});
});
