import type { IRoomNativeFederated } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/core-typings';
import { Visibility } from 'matrix-js-sdk';

import { api } from '../../../../../apps/meteor/tests/data/api-data';
import { acceptRoomInvite } from '../../../../../apps/meteor/tests/data/rooms.helper';
import { type IRequestConfig, createUser, getRequestConfig, getUserByUsername } from '../../../../../apps/meteor/tests/data/users.helper';
import { IS_EE } from '../../../../../apps/meteor/tests/e2e/config/constants';
import { retry } from '../../../../../apps/meteor/tests/end-to-end/api/helpers/retry';
import { federationConfig } from '../helper/config';
import { DDPListener } from '../helper/ddp-listener';
import { SynapseClient } from '../helper/synapse-client';

const localUser = federationConfig.rc1.additionalUser1;
const remoteUser = federationConfig.hs1.additionalUser1;

const PRESENCE_SETTING = 'Federation_Service_EDU_Process_Presence';

/**
 * Presence is only federated while `Federation_Service_EDU_Process_Presence` is on, and it
 * defaults to off, so this suite owns the setting and restores it afterwards.
 *
 * The assertion deliberately reads the remote homeserver's own view of the user rather than
 * Rocket.Chat's, because the send path is what regressed: the handler used to require
 * federation metadata that is never written for local users, so no EDU was ever emitted and
 * a Rocket.Chat side check would have passed against a shadow user that never updated.
 */
(IS_EE ? describe : describe.skip)('Federation presence', () => {
	let rc1AdminRequestConfig: IRequestConfig;
	let rc1UserRequestConfig: IRequestConfig;
	let hs1UserApp: SynapseClient;
	let federatedRoomId: string;

	const setPresenceSetting = async (value: boolean) => {
		await rc1AdminRequestConfig.request
			.post(api(`settings/${PRESENCE_SETTING}`))
			.set(rc1AdminRequestConfig.credentials)
			.send({ value })
			.expect(200);
	};

	// the remote server is the source of truth here: it only knows a status if an EDU arrived
	const expectRemotePresence = async (expected: string) =>
		retry(
			`waiting for ${remoteUser.username} to see ${localUser.matrixUserId} as ${expected}`,
			async () => {
				const status = await hs1UserApp.matrixClient.getPresence(localUser.matrixUserId);

				expect(status.presence).toBe(expected);
			},
			{ retries: 10, delayMs: 2000 },
		);

	beforeAll(async () => {
		rc1AdminRequestConfig = await getRequestConfig(
			federationConfig.rc1.url,
			federationConfig.rc1.adminUser,
			federationConfig.rc1.adminPassword,
		);

		const existingLocalUser = await getUserByUsername(localUser.username, rc1AdminRequestConfig);
		if (!existingLocalUser?._id) {
			await createUser(
				{
					username: localUser.username,
					password: localUser.password,
					email: `${localUser.username}@rocket.chat`,
					name: localUser.username,
				},
				rc1AdminRequestConfig,
			);
		}

		rc1UserRequestConfig = await getRequestConfig(federationConfig.rc1.url, localUser.username, localUser.password);

		await setPresenceSetting(true);

		hs1UserApp = new SynapseClient(federationConfig.hs1.url, remoteUser.username, remoteUser.password);
		await hs1UserApp.initialize();

		// presence is only sent to servers that share a federated room with the user, so the
		// two sides need one before any status change can be observed
		const channelName = `fed-presence-${Date.now()}`;
		const synapseRoomId = await hs1UserApp.createRoom(channelName, Visibility.Private);
		await hs1UserApp.inviteUserToRoom(synapseRoomId, localUser.matrixUserId);

		await retry(
			'waiting for the federated room to reach RC',
			async () => {
				const response = await rc1UserRequestConfig.request.get(api('rooms.get')).set(rc1UserRequestConfig.credentials).expect(200);

				const rcRoom = response.body.update.find(
					(room: IRoomNativeFederated) => room.federation?.mrid === synapseRoomId,
				) as IRoomNativeFederated | null;

				expect(rcRoom).toBeTruthy();
				federatedRoomId = rcRoom!._id;
			},
			{ retries: 10, delayMs: 2000 },
		);

		const accepted = await acceptRoomInvite(federatedRoomId, rc1UserRequestConfig);
		expect(accepted).toHaveProperty('success', true);
	}, 120000);

	afterAll(async () => {
		// leave the workspace as it was found: this setting is off by default
		if (rc1AdminRequestConfig) {
			await setPresenceSetting(false);
		}
		await hs1UserApp?.close();
	});

	const setLocalStatus = async (status: UserStatus) => {
		const response = await rc1UserRequestConfig.request
			.post(api('users.setStatus'))
			.set(rc1UserRequestConfig.credentials)
			.send({ status, message: '' })
			.expect(200);

		expect(response.body).toHaveProperty('success', true);
	};

	it('should share a federated room with the remote user', async () => {
		const response = await rc1UserRequestConfig.request
			.get(api('subscriptions.getOne'))
			.set(rc1UserRequestConfig.credentials)
			.query({ roomId: federatedRoomId })
			.expect(200);

		expect(response.body.subscription).toBeTruthy();
	});

	// `online` is the assertion that actually pins the regression: an unknown remote user reads
	// as `offline` on Synapse, so only a non-offline state proves an EDU was received.
	it('should reach the remote server when the local user goes online', async () => {
		await setLocalStatus(UserStatus.ONLINE);

		await expectRemotePresence('online');
	}, 60000);

	describe('with a connected client', () => {
		let ddp: DDPListener;

		// away and busy are only *effective* statuses while the user has a live connection;
		// for a REST-only user Rocket.Chat resolves both to offline, which is indistinguishable
		// from "no EDU arrived". A DDP session makes them real, and therefore assertable.
		beforeAll(async () => {
			ddp = new DDPListener(federationConfig.rc1.url, rc1UserRequestConfig);
			await ddp.connect();
		}, 60000);

		afterAll(() => {
			ddp?.disconnect();
		});

		// away and busy both collapse to the Matrix `unavailable` state
		it('should reach the remote server when the local user goes away', async () => {
			await setLocalStatus(UserStatus.AWAY);

			await expectRemotePresence('unavailable');
		}, 60000);

		it('should reach the remote server when the local user goes busy', async () => {
			await setLocalStatus(UserStatus.BUSY);

			await expectRemotePresence('unavailable');
		}, 60000);

		it('should reach the remote server when the local user comes back online', async () => {
			await setLocalStatus(UserStatus.ONLINE);

			await expectRemotePresence('online');
		}, 60000);
	});
});
