import type { IRoomNativeFederated, IUser } from '@rocket.chat/core-typings';
import { Visibility } from 'matrix-js-sdk';

import { api } from '../../../../../apps/meteor/tests/data/api-data';
import { acceptRoomInvite } from '../../../../../apps/meteor/tests/data/rooms.helper';
import {
	type IRequestConfig,
	createUser,
	deleteUser,
	getRequestConfig,
	getUserByUsername,
} from '../../../../../apps/meteor/tests/data/users.helper';
import { IS_EE } from '../../../../../apps/meteor/tests/e2e/config/constants';
import { retry } from '../../../../../apps/meteor/tests/end-to-end/api/helpers/retry';
import { federationConfig } from '../helper/config';
import { SynapseClient } from '../helper/synapse-client';

const remoteUser = federationConfig.hs1.firstContactUser;
const localUser = federationConfig.rc1.firstContactUser;

/**
 * Every other federation spec reuses Synapse users that earlier specs have already pulled into
 * the local database, so the membership handlers always find a complete user document and the
 * creation path is never observed. This spec reserves a Synapse user nobody else touches, removes
 * the local document if a previous run left one behind, and only then lets that user reach in.
 *
 * The user is therefore created by the inbound invite itself, which is the one code path whose
 * result is consumed rather than discarded.
 */
(IS_EE ? describe : describe.skip)('Federation first contact', () => {
	let rc1AdminRequestConfig: IRequestConfig;
	let rc1InviteeRequestConfig: IRequestConfig;
	let hs1FirstContactApp: SynapseClient;

	const forgetRemoteUserLocally = async () => {
		const known = await getUserByUsername(remoteUser.matrixUserId, rc1AdminRequestConfig);
		if (known?._id) {
			await deleteUser({ _id: known._id }, { confirmRelinquish: true }, rc1AdminRequestConfig);
		}
	};

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

		rc1InviteeRequestConfig = await getRequestConfig(federationConfig.rc1.url, localUser.username, localUser.password);

		// a previous run leaves the user behind, which would make this spec exercise the warm path instead
		await forgetRemoteUserLocally();

		hs1FirstContactApp = new SynapseClient(federationConfig.hs1.url, remoteUser.username, remoteUser.password);
		await hs1FirstContactApp.initialize();
	}, 60000);

	afterAll(async () => {
		// leave the environment cold so a rerun against persistent containers still tests first contact
		await forgetRemoteUserLocally();
		await hs1FirstContactApp?.close();
	});

	it('should not know the remote user before the first interaction', async () => {
		const response = await rc1AdminRequestConfig.request
			.get(api('users.info'))
			.set(rc1AdminRequestConfig.credentials)
			.query({ username: remoteUser.matrixUserId });

		expect(response.status).toBe(400);
		expect(response.body).toHaveProperty('success', false);
	});

	describe('when the first interaction is an invite from Synapse', () => {
		let channelName: string;
		let synapseRoomId: string;
		let federatedRoomId: string;

		beforeAll(async () => {
			channelName = `fed-first-contact-${Date.now()}`;
			synapseRoomId = await hs1FirstContactApp.createRoom(channelName, Visibility.Private);

			await hs1FirstContactApp.inviteUserToRoom(synapseRoomId, localUser.matrixUserId);
		}, 60000);

		it('should create the room on the Rocket.Chat side', async () => {
			await retry(
				'waiting for the federated room to reach RC',
				async () => {
					// rooms.get is scoped to the caller's subscriptions, and only the invitee is in this room
					const response = await rc1InviteeRequestConfig.request.get(api('rooms.get')).set(rc1InviteeRequestConfig.credentials).expect(200);

					const rcRoom = response.body.update.find(
						(room: IRoomNativeFederated) => room.federation?.mrid === synapseRoomId,
					) as IRoomNativeFederated | null;

					expect(rcRoom).toBeTruthy();
					federatedRoomId = rcRoom!._id;
				},
				{ retries: 10, delayMs: 2000 },
			);
		}, 30000);

		// this covers the persisted document only. The shape of the object the invite handler reads back
		// is not observable from here — it belongs to the createOrUpdateFederatedUser and
		// getOrCreateFederatedUser unit tests, and when it regresses the room and subscription
		// assertions below are what fail.
		it('should persist the remote user locally as a complete document', async () => {
			const response = await rc1AdminRequestConfig.request
				.get(api('users.info'))
				.set(rc1AdminRequestConfig.credentials)
				.query({ username: remoteUser.matrixUserId })
				.expect(200);

			expect(response.body.user).toMatchObject({
				username: remoteUser.matrixUserId,
				name: remoteUser.matrixUserId,
				type: 'user',
				active: true,
				federated: true,
				roles: expect.arrayContaining(['federated-external']),
			});
			expect(response.body.user.createdAt).toBeTruthy();
		});

		it('should create the invited subscription for the local user', async () => {
			const response = await rc1InviteeRequestConfig.request
				.get(api('subscriptions.getOne'))
				.set(rc1InviteeRequestConfig.credentials)
				.query({ roomId: federatedRoomId })
				.expect(200);

			expect(response.body.subscription).toBeTruthy();
			expect(response.body.subscription).toHaveProperty('status', 'INVITED');
		});

		it('should let the local user accept the invite', async () => {
			const response = await acceptRoomInvite(federatedRoomId, rc1InviteeRequestConfig);

			expect(response).toHaveProperty('success', true);
		});

		it('should reach the local user on the Synapse side', async () => {
			await retry(
				'waiting for the local user to appear as joined on Synapse',
				async () => {
					const member = await hs1FirstContactApp.findRoomMember(channelName, localUser.matrixUserId);

					expect(member).not.toBeNull();
					expect(member!.membership).toBe('join');
				},
				{ retries: 10, delayMs: 2000 },
			);
		}, 30000);

		// a named, invite-only Synapse room becomes a private group on RC, so groups.members applies.
		// it gates on canAccessRoomAsync without includeInvitations, meaning the accepted subscription
		// has to have settled first — hence the retry and the ordering after the Synapse round-trip
		it('should list the remote user among the room members', async () => {
			await retry(
				'waiting for the room members to include the remote user',
				async () => {
					const response = await rc1InviteeRequestConfig.request
						.get(api('groups.members'))
						.set(rc1InviteeRequestConfig.credentials)
						.query({ roomId: federatedRoomId })
						.expect(200);

					expect(response.body.members).toEqual(
						expect.arrayContaining([expect.objectContaining({ username: remoteUser.matrixUserId } as Partial<IUser>)]),
					);
				},
				{ retries: 5, delayMs: 2000 },
			);
		}, 30000);
	});
});
