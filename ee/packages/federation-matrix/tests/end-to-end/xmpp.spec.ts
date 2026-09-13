import type { IMessage, IRoomNativeFederated, IUser } from '@rocket.chat/core-typings';

import { sendMessage } from '../../../../../apps/meteor/tests/data/messages.helper';
import { createRoom, getRoomMembers, loadHistory } from '../../../../../apps/meteor/tests/data/rooms.helper';
import { password } from '../../../../../apps/meteor/tests/data/user';
import { createUser, getRequestConfig, type IRequestConfig, type TestUser } from '../../../../../apps/meteor/tests/data/users.helper';
import { IS_EE } from '../../../../../apps/meteor/tests/e2e/config/constants';
import { retry } from '../../../../../apps/meteor/tests/end-to-end/api/helpers/retry';
import { federationConfig } from '../helper/config';
import { createDDPListener } from '../helper/ddp-listener';
import { wait } from '../helper/synapse-client';
import {
	ensureXmppAppserviceTestBridgeRunning,
	toXmppAppserviceLocalAlias,
	type XmppAppserviceTestBridgeClient,
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
const XMPP_JOIN_COMMAND = 'xmpp-join';
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
	return {
		rcUrl: federationConfig.rc1.url,
		serverName: federationConfig.rc1.domain,
		adminUser: federationConfig.rc1.adminUser,
		adminPassword: federationConfig.rc1.adminPassword,
		bridgeHomeserverUrl: process.env.FEDERATION_XMPP_BRIDGE_HOMESERVER_URL || 'http://rc1:3000',
		bridgeTestUrl: xmppAppserviceTestBridgeConfig.url,
		bridgeAppserviceUrl: process.env.FEDERATION_XMPP_BRIDGE_APPSERVICE_URL || 'http://xmpp-appservice-test-bridge:3300',
		bridgeHsToken: xmppAppserviceTestBridgeConfig.hsToken,
		bridgeAsToken: xmppAppserviceTestBridgeConfig.asToken,
	};
}

type XmppRuntimeConfig = ReturnType<typeof getXmppRuntimeConfig>;

function uniqueSuffix(): string {
	return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function expectedFederatedRoomName(matrixRoomId: string): string {
	return matrixRoomId.replace(/^!/, '').replace(/[^0-9a-zA-Z-_.]/g, '_');
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

	await retry(
		'wait for the XMPP appservice registration',
		async () => {
			const response = await getAppserviceIdentity({ config, asToken });
			expect(response.status).toBe(200);
			expect(response.body.user_id).toBe(`@xmpp:${serverName}`);
		},
		{ retries: 29, delayMs: 500 },
	);
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

function getAppserviceIdentity({ config, asToken }: { config: IRequestConfig; asToken: string }) {
	return config.request.get('/_matrix/client/v3/account/whoami').set('Authorization', `Bearer ${asToken}`);
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
	let runtimeConfig: XmppRuntimeConfig;
	let testRunId: string;
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
	}, 90_000);

	afterAll(async () => {
		try {
			if (createChannelRoles) {
				await updatePermissionRoles({ permission: 'create-c', roles: createChannelRoles, config: rc1AdminRequestConfig });
			}
		} finally {
			if (settingsSnapshot) {
				await restoreSettingsSnapshot(rc1AdminRequestConfig, settingsSnapshot);
			}
		}
	});

	describe('Configuration', () => {
		it('expect to register and authenticate the XMPP appservice', async () => {
			const response = await getAppserviceIdentity({ config: rc1AdminRequestConfig, asToken: runtimeConfig.bridgeAsToken }).expect(200);
			expect(response.body.user_id).toBe(`@xmpp:${runtimeConfig.serverName}`);
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
	});

	describe('Join rooms', () => {
		it('expect to expose the /xmpp-join slash command with the XMPP room alias parameter', async () => {
			const response = await rc1AdminRequestConfig.request
				.get(endpoints.commandsGet)
				.set(rc1AdminRequestConfig.credentials)
				.query({ command: XMPP_JOIN_COMMAND })
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.command.command).toBe(XMPP_JOIN_COMMAND);
			expect(response.body.command.params).toBe('#channel');
		});

		it('expect to join an external XMPP room using /xmpp-join with the hinted #channel parameter', async () => {
			const hintedRoomAlias = `xmpp-hinted-${testRunId}`;
			const hintedLocalAlias = toXmppAppserviceLocalAlias(hintedRoomAlias);

			const response = await executeSlashCommand({
				cmd: XMPP_JOIN_COMMAND,
				params: `#${hintedRoomAlias}`,
				rid: sourceRoomId,
				config: rc1AdminRequestConfig,
			});

			expect(response.body.success).toBe(true);

			const testBridgeRoom = await testBridge.waitForRoom(hintedRoomAlias);
			const rcRoom = await waitForRoomByMatrixId(testBridgeRoom.roomId, rc1AdminRequestConfig);

			expect(testBridgeRoom.alias).toBe(hintedLocalAlias);
			expect(rcRoom).toHaveProperty('federated', true);
			expect(rcRoom.federation.mrid).toBe(testBridgeRoom.roomId);
			expect(rcRoom.t).toBe('c');
		});

		it('expect to show a validation message when no XMPP room alias is provided', async () => {
			const roomsBefore = await testBridge.getRooms();
			const ddpListener = createDDPListener(runtimeConfig.rcUrl, rc1AdminRequestConfig);
			await ddpListener.connect();

			try {
				for (const params of ['', '   ']) {
					ddpListener.clearMessages();
					const response = await executeSlashCommand({
						cmd: XMPP_JOIN_COMMAND,
						params,
						rid: sourceRoomId,
						config: rc1AdminRequestConfig,
					});

					expect(response.body.success).toBe(true);
					const ephemeralMessage = await ddpListener.waitForEphemeralMessage('Please provide a channel to join', 5000, sourceRoomId);
					expect(ephemeralMessage.msg).toContain('Usage: `/xmpp-join #channel`');
					expect(ephemeralMessage.private).toBe(true);
					expect(ephemeralMessage.rid).toBe(sourceRoomId);
					expect(await testBridge.getRooms()).toHaveLength(roomsBefore.length);
				}
			} finally {
				ddpListener.disconnect();
			}
		});

		it('expect to report a bridge rejection without creating a Rocket.Chat room', async () => {
			const rejectedAlias = `xmpp-rejected-${testRunId}`;
			const roomsBefore = await testBridge.getRooms();
			const ddpListener = createDDPListener(runtimeConfig.rcUrl, rc1AdminRequestConfig);
			await testBridge.setRoomJoinFailure(rejectedAlias, { statusCode: 502, error: 'Rejected by test bridge' });
			await ddpListener.connect();

			try {
				const response = await executeSlashCommand({
					cmd: XMPP_JOIN_COMMAND,
					params: rejectedAlias,
					rid: sourceRoomId,
					config: rc1AdminRequestConfig,
				});

				expect(response.body.success).toBe(true);
				const ephemeralMessage = await ddpListener.waitForEphemeralMessage('Could not join the XMPP channel', 5000, sourceRoomId);
				expect(ephemeralMessage.msg).toBe('Could not join the XMPP channel. Please try again later.');
				expect(await testBridge.getRooms()).toHaveLength(roomsBefore.length);

				const roomsResponse = await rc1AdminRequestConfig.request
					.get(endpoints.roomsGet)
					.set(rc1AdminRequestConfig.credentials)
					.expect(200);
				expect(
					roomsResponse.body.update.some((room: IRoomNativeFederated) => room.fname === toXmppAppserviceLocalAlias(rejectedAlias)),
				).toBe(false);
			} finally {
				ddpListener.disconnect();
				await testBridge.setRoomJoinFailure(rejectedAlias, { enabled: false });
			}
		});
	});

	describe('Joined XMPP room', () => {
		let xmppRoomAlias: string;
		let xmppLocalAlias: string;
		let initialJoinSucceeded: boolean;
		let testBridgeRoomAlias: string;
		let testBridgeRoomMatrixId: string;
		let rcXmppRoom: IRoomNativeFederated;

		beforeAll(async () => {
			xmppRoomAlias = `xmpp-room-${testRunId}`;
			xmppLocalAlias = toXmppAppserviceLocalAlias(xmppRoomAlias);

			const initialJoinResponse = await executeSlashCommand({
				cmd: XMPP_JOIN_COMMAND,
				params: xmppRoomAlias,
				rid: sourceRoomId,
				config: rc1AdminRequestConfig,
			});
			initialJoinSucceeded = initialJoinResponse.body.success;

			const testBridgeRoom = await testBridge.waitForRoom(xmppRoomAlias);
			testBridgeRoomAlias = testBridgeRoom.alias;
			testBridgeRoomMatrixId = testBridgeRoom.roomId;
			rcXmppRoom = await waitForRoomByMatrixId(testBridgeRoomMatrixId, rc1AdminRequestConfig);
		}, 60_000);

		it('expect to join an external XMPP room using /xmpp-join from a local user', () => {
			expect(initialJoinSucceeded).toBe(true);
			expect(testBridgeRoomAlias).toBe(xmppLocalAlias);
			expect(rcXmppRoom).toHaveProperty('federated', true);
			expect(rcXmppRoom.federation.mrid).toBe(testBridgeRoomMatrixId);
			expect(rcXmppRoom.name).toBe(expectedFederatedRoomName(testBridgeRoomMatrixId));
			expect(rcXmppRoom.fname).toBe(xmppLocalAlias);
		});

		it('expect to reuse the existing Rocket.Chat channel when joining the same XMPP room again', async () => {
			const response = await executeSlashCommand({
				cmd: XMPP_JOIN_COMMAND,
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
				cmd: XMPP_JOIN_COMMAND,
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

				const matchingEvent = transaction.body.events?.find(
					(event) => event.type === 'm.room.message' && event.room_id === testBridgeRoomMatrixId && event.content?.body === messageText,
				);

				expect(matchingEvent).toMatchObject({
					type: 'm.room.message',
					sender: `@${runtimeConfig.adminUser}:${runtimeConfig.serverName}`,
					room_id: testBridgeRoomMatrixId,
					content: {
						body: messageText,
						msgtype: 'm.text',
					},
				});
				expect(matchingEvent?.event_id).toBeTruthy();
			});

			describe('XMPP participant', () => {
				let xmppParticipantDisplayName: string;
				let xmppParticipantUserId: string;
				let xmppParticipantAppserviceUserId: string;
				let xmppParticipantEventId: string;
				let xmppParticipantMessage: IMessage;

				beforeAll(async () => {
					xmppParticipantDisplayName = `Alice XMPP ${testRunId}`;
					const messageText = `Hello from XMPP appservice test bridge ${Date.now()}`;
					const result = await testBridge.sendMessage(xmppRoomAlias, {
						sender: `alice-${testRunId}/${xmppRoomAlias}@example.test`,
						displayName: xmppParticipantDisplayName,
						body: messageText,
					});

					xmppParticipantUserId = result.userId;
					xmppParticipantAppserviceUserId = result.appserviceUserId;
					xmppParticipantEventId = result.eventId;
					xmppParticipantMessage = await waitForMessage(rcXmppRoom._id, messageText, rc1AdminRequestConfig);
				});

				it('expect to receive a message from an XMPP participant in Rocket.Chat', () => {
					expect(xmppParticipantMessage.federation?.eventId).toBe(xmppParticipantEventId);
					expect(xmppParticipantMessage.u.username).toBe(xmppParticipantUserId);
					expect(xmppParticipantAppserviceUserId).not.toBe(xmppParticipantUserId);
					expect(xmppParticipantAppserviceUserId).toContain('=2f');
				});

				it('expect to render XMPP participant messages with the correct sender display name', async () => {
					const user = await waitForUserByUsername(xmppParticipantUserId, rc1AdminRequestConfig);
					expect(user.name).toBe(xmppParticipantDisplayName);
				});

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

			it('expect to normalize a Bifrost XMPP occupant ID while preserving its display name', async () => {
				const resource = `BifrostUser-${testRunId}`;
				const jid = `${resource}/${xmppRoomAlias}+topic@conference.example.test`;
				const messageText = `Hello from Bifrost-style XMPP JID ${Date.now()}`;
				const result = await testBridge.sendMessage(xmppRoomAlias, {
					sender: jid,
					displayName: resource,
					body: messageText,
				});

				const message = await waitForMessage(rcXmppRoom._id, messageText, rc1AdminRequestConfig);
				expect(result.userId).toBe(`@_xmpp_${resource}:${runtimeConfig.serverName}`);
				expect(result.appserviceUserId).toContain('=2f');
				expect(result.appserviceUserId).toContain('=40');
				expect(result.appserviceUserId).toContain('=2b');
				expect(message.u.username).toBe(result.userId);

				const user = await waitForUserByUsername(result.userId, rc1AdminRequestConfig);
				expect(user.name).toBe(resource);
			});
		});
	});

	describe('Namespace security', () => {
		it('expect the XMPP appservice to register users inside its namespace', async () => {
			const localpart = `_xmpp_reserved_${testRunId}`;
			const response = await registerAppserviceUser({ localpart, config: rc1AdminRequestConfig, runtimeConfig }).expect(200);
			const userId = response.body.user_id;

			expect(userId).toBe(`@${localpart}:${runtimeConfig.serverName}`);

			const user = await waitForUserByUsername(userId, rc1AdminRequestConfig);
			expect(user.federated).toBe(true);
			expect(user.roles).toContain('federated-external');
		});

		it('expect to reject local user creation inside the exclusive XMPP namespace', async () => {
			const username = `_xmpp_local_${testRunId}`;
			const response = await rc1AdminRequestConfig.request
				.post(endpoints.usersCreate)
				.set(rc1AdminRequestConfig.credentials)
				.send({
					email: `${username}@example.test`,
					name: username,
					username,
					password,
					roles: ['user'],
					active: true,
				})
				.expect(400);

			expect(response.body.success).toBe(false);
			expect(response.body.errorType).toBe('error-field-unavailable');
			expect(response.body.error).toContain(`${username} is already in use`);
			expect(await getUserByUsername(username, rc1AdminRequestConfig)).toBeUndefined();
		});
	});
});
