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
const localUser = {
	username: `fed-typist-${stamp}`,
	password: 'typing-spec-pass',
	name: 'Wilhelmina Featherstonehaugh',
	matrixUserId: `@fed-typist-${stamp}:${federationConfig.rc1.domain}`,
};

(IS_EE ? describe : describe.skip)('Federation typing indicators', () => {
	let rc1AdminRequestConfig: IRequestConfig;
	let rc1UserRequestConfig: IRequestConfig;
	let hs1UserApp: SynapseClient;
	let ddp: DDPListener;
	let createdUserId: string;
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

		const created = await createUser(
			{
				username: localUser.username,
				password: localUser.password,
				email: `${localUser.username}@rocket.chat`,
				name: localUser.name,
			},
			rc1AdminRequestConfig,
		);
		createdUserId = (created as unknown as { _id: string })._id;

		rc1UserRequestConfig = await getRequestConfig(federationConfig.rc1.url, localUser.username, localUser.password);

		hs1UserApp = new SynapseClient(federationConfig.hs1.url, remoteUser.username, remoteUser.password);
		await hs1UserApp.initialize();

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

		ddp = new DDPListener(federationConfig.rc1.url, rc1UserRequestConfig);
		await ddp.connect();

		const current = await rc1AdminRequestConfig.request
			.get(api('settings'))
			.set(rc1AdminRequestConfig.credentials)
			.query({ query: JSON.stringify({ _id: REAL_NAME_SETTING }) })
			.expect(200);
		originalRealName = Boolean(current.body.settings?.[0]?.value);
	}, 180000);

	afterAll(async () => {
		ddp?.disconnect();
		await setRealName(originalRealName).catch(() => undefined);
		if (createdUserId) {
			await deleteUser({ _id: createdUserId }, { confirmRelinquish: true }, rc1AdminRequestConfig).catch(() => undefined);
		}
		await hs1UserApp?.close();
	});

	describe('when UI_Use_Real_Name is disabled', () => {
		beforeAll(async () => {
			await setRealName(false);
		}, 30000);

		it('should reach the remote server when the user types', async () => {
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

		it('should reach the remote server when the user types', async () => {
			await ddp.publishUserActivity(roomId, localUser.name, ['user-typing']);

			await expectRemoteTyping(true);
		}, 60000);
	});
});
