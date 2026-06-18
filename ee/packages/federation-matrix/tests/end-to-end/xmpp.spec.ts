import type { IMessage, IRoomNativeFederated, IUser } from '@rocket.chat/core-typings';

import { sendMessage } from '../../../../../apps/meteor/tests/data/messages.helper';
import { createRoom, getRoomMembers, loadHistory } from '../../../../../apps/meteor/tests/data/rooms.helper';
import { password } from '../../../../../apps/meteor/tests/data/user';
import { createUser, getRequestConfig, type IRequestConfig, type TestUser } from '../../../../../apps/meteor/tests/data/users.helper';
import { IS_EE } from '../../../../../apps/meteor/tests/e2e/config/constants';
import { federationConfig } from '../helper/config';
import { wait } from '../helper/synapse-client';
import {
	ensureXmppAppserviceTestBridgeRunning,
	toXmppAppserviceLocalAlias,
	type XmppAppserviceTestBridgeClient,
	type XmppAppserviceTestBridgeRoom,
	xmppAppserviceTestBridgeConfig,
} from '../helper/xmpp-appservice-test-bridge';

const XMPP_FEDERATION_SETTINGS = [
	'Federation_Service_Domain',
	'Federation_Service_Enabled',
	'Federation_XMPP_Enabled',
	'Federation_XMPP_Bridge_URL',
	'Federation_XMPP_Bridge_HS_Token',
	'Federation_XMPP_Bridge_AS_Token',
	'UI_Use_Real_Name',
] as const;
const endpoints = {
	commandsGet: '/api/v1/commands.get',
	commandsRun: '/api/v1/commands.run',
	permissionsUpdate: '/api/v1/permissions.update',
	roomsGet: '/api/v1/rooms.get',
	subscriptionsGetOne: '/api/v1/subscriptions.getOne',
	usersCreate: '/api/v1/users.create',
	usersInfo: '/api/v1/users.info',
} as const;

function getXmppRuntimeConfig() {
	const rcUrl = process.env.FEDERATION_RC1_URL || federationConfig.rc1.url;
	const serverName = process.env.FEDERATION_RC1_DOMAIN || federationConfig.rc1.domain;

	return {
		rcUrl,
		serverName,
		adminUser: process.env.FEDERATION_RC1_ADMIN_USER || federationConfig.rc1.adminUser,
		adminPassword: process.env.FEDERATION_RC1_ADMIN_PASSWORD || federationConfig.rc1.adminPassword,
		bridgeHomeserverUrl: process.env.FEDERATION_XMPP_BRIDGE_HOMESERVER_URL || 'http://rc1:3000',
		bridgeTestUrl: xmppAppserviceTestBridgeConfig.url,
		bridgeAppserviceUrl:
			process.env.FEDERATION_XMPP_BRIDGE_URL ||
			process.env.FEDERATION_XMPP_BRIDGE_APPSERVICE_URL ||
			'http://xmpp-appservice-test-bridge:3300',
		bridgeHsToken: xmppAppserviceTestBridgeConfig.hsToken,
		bridgeAsToken: xmppAppserviceTestBridgeConfig.asToken,
	};
}

type XmppRuntimeConfig = ReturnType<typeof getXmppRuntimeConfig>;

function uniqueSuffix(): string {
	return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function safeLocalpart(value: string): string {
	return value.replace(/[^A-Za-z0-9_=/.+-]/g, '_');
}

async function updateSetting({ setting, value, config }: { setting: string; value: unknown; config: IRequestConfig }) {
	await config.request
		.post(`/api/v1/settings/${setting}`)
		.set(config.credentials)
		.send({ value })
		.expect('Content-Type', 'application/json')
		.expect(200)
		.expect((response) => {
			expect(response.body.success).toBe(true);
		});
}

async function getSettingValue({ setting, config }: { setting: string; config: IRequestConfig }): Promise<unknown> {
	const response = await config.request
		.get(`/api/v1/settings/${setting}`)
		.set(config.credentials)
		.expect('Content-Type', 'application/json')
		.expect(200);

	return response.body.value;
}

async function getSettingsSnapshot(config: IRequestConfig): Promise<Record<string, unknown>> {
	const entries = await Promise.all(
		XMPP_FEDERATION_SETTINGS.map(async (setting) => [setting, await getSettingValue({ setting, config })] as const),
	);

	return Object.fromEntries(entries);
}

async function restoreSettingsSnapshot(config: IRequestConfig, snapshot: Record<string, unknown>): Promise<void> {
	for (const setting of XMPP_FEDERATION_SETTINGS) {
		await updateSetting({ setting, value: snapshot[setting], config });
	}
}

async function getPermissionRoles({ permission, config }: { permission: string; config: IRequestConfig }): Promise<string[]> {
	const response = await config.request
		.get('/api/v1/permissions.listAll')
		.query({ updatedSince: 0 })
		.set(config.credentials)
		.expect('Content-Type', 'application/json')
		.expect(200);

	const permissionRecord = response.body.update.find((permissionRecord: { _id: string }) => permissionRecord._id === permission);
	return permissionRecord?.roles ?? [];
}

async function updatePermissionRoles({ permission, roles, config }: { permission: string; roles: string[]; config: IRequestConfig }) {
	await config.request
		.post(endpoints.permissionsUpdate)
		.set(config.credentials)
		.send({ permissions: [{ _id: permission, roles }] })
		.expect('Content-Type', 'application/json')
		.expect(200)
		.expect((response) => {
			expect(response.body.success).toBe(true);
		});
}

async function allowFederatedExternalRoomCreation(config: IRequestConfig): Promise<string[]> {
	const originalRoles = await getPermissionRoles({ permission: 'create-c', config });
	if (!originalRoles.includes('federated-external')) {
		await updatePermissionRoles({
			permission: 'create-c',
			roles: [...originalRoles, 'federated-external'],
			config,
		});
	}

	return originalRoles;
}

async function configureXmppFederation({
	config,
	serverName,
	bridgeUrl,
	hsToken,
	asToken,
}: {
	config: IRequestConfig;
	serverName: string;
	bridgeUrl: string;
	hsToken: string;
	asToken: string;
}) {
	await updateSetting({ setting: 'Federation_Service_Domain', value: serverName, config });
	await updateSetting({ setting: 'Federation_XMPP_Bridge_URL', value: bridgeUrl, config });
	await updateSetting({ setting: 'Federation_XMPP_Bridge_HS_Token', value: hsToken, config });
	await updateSetting({ setting: 'Federation_XMPP_Bridge_AS_Token', value: asToken, config });
	await updateSetting({ setting: 'Federation_XMPP_Enabled', value: true, config });
	await updateSetting({ setting: 'Federation_Service_Enabled', value: true, config });

	await wait(1500);
}

async function executeSlashCommand({ cmd, params, rid, config }: { cmd: string; params: string; rid: string; config: IRequestConfig }) {
	return config.request
		.post(endpoints.commandsRun)
		.set(config.credentials)
		.send({
			command: cmd,
			params,
			roomId: rid,
			triggerId: `test-trigger-${Date.now()}`,
		});
}

function expectRejectedCommand(response: { status: number; body: { success?: boolean } }) {
	expect(response.status >= 400 || response.body.success === false).toBe(true);
}

async function getUserByUsername(username: string, config: IRequestConfig): Promise<IUser | undefined> {
	const response = await config.request.get(endpoints.usersInfo).set(config.credentials).query({ username });
	return response.body.user;
}

async function waitForUserByUsername(username: string, config: IRequestConfig): Promise<IUser> {
	for (let attempt = 1; attempt <= 10; attempt++) {
		const user = await getUserByUsername(username, config);
		if (user) {
			return user;
		}

		await wait(1000);
	}

	throw new Error(`Rocket.Chat user was not found for username ${username}`);
}

async function waitForRoomMember(roomId: string, username: string, config: IRequestConfig): Promise<IUser> {
	for (let attempt = 1; attempt <= 10; attempt++) {
		const membersResponse = await getRoomMembers(roomId, config);
		const member = membersResponse.members.find((member: IUser) => member.username === username);
		if (member) {
			return member;
		}

		await wait(1000);
	}

	throw new Error(`Rocket.Chat room member ${username} was not found in room ${roomId}`);
}

function registerAppserviceUser({
	localpart,
	config,
	runtimeConfig,
}: {
	localpart: string;
	config: IRequestConfig;
	runtimeConfig: XmppRuntimeConfig;
}) {
	return config.request.post('/_matrix/client/v3/register').set('Authorization', `Bearer ${runtimeConfig.bridgeAsToken}`).send({
		type: 'm.login.application_service',
		username: localpart,
	});
}

async function findRoomByMatrixId(matrixRoomId: string, config: IRequestConfig): Promise<IRoomNativeFederated | undefined> {
	const roomsResponse = await config.request.get(endpoints.roomsGet).set(config.credentials).expect(200);
	return roomsResponse.body.update.find((room: IRoomNativeFederated) => room.federation?.mrid === matrixRoomId);
}

async function waitForRoomByMatrixId(matrixRoomId: string, config: IRequestConfig): Promise<IRoomNativeFederated> {
	for (let attempt = 1; attempt <= 10; attempt++) {
		const room = await findRoomByMatrixId(matrixRoomId, config);
		if (room) {
			return room;
		}

		await wait(1000);
	}

	throw new Error(`Rocket.Chat room was not found for Matrix room ${matrixRoomId}`);
}

async function waitForNewBridgeRoom(
	existingRoomIds: Set<string>,
	testBridge: XmppAppserviceTestBridgeClient,
): Promise<XmppAppserviceTestBridgeRoom> {
	for (let attempt = 1; attempt <= 10; attempt++) {
		const room = (await testBridge.getRooms()).find((room) => !existingRoomIds.has(room.roomId));
		if (room) {
			return room;
		}

		await wait(1000);
	}

	throw new Error('XMPP appservice test bridge did not create a new room');
}

async function waitForMessage(roomId: string, text: string, config: IRequestConfig): Promise<IMessage> {
	for (let attempt = 1; attempt <= 10; attempt++) {
		const history = await loadHistory(roomId, config);
		const message = history.messages.find((message) => message.msg === text);
		if (message) {
			return message;
		}

		await wait(1000);
	}

	throw new Error(`Message "${text}" was not found in room ${roomId}`);
}

(IS_EE ? describe : describe.skip)('Federation - XMPP appservice test bridge', () => {
	let rc1AdminRequestConfig: IRequestConfig;
	let secondUserRequestConfig: IRequestConfig;
	let sourceRoomId: string;
	let testBridge: XmppAppserviceTestBridgeClient;
	let stopTestBridge: () => Promise<void>;
	let runtimeConfig: XmppRuntimeConfig;
	let testRunId: string;
	let xmppRoomAlias: string;
	let xmppLocalAlias: string;
	let xmppParticipant: string;
	let xmppParticipantDisplayName: string;
	let xmppParticipantUserId: string;
	let testBridgeRoomMatrixId: string;
	let rcXmppRoom: IRoomNativeFederated;
	let secondLocalUser: TestUser<IUser>;
	let createChannelRoles: string[] | undefined;
	let settingsSnapshot: Record<string, unknown> | undefined;

	beforeAll(async () => {
		runtimeConfig = getXmppRuntimeConfig();
		testRunId = uniqueSuffix();

		rc1AdminRequestConfig = await getRequestConfig(runtimeConfig.rcUrl, runtimeConfig.adminUser, runtimeConfig.adminPassword);
		settingsSnapshot = await getSettingsSnapshot(rc1AdminRequestConfig);
		createChannelRoles = await allowFederatedExternalRoomCreation(rc1AdminRequestConfig);

		const bridge = await ensureXmppAppserviceTestBridgeRunning({
			baseUrl: runtimeConfig.bridgeTestUrl,
			homeserverUrl: runtimeConfig.bridgeHomeserverUrl,
			serverName: runtimeConfig.serverName,
			hsToken: runtimeConfig.bridgeHsToken,
			asToken: runtimeConfig.bridgeAsToken,
		});

		testBridge = bridge.client;
		stopTestBridge = bridge.stop;
		await testBridge.reset();

		await configureXmppFederation({
			config: rc1AdminRequestConfig,
			serverName: runtimeConfig.serverName,
			bridgeUrl: runtimeConfig.bridgeAppserviceUrl,
			hsToken: runtimeConfig.bridgeHsToken,
			asToken: runtimeConfig.bridgeAsToken,
		});
		await updateSetting({ setting: 'UI_Use_Real_Name', value: true, config: rc1AdminRequestConfig });

		secondLocalUser = await createUser<IUser>(
			{
				username: `xmpp-local-${testRunId}`,
				password,
			},
			rc1AdminRequestConfig,
		);
		secondUserRequestConfig = await getRequestConfig(runtimeConfig.rcUrl, secondLocalUser.username, password);

		const sourceRoomName = `xmpp-command-source-${testRunId}`;
		const sourceRoomResponse = await createRoom({
			type: 'c',
			name: sourceRoomName,
			members: [secondLocalUser.username],
			config: rc1AdminRequestConfig,
		});
		sourceRoomId = sourceRoomResponse.body.channel._id;

		xmppRoomAlias = `xmpp-room-${testRunId}`;
		xmppLocalAlias = toXmppAppserviceLocalAlias(xmppRoomAlias);
		xmppParticipant = `${xmppRoomAlias}-alice@example.test`;
		xmppParticipantDisplayName = `Alice XMPP ${testRunId}`;
	});

	afterAll(async () => {
		try {
			if (createChannelRoles) {
				await updatePermissionRoles({ permission: 'create-c', roles: createChannelRoles, config: rc1AdminRequestConfig });
			}
			if (settingsSnapshot) {
				await restoreSettingsSnapshot(rc1AdminRequestConfig, settingsSnapshot);
			}
		} finally {
			await stopTestBridge?.();
		}
	});

	describe('Configuration', () => {
		it('expect to register the XMPP bridge with the Rocket.Chat Service API', async () => {
			const health = await testBridge.health();
			expect(health.ok).toBe(true);
			expect(health.homeserverUrl).toBe(runtimeConfig.bridgeHomeserverUrl);
			expect(health.serverName).toBe(runtimeConfig.serverName);
		});

		it('expect to enable XMPP bridge settings when federation service is enabled', async () => {
			await expect(getSettingValue({ setting: 'Federation_Service_Enabled', config: rc1AdminRequestConfig })).resolves.toBe(true);
			await expect(getSettingValue({ setting: 'Federation_XMPP_Enabled', config: rc1AdminRequestConfig })).resolves.toBe(true);
		});

		it('expect to save the XMPP bridge URL, homeserver token, and appservice token', async () => {
			await expect(getSettingValue({ setting: 'Federation_XMPP_Bridge_URL', config: rc1AdminRequestConfig })).resolves.toBe(
				runtimeConfig.bridgeAppserviceUrl,
			);
			await expect(getSettingValue({ setting: 'Federation_XMPP_Bridge_HS_Token', config: rc1AdminRequestConfig })).resolves.toBe(
				runtimeConfig.bridgeHsToken,
			);
			await expect(getSettingValue({ setting: 'Federation_XMPP_Bridge_AS_Token', config: rc1AdminRequestConfig })).resolves.toBe(
				runtimeConfig.bridgeAsToken,
			);
		});

		it('expect to apply XMPP bridge configuration after federation settings change', async () => {
			const transientAlias = `xmpp-config-${testRunId}`;
			const transientLocalAlias = toXmppAppserviceLocalAlias(transientAlias);

			const response = await executeSlashCommand({
				cmd: 'xmpp',
				params: transientAlias,
				rid: sourceRoomId,
				config: rc1AdminRequestConfig,
			});

			expect(response.body.success).toBe(true);
			expect((await testBridge.waitForRoom(transientAlias)).alias).toBe(transientLocalAlias);
		});
	});

	describe('Join rooms', () => {
		it('expect to expose the /xmpp slash command with the XMPP room alias parameter', async () => {
			const response = await rc1AdminRequestConfig.request
				.get(endpoints.commandsGet)
				.set(rc1AdminRequestConfig.credentials)
				.query({ command: 'xmpp' })
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.command.command).toBe('xmpp');
			expect(response.body.command.params).toBe('#channel');
		});

		it('expect to join an external XMPP room using /xmpp from a local user', async () => {
			const response = await executeSlashCommand({
				cmd: 'xmpp',
				params: xmppRoomAlias,
				rid: sourceRoomId,
				config: rc1AdminRequestConfig,
			});

			expect(response.body.success).toBe(true);

			const testBridgeRoom = await testBridge.waitForRoom(xmppRoomAlias);
			expect(testBridgeRoom.alias).toBe(xmppLocalAlias);

			testBridgeRoomMatrixId = testBridgeRoom.roomId;
			rcXmppRoom = await waitForRoomByMatrixId(testBridgeRoomMatrixId, rc1AdminRequestConfig);

			expect(rcXmppRoom).toHaveProperty('federated', true);
			expect(rcXmppRoom.federation.mrid).toBe(testBridgeRoomMatrixId);
			expect(rcXmppRoom.name).toBe(xmppLocalAlias);
		});

		it('expect to join an external XMPP room using /xmpp with the hinted #channel parameter', async () => {
			const hintedRoomAlias = `xmpp-hinted-${testRunId}`;
			const roomsBefore = await testBridge.getRooms();
			const existingRoomIds = new Set(roomsBefore.map((room) => room.roomId));

			const response = await executeSlashCommand({
				cmd: 'xmpp',
				params: `#${hintedRoomAlias}`,
				rid: sourceRoomId,
				config: rc1AdminRequestConfig,
			});

			expect(response.body.success).toBe(true);

			const testBridgeRoom = await waitForNewBridgeRoom(existingRoomIds, testBridge);
			const rcRoom = await waitForRoomByMatrixId(testBridgeRoom.roomId, rc1AdminRequestConfig);

			expect(rcRoom).toHaveProperty('federated', true);
			expect(rcRoom.federation.mrid).toBe(testBridgeRoom.roomId);
			expect(rcRoom.t).toBe('c');
		});

		it('expect to reject /xmpp when no XMPP room alias is provided', async () => {
			const roomsBefore = await testBridge.getRooms();
			for (const params of ['', '   ']) {
				const response = await executeSlashCommand({
					cmd: 'xmpp',
					params,
					rid: sourceRoomId,
					config: rc1AdminRequestConfig,
				});

				expectRejectedCommand(response);
				expect(await testBridge.getRooms()).toHaveLength(roomsBefore.length);
			}
		});

		it('expect to create a Rocket.Chat channel for the joined XMPP room', async () => {
			expect(rcXmppRoom).toHaveProperty('federated', true);
			expect(rcXmppRoom.name).toBe(xmppLocalAlias);
			expect(rcXmppRoom.t).toBe('c');
		});

		it('expect to reuse the existing Rocket.Chat channel when joining the same XMPP room again', async () => {
			const response = await executeSlashCommand({
				cmd: 'xmpp',
				params: xmppRoomAlias,
				rid: sourceRoomId,
				config: rc1AdminRequestConfig,
			});
			expect(response.body.success).toBe(true);

			const testBridgeRoom = await testBridge.waitForRoom(xmppRoomAlias);
			expect(testBridgeRoom.roomId).toBe(testBridgeRoomMatrixId);

			const rcRoom = await waitForRoomByMatrixId(testBridgeRoom.roomId, rc1AdminRequestConfig);
			expect(rcRoom._id).toBe(rcXmppRoom._id);
		});

		it('expect two local users joining the same XMPP room to share the same Rocket.Chat channel', async () => {
			const response = await executeSlashCommand({
				cmd: 'xmpp',
				params: xmppRoomAlias,
				rid: sourceRoomId,
				config: secondUserRequestConfig,
			});
			expect(response.body.success).toBe(true);

			const testBridgeRoom = await testBridge.waitForRoom(xmppRoomAlias);
			const rcRoom = await waitForRoomByMatrixId(testBridgeRoom.roomId, rc1AdminRequestConfig);
			expect(rcRoom._id).toBe(rcXmppRoom._id);

			const subscriptionResponse = await secondUserRequestConfig.request
				.get(endpoints.subscriptionsGetOne)
				.set(secondUserRequestConfig.credentials)
				.query({ roomId: rcXmppRoom._id })
				.expect(200);

			expect(subscriptionResponse.body.subscription?.rid).toBe(rcXmppRoom._id);
		});

		it('expect to show a failure when the XMPP bridge rejects the room join', async () => {
			const rejectedAlias = `xmpp-rejected-${testRunId}`;
			await testBridge.setRoomJoinFailure(rejectedAlias, {
				error: 'Rejected by XMPP appservice test bridge',
			});

			const response = await executeSlashCommand({
				cmd: 'xmpp',
				params: rejectedAlias,
				rid: sourceRoomId,
				config: rc1AdminRequestConfig,
			});

			expectRejectedCommand(response);
			expect(await testBridge.getRoom(rejectedAlias)).toBeUndefined();
		});
	});

	describe('Messaging', () => {
		it('expect to send a message from Rocket.Chat to an XMPP room', async () => {
			const messageText = `Hello test bridge from Rocket.Chat ${Date.now()}`;

			const response = await sendMessage({
				rid: rcXmppRoom._id,
				msg: messageText,
				config: rc1AdminRequestConfig,
			});
			expect(response.body.success).toBe(true);

			const transaction = await testBridge.waitForTransaction((transaction) =>
				Boolean(
					transaction.body.events?.some(
						(event) => event.type === 'm.room.message' && event.room_id === testBridgeRoomMatrixId && event.content?.body === messageText,
					),
				),
			);

			expect(transaction.txnId).toBeTruthy();
		});

		it('expect to receive a message from an XMPP participant in Rocket.Chat', async () => {
			const messageText = `Hello from XMPP appservice test bridge ${Date.now()}`;
			const result = await testBridge.sendMessage(xmppRoomAlias, {
				sender: xmppParticipant,
				displayName: xmppParticipantDisplayName,
				body: messageText,
			});
			xmppParticipantUserId = result.userId;

			const message = await waitForMessage(rcXmppRoom._id, messageText, rc1AdminRequestConfig);
			expect(message.federation?.eventId).toBe(result.eventId);
			expect(message.u.username).toBe(result.userId);

			const member = await waitForRoomMember(rcXmppRoom._id, result.userId, rc1AdminRequestConfig);
			expect(member.username).toBe(result.userId);
		});

		it('expect to render XMPP participant messages with the correct sender display name', async () => {
			const user = await waitForUserByUsername(xmppParticipantUserId, rc1AdminRequestConfig);
			expect(user.name).toBe(xmppParticipantDisplayName);
		});

		it('expect to display a Bifrost XMPP JID as the mapped Rocket.Chat user real name', async () => {
			const jid = `bifrost-user-${testRunId}@conference.example.test`;
			const messageText = `Hello from Bifrost-style XMPP JID ${Date.now()}`;
			const result = await testBridge.sendMessage(xmppRoomAlias, {
				sender: jid,
				body: messageText,
			});

			const message = await waitForMessage(rcXmppRoom._id, messageText, rc1AdminRequestConfig);
			expect(message.u.username).toBe(result.userId);

			const user = await waitForUserByUsername(result.userId, rc1AdminRequestConfig);
			expect(user.name).toBe(jid);
			expect(user.name).not.toMatch(/^@_xmpp_/);
			expect(user.name).not.toContain('=40');
		});
	});

	describe('Membership and identity', () => {
		it('expect to create local federated users for XMPP participants', async () => {
			const user = await waitForUserByUsername(xmppParticipantUserId, rc1AdminRequestConfig);

			expect(user.username).toBe(xmppParticipantUserId);
			expect(user.federated).toBe(true);
			expect(user.roles).toContain('federated-external');
		});

		it('expect to list XMPP participants in the room members list', async () => {
			const member = await waitForRoomMember(rcXmppRoom._id, xmppParticipantUserId, rc1AdminRequestConfig);
			expect(member.username).toBe(xmppParticipantUserId);
		});
	});

	describe('Namespace security', () => {
		it('expect to reserve the _xmpp_ namespace for federated identities', async () => {
			const localpart = `_xmpp_reserved_${safeLocalpart(testRunId)}`;
			const response = await registerAppserviceUser({ localpart, config: rc1AdminRequestConfig, runtimeConfig }).expect(200);
			const userId = `@${localpart}:${runtimeConfig.serverName}`;

			expect(response.body.user_id).toBe(userId);

			const user = await waitForUserByUsername(userId, rc1AdminRequestConfig);
			expect(user.federated).toBe(true);
			expect(user.roles).toContain('federated-external');
		});

		it('expect to reject XMPP appservice user registration outside the reserved _xmpp_ namespace', async () => {
			const localpart = `not_xmpp_${safeLocalpart(testRunId)}`;
			const response = await registerAppserviceUser({ localpart, config: rc1AdminRequestConfig, runtimeConfig });

			expect(response.status).toBe(403);
			expect(response.body.errcode).toBe('M_FORBIDDEN');
		});

		it('expect to reject local user creation using the reserved _xmpp_ namespace', async () => {
			const username = `_xmpp_local_${safeLocalpart(testRunId)}`;
			const response = await rc1AdminRequestConfig.request
				.post(endpoints.usersCreate)
				.set(rc1AdminRequestConfig.credentials)
				.send({
					email: `${username}@rocket.chat`,
					name: username,
					username,
					password,
					active: true,
					roles: ['user'],
					verified: true,
				});

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toMatch(/xmpp|reserved|blocked/i);
		});
	});
});
