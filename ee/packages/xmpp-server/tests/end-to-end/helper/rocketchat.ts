import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';

import type { IMessage, IRoom } from '@rocket.chat/core-typings';

import type { Cleanup } from './cleanup';
import { DUPLICATE_SETTLE_MS, config, federationPolling, uniqueSuffix } from './config';
import { api, apiUrl } from '../../../../../../apps/meteor/tests/data/api-data';
import { sendMessage as sendMessageViaRest } from '../../../../../../apps/meteor/tests/data/messages.helper';
import { createRoom, getRoomInfo, getRoomMembers } from '../../../../../../apps/meteor/tests/data/rooms.helper';
import { adminPassword, adminUsername, password } from '../../../../../../apps/meteor/tests/data/user';
import { createUser, deleteUser, findUserByUsername, getRequestConfig } from '../../../../../../apps/meteor/tests/data/users.helper';
import type { IRequestConfig } from '../../../../../../apps/meteor/tests/data/users.helper';
import { retry } from '../../../../../../apps/meteor/tests/end-to-end/api/helpers/retry';
import { DDPListener } from '../../../../federation-matrix/tests/helper/ddp-listener';
import { isDomainAllowed } from '../../../src/jid/normalize';

type Endpoint = Parameters<typeof api>[0];

async function get<T>(user: IRequestConfig, path: string, query: Record<string, string | number> = {}): Promise<T> {
	const res = await user.request
		.get(api(path as Endpoint))
		.set(user.credentials)
		.query(query);
	return expectSuccess<T>(path, res);
}

async function post<T>(user: IRequestConfig, path: string, body: unknown, headers: Record<string, string> = {}): Promise<T> {
	const res = await user.request
		.post(api(path as Endpoint))
		.set({ ...user.credentials, ...headers })
		.send(body as object);
	return expectSuccess<T>(path, res);
}

function expectSuccess<T>(path: string, res: { status: number; body: { success?: boolean } }): T {
	if (res.status !== 200 || res.body?.success !== true) {
		throw new Error(`${path} failed with status ${res.status}: ${JSON.stringify(res.body)}`);
	}
	return res.body as T;
}

export type RocketChat = {
	admin: IRequestConfig;
	/** Rocket.Chat's own XMPP domain (`XMPP_Server_Domain`). */
	domain: string;
	mucDomain: string;
	cleanup: Cleanup;
	roomsToDelete: Set<string>;
};

export const getSetting = async <T>(rc: Pick<RocketChat, 'admin'>, id: string): Promise<T> =>
	(await get<{ value: T }>(rc.admin, `settings/${id}`)).value;

/** Changing a setting asks for two-factor confirmation, which the password method answers with its SHA-256. */
export const setSetting = (rc: Pick<RocketChat, 'admin'>, id: string, value: unknown): Promise<unknown> =>
	post(
		rc.admin,
		`settings/${id}`,
		{ value },
		{ 'x-2fa-code': crypto.createHash('sha256').update(adminPassword).digest('hex'), 'x-2fa-method': 'password' },
	);

/** Changes a setting for the rest of the suite and queues the original value for restoring. */
export async function overrideSetting(rc: RocketChat, id: string, value: unknown): Promise<void> {
	const original = await getSetting(rc, id);
	if (original === value) {
		return;
	}
	rc.cleanup.add(() => setSetting(rc, id, original));
	await setSetting(rc, id, value);
}

/** Logs in as the repo's test admin and fails fast when Rocket.Chat does not federate with the XMPP server under test. */
export async function connectRocketChat(cleanup: Cleanup): Promise<RocketChat> {
	const admin = await getRequestConfig(apiUrl, adminUsername, adminPassword);

	const [enabled, domain, mucSubdomain, allowList] = await Promise.all([
		getSetting<boolean>({ admin }, 'XMPP_Server_Enabled'),
		getSetting<string>({ admin }, 'XMPP_Server_Domain'),
		getSetting<string>({ admin }, 'XMPP_Server_MUC_Subdomain'),
		getSetting<string>({ admin }, 'XMPP_Server_Domain_Allow_List'),
	]);
	assert.ok(enabled, 'XMPP_Server_Enabled is off in Rocket.Chat');
	assert.ok(domain, 'XMPP_Server_Domain is empty in Rocket.Chat');

	assertAllowed(allowList, config.xmpp.domain);

	return { admin, domain, mucDomain: `${mucSubdomain || 'conference'}.${domain}`, cleanup, roomsToDelete: new Set() };
}

function assertAllowed(allowList: string, domain: string): void {
	const allowed = allowList
		.split(',')
		.map((entry) => entry.trim())
		.filter(Boolean);
	assert.ok(isDomainAllowed(domain, allowed), `XMPP_Server_Domain_Allow_List (${allowList}) does not include ${domain}`);
}

/** Fails fast when Rocket.Chat's allow list would refuse `domain`, instead of letting a later step time out. */
export async function assertDomainAllowed(rc: Pick<RocketChat, 'admin'>, domain: string): Promise<void> {
	assertAllowed(await getSetting<string>(rc, 'XMPP_Server_Domain_Allow_List'), domain);
}

/** Deletes the suite's rooms, then runs every other cleanup task. */
export async function teardown(rc: RocketChat | undefined): Promise<void> {
	if (!rc) {
		return;
	}
	for (const roomId of rc.roomsToDelete) {
		await post(rc.admin, 'rooms.delete', { roomId }).catch(() => undefined);
	}
	await rc.cleanup.run();
}

export type LocalUser = { _id: string; username: string; jid: string; config: IRequestConfig };

/** A fresh Rocket.Chat user, logged in and deleted on cleanup; its email stays unverified so email 2FA cannot block the login. */
export async function createLocalUser(
	rc: RocketChat,
	label: string,
	username = `xe2e-${label}-${uniqueSuffix()}`,
	email?: string,
): Promise<LocalUser> {
	const user = await createUser({ username, ...(email && { email }), joinDefaultChannels: false }, rc.admin);
	rc.cleanup.add(() => deleteUser(user, { confirmRelinquish: true }, rc.admin));
	return { _id: user._id, username, jid: `${username}@${rc.domain}`, config: await getRequestConfig(apiUrl, username, password) };
}

/** Keeps a DDP session open for the user: without one their connection status stays offline, masking any status they pick. */
export async function connectSession(rc: RocketChat, user: LocalUser): Promise<void> {
	const session = new DDPListener(config.ddpUrl, user.config);
	rc.cleanup.add(() => session.disconnect());
	await session.connect();
}

export const findUser = (rc: RocketChat, username: string) => findUserByUsername(username, rc.admin);

/** Deletes, on cleanup, the local record Rocket.Chat materializes for a remote JID. */
export function forgetRemoteUserOnCleanup(rc: RocketChat, username: string): void {
	rc.cleanup.add(async () => {
		const user = await findUser(rc, username);
		if (user) {
			await deleteUser(user, { confirmRelinquish: true }, rc.admin);
		}
	});
}

export const anonymousOccupantUsername = (nick: string, roomJid: string): string => `${nick}#${roomJid}`;

export type RoomRef = Pick<IRoom, '_id' | 't'>;

export function deleteRoomOnCleanup(rc: RocketChat, roomId: string): void {
	rc.roomsToDelete.add(roomId);
}

/** Creates a room hosted by Rocket.Chat as an XMPP MUC; the creator's session owns it. */
export async function createHostedRoom(
	rc: RocketChat,
	owner: LocalUser,
	{ type, name, members = [] }: { type: 'c' | 'p'; name: string; members?: string[] },
): Promise<IRoom> {
	const res = await createRoom({ type, name, members, extraData: { xmppFederated: true }, config: owner.config });
	const { channel, group } = expectSuccess<{ channel?: IRoom; group?: IRoom }>(`create room ${name}`, res);
	const roomId = (channel ?? group)?._id as string;
	deleteRoomOnCleanup(rc, roomId);
	return getRoom(owner, roomId);
}

/** A private group that is not XMPP federated, deleted with the suite. */
export async function createPlainGroup(rc: RocketChat, user: LocalUser): Promise<RoomRef> {
	const res = await createRoom({ type: 'p', name: `xe2e-plain-${uniqueSuffix()}`, config: user.config });
	const { _id } = (res.body as { group: IRoom }).group;
	deleteRoomOnCleanup(rc, _id);
	return { _id, t: 'p' };
}

export async function getRoom(user: Pick<LocalUser, 'config'>, roomId: string): Promise<IRoom> {
	const { room } = await getRoomInfo(roomId, user.config);
	assert.ok(room, `room ${roomId} not found`);
	return room;
}

export async function findRoomByName(user: IRequestConfig, roomName: string): Promise<IRoom | undefined> {
	return get<{ room: IRoom }>(user, 'rooms.info', { roomName }).then(
		({ room }) => room,
		() => undefined,
	);
}

const endpointPrefix: Record<string, string> = { c: 'channels', p: 'groups', d: 'im' };

export async function listMessages(user: LocalUser, room: RoomRef): Promise<IMessage[]> {
	const { messages } = await get<{ messages: IMessage[] }>(user.config, `${endpointPrefix[room.t]}.messages`, {
		roomId: room._id,
		count: 200,
	});
	return messages.filter((message) => !message.t);
}

export async function messagesWithText(user: LocalUser, room: RoomRef, text: string): Promise<IMessage[]> {
	return (await listMessages(user, room)).filter((message) => message.msg === text);
}

export async function waitForMessage(user: LocalUser, room: RoomRef, text: string): Promise<IMessage> {
	let found: IMessage | undefined;
	await retry(
		`message "${text}" in room ${room._id}`,
		async () => {
			[found] = await messagesWithText(user, room, text);
			assert.ok(found, `message "${text}" not in room ${room._id} yet`);
		},
		federationPolling,
	);
	return found as IMessage;
}

/** Asserts a message was stored exactly once, late duplicates included. */
export async function expectStoredOnce(user: LocalUser, room: RoomRef, text: string, settleMs = DUPLICATE_SETTLE_MS): Promise<IMessage> {
	await waitForMessage(user, room, text);
	await sleep(settleMs);
	const copies = await messagesWithText(user, room, text);
	assert.equal(copies.length, 1, `expected "${text}" once, got ${copies.length}: ${JSON.stringify(copies.map((m) => m.u.username))}`);
	return copies[0];
}

/** Sends as a Rocket.Chat user does, so every message hook runs. */
export async function sendMessage(user: LocalUser, roomId: string, msg: string): Promise<IMessage> {
	const res = await sendMessageViaRest({ rid: roomId, msg, config: user.config });
	return res.body.message;
}

export async function updateMessage(user: LocalUser, roomId: string, msgId: string, text: string): Promise<void> {
	await post(user.config, 'chat.update', { roomId, msgId, text });
}

export async function inviteToRoom(user: LocalUser, room: RoomRef, username: string): Promise<void> {
	await post(user.config, `${endpointPrefix[room.t]}.invite`, { roomId: room._id, username });
}

export async function kickFromRoom(user: LocalUser, room: RoomRef, userId: string): Promise<void> {
	await post(user.config, `${endpointPrefix[room.t]}.kick`, { roomId: room._id, userId });
}

export async function banFromRoom(user: LocalUser, room: RoomRef, userId: string): Promise<void> {
	await post(user.config, 'rooms.banUser', { roomId: room._id, userId });
}

export async function leaveRoom(user: LocalUser, room: RoomRef): Promise<void> {
	await post(user.config, `${endpointPrefix[room.t]}.leave`, { roomId: room._id });
}

export async function setRoomType(user: LocalUser, room: RoomRef, type: 'c' | 'p'): Promise<RoomRef> {
	await post(user.config, `${endpointPrefix[room.t]}.setType`, { roomId: room._id, type });
	return { _id: room._id, t: type };
}

export async function setRoomTopic(user: LocalUser, room: RoomRef, topic: string): Promise<void> {
	await post(user.config, `${endpointPrefix[room.t]}.setTopic`, { roomId: room._id, topic });
}

export async function deleteRoom(rc: RocketChat, room: RoomRef): Promise<void> {
	await post(rc.admin, 'rooms.delete', { roomId: room._id });
}

export async function listMemberUsernames(user: LocalUser, room: RoomRef): Promise<string[]> {
	const { members } = await getRoomMembers(room._id, user.config);
	return members.map((member) => member.username as string);
}

/** Opens (or reuses) the DM between a local user and a remote JID. */
export async function createDirectMessage(rc: RocketChat, user: LocalUser, jid: string): Promise<IRoom> {
	const { room } = await post<{ room: { _id: string } }>(user.config, 'im.create', { username: jid });
	deleteRoomOnCleanup(rc, room._id);
	return getRoom(user, room._id);
}

/** The DM a remote JID opened with a local user, once Rocket.Chat created it. */
export async function findDirectMessageWith(user: LocalUser, jid: string): Promise<IRoom | undefined> {
	const { ims } = await get<{ ims: IRoom[] }>(user.config, 'im.list', { count: 200 });
	const dm = ims.find((room) => room.usernames?.includes(jid));
	return dm && getRoom(user, dm._id);
}

/** Resolves with the DM once the first inbound message from a remote JID has created it. */
export async function waitForDirectMessageWith(rc: RocketChat, user: LocalUser, jid: string): Promise<IRoom> {
	let dm: IRoom | undefined;
	await retry(
		`the DM between ${user.username} and ${jid}`,
		async () => {
			dm = await findDirectMessageWith(user, jid);
			assert.ok(dm, `no DM between ${user.username} and ${jid} yet`);
		},
		federationPolling,
	);
	deleteRoomOnCleanup(rc, (dm as IRoom)._id);
	return dm as IRoom;
}

export async function setStatus(user: LocalUser, status: 'online' | 'away' | 'busy' | 'offline'): Promise<void> {
	await post(user.config, 'users.setStatus', { status });
}
