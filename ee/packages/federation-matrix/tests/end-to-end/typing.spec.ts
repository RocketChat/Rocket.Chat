import type { IRoomNativeFederated } from '@rocket.chat/core-typings';

import { api } from '../../../../../apps/meteor/tests/data/api-data';
import { type IRequestConfig, createUser, deleteUser, getRequestConfig } from '../../../../../apps/meteor/tests/data/users.helper';
import { IS_EE } from '../../../../../apps/meteor/tests/e2e/config/constants';
import { retry } from '../../../../../apps/meteor/tests/end-to-end/api/helpers/retry';
import { federationConfig } from '../helper/config';
import { DDPListener } from '../helper/ddp-listener';
import { SynapseClient } from '../helper/synapse-client';

const REAL_NAME_SETTING = 'UI_Use_Real_Name';
const remoteUser = federationConfig.hs1.additionalUser1;

const stamp = Date.now();
const SHARED_NAME = 'Wilhelmina Featherstonehaugh';
const REMOTE_DISPLAY_NAME = `Ada Featherstonehaugh ${stamp}`;

const localUser = {
	username: `fed-typist-${stamp}`,
	password: 'typing-spec-pass',
	name: SHARED_NAME,
	matrixUserId: `@fed-typist-${stamp}:${federationConfig.rc1.domain}`,
};

const namesake = {
	username: `fed-typist-namesake-${stamp}`,
	password: 'typing-spec-pass',
	name: SHARED_NAME,
	matrixUserId: `@fed-typist-namesake-${stamp}:${federationConfig.rc1.domain}`,
};

(IS_EE ? describe : describe.skip)('Federation typing indicators', () => {
	let rc1AdminRequestConfig: IRequestConfig;
	let rc1UserRequestConfig: IRequestConfig;
	let hs1UserApp: SynapseClient;
	let ddp: DDPListener;
	let namesakeDdp: DDPListener;
	const createdUserIds: string[] = [];
	let originalRealName: boolean;
	let matrixRoomId: string;
	let roomId: string;

	const setRealName = async (value: boolean) => {
		await rc1AdminRequestConfig.request
			.post(api(`settings/${REAL_NAME_SETTING}`))
			.set(rc1AdminRequestConfig.credentials)
			.send({ value })
			.expect(200);
	};

	const expectStoredRemoteName = async (expectedName: string) =>
		retry(
			`waiting for Rocket.Chat to store "${expectedName}" as the remote user's name`,
			async () => {
				const response = await rc1AdminRequestConfig.request
					.get(api('users.info'))
					.set(rc1AdminRequestConfig.credentials)
					.query({ username: remoteUser.matrixUserId });

				expect(response.body?.user?.name).toBe(expectedName);
			},
			{ retries: 10, delayMs: 2000 },
		);

	const expectLocalTypingIndicator = async (expectedName: string) => {
		await retry(
			`waiting for the local client to see "${expectedName}" typing`,
			async () => {
				// Matrix emits one EDU per typing state change and never resends it, so the trigger belongs
				// inside the loop: a settings write that has not reached the server yet would otherwise be
				// baked into the single event this assertion is allowed to see. Toggling off first keeps
				// Synapse from suppressing the repeat as a no-op state change.
				await hs1UserApp.matrixClient.sendTyping(matrixRoomId, false, 0);
				await hs1UserApp.matrixClient.sendTyping(matrixRoomId, true, 30000);

				const typing = ddp.getUserActivities().filter(({ activities }) => activities.includes('user-typing'));

				expect(typing.map(({ shownName }) => shownName)).toContain(expectedName);
			},
			{ retries: 10, delayMs: 2000 },
		);

		await hs1UserApp.matrixClient.sendTyping(matrixRoomId, false, 0);
	};

	const remoteTypingUserIds = (): string[] =>
		(hs1UserApp.matrixClient.getRoom(matrixRoomId)?.getMembers() ?? []).filter((member) => member.typing).map((member) => member.userId);

	const expectRemoteTyping = async (shouldBeTyping: boolean) =>
		retry(
			`waiting for Synapse to report ${localUser.matrixUserId} typing=${shouldBeTyping}`,
			async () => {
				const member = hs1UserApp.matrixClient.getRoom(matrixRoomId)?.getMember(localUser.matrixUserId);

				expect(Boolean(member?.typing)).toBe(shouldBeTyping);
			},
			{ retries: 10, delayMs: 2000 },
		);

	beforeAll(async () => {
		rc1AdminRequestConfig = await getRequestConfig(
			federationConfig.rc1.url,
			federationConfig.rc1.adminUser,
			federationConfig.rc1.adminPassword,
		);

		for await (const user of [localUser, namesake]) {
			const created = await createUser(
				{ username: user.username, password: user.password, email: `${user.username}@rocket.chat`, name: user.name },
				rc1AdminRequestConfig,
			);
			createdUserIds.push((created as unknown as { _id: string })._id);
		}

		rc1UserRequestConfig = await getRequestConfig(federationConfig.rc1.url, localUser.username, localUser.password);

		hs1UserApp = new SynapseClient(federationConfig.hs1.url, remoteUser.username, remoteUser.password);
		await hs1UserApp.initialize();
		// set before the invite below, so the membership event Rocket.Chat receives already carries it
		await hs1UserApp.matrixClient.setDisplayName(REMOTE_DISPLAY_NAME);

		const channelName = `fed-typing-${stamp}`;
		const group = await rc1UserRequestConfig.request
			.post(api('groups.create'))
			.set(rc1UserRequestConfig.credentials)
			.send({ name: channelName, extraData: { federated: true } })
			.expect(200);
		roomId = group.body.group._id;

		await retry(
			'inviting the remote user into the federated group',
			async () => {
				const response = await rc1UserRequestConfig.request
					.post(api('groups.invite'))
					.set(rc1UserRequestConfig.credentials)
					.send({ roomId, username: remoteUser.matrixUserId });

				expect(response.body).toHaveProperty('success', true);
			},
			{ retries: 5, delayMs: 4000 },
		);

		await retry(
			'waiting for the room to carry a Matrix id',
			async () => {
				const response = await rc1UserRequestConfig.request
					.get(api('rooms.info'))
					.set(rc1UserRequestConfig.credentials)
					.query({ roomId })
					.expect(200);

				const room = response.body.room as IRoomNativeFederated;
				expect(room.federation?.mrid).toBeTruthy();
				matrixRoomId = room.federation.mrid;
			},
			{ retries: 10, delayMs: 2000 },
		);

		await hs1UserApp.matrixClient.joinRoom(matrixRoomId);

		await rc1UserRequestConfig.request
			.post(api('groups.invite'))
			.set(rc1UserRequestConfig.credentials)
			.send({ roomId, username: namesake.username })
			.expect(200);

		ddp = new DDPListener(federationConfig.rc1.url, rc1UserRequestConfig);
		await ddp.connect();
		ddp.observeUserActivity(roomId);

		const namesakeRequestConfig = await getRequestConfig(federationConfig.rc1.url, namesake.username, namesake.password);
		namesakeDdp = new DDPListener(federationConfig.rc1.url, namesakeRequestConfig);
		await namesakeDdp.connect();

		const current = await rc1AdminRequestConfig.request
			.get(api('settings'))
			.set(rc1AdminRequestConfig.credentials)
			.query({ query: JSON.stringify({ _id: REAL_NAME_SETTING }) })
			.expect(200);
		originalRealName = Boolean(current.body.settings?.[0]?.value);
	}, 180000);

	afterAll(async () => {
		ddp?.disconnect();
		namesakeDdp?.disconnect();
		await setRealName(originalRealName).catch(() => undefined);
		for await (const _id of createdUserIds) {
			await deleteUser({ _id }, { confirmRelinquish: true }, rc1AdminRequestConfig).catch(() => undefined);
		}
		await hs1UserApp?.close();
	});

	describe('when UI_Use_Real_Name is disabled', () => {
		beforeAll(async () => {
			await setRealName(false);
		}, 30000);

		it('should reach the remote server when the activity identifies the user by username', async () => {
			await ddp.publishUserActivity(roomId, localUser.username, ['user-typing']);

			await expectRemoteTyping(true);
		}, 60000);
	});

	describe('when UI_Use_Real_Name is enabled', () => {
		beforeAll(async () => {
			await setRealName(false);
			await ddp.publishUserActivity(roomId, localUser.username, []);
			await expectRemoteTyping(false);

			await setRealName(true);
		}, 120000);

		it('should reach the remote server when the activity identifies the user by real name', async () => {
			await ddp.publishUserActivity(roomId, localUser.name, ['user-typing']);

			await expectRemoteTyping(true);
		}, 60000);

		it('should attribute typing to the account that published it, not to a namesake', async () => {
			await ddp.publishUserActivity(roomId, localUser.name, []);
			await expectRemoteTyping(false);

			await retry(
				`waiting for Synapse to see ${namesake.matrixUserId} in the room`,
				async () => {
					const member = hs1UserApp.matrixClient.getRoom(matrixRoomId)?.getMember(namesake.matrixUserId);

					expect(member?.membership).toMatch(/^(invite|join)$/);
				},
				{ retries: 10, delayMs: 2000 },
			);

			await namesakeDdp.publishUserActivity(roomId, namesake.name, ['user-typing']);

			await retry(
				`waiting for Synapse to report ${namesake.matrixUserId} typing`,
				async () => {
					const typing = remoteTypingUserIds();

					expect(typing).toContain(namesake.matrixUserId);
					expect(typing).not.toContain(localUser.matrixUserId);
				},
				{ retries: 10, delayMs: 2000 },
			);
		}, 120000);
	});

	describe('when a remote user types', () => {
		// the spec sets the Matrix displayname itself rather than trusting the fixture's: without a
		// stored name distinct from the Matrix id, the real name case below asserts nothing
		beforeAll(async () => {
			await expectStoredRemoteName(REMOTE_DISPLAY_NAME);
		}, 60000);

		afterEach(async () => {
			await hs1UserApp.matrixClient.sendTyping(matrixRoomId, false, 0).catch(() => undefined);
		});

		it('should identify the remote user by username when UI_Use_Real_Name is disabled', async () => {
			await setRealName(false);

			await expectLocalTypingIndicator(remoteUser.matrixUserId);
		}, 120000);

		it('should identify the remote user by real name when UI_Use_Real_Name is enabled', async () => {
			await setRealName(true);

			await expectLocalTypingIndicator(REMOTE_DISPLAY_NAME);
		}, 120000);
	});
});
