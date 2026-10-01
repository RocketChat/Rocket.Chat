import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';

import type { IMessage, IRoom } from '@rocket.chat/core-typings';

import type { Cleanup } from './cleanup';
import { config, polling, uniqueSuffix } from './config';
import { api, apiUrl } from '../../../../../../apps/meteor/tests/data/api-data';
import { sendMessage as sendMessageViaMethod } from '../../../../../../apps/meteor/tests/data/messages.helper';
import { createRoom, getRoomInfo, getRoomMembers } from '../../../../../../apps/meteor/tests/data/rooms.helper';
import { adminPassword, adminUsername, password } from '../../../../../../apps/meteor/tests/data/user';
import { createUser, deleteUser, getRequestConfig, getUserByUsername } from '../../../../../../apps/meteor/tests/data/users.helper';
import type { IRequestConfig } from '../../../../../../apps/meteor/tests/data/users.helper';
import { retry } from '../../../../../../apps/meteor/tests/end-to-end/api/helpers/retry';
import { DDPListener } from '../../../../federation-matrix/tests/helper/ddp-listener';

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
	/** Rooms deleted on teardown, before the users; relinquishing users may already have removed some. */
	rooms: Set<string>;
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

/** Logs in as the repo's test admin and fails fast, with the fix, when Rocket.Chat does not federate with the XMPP server under test. */
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

	const allowed = allowList
		.split(',')
		.map((entry) => entry.trim().toLowerCase())
		.filter(Boolean);
	assert.ok(
		!allowed.length || allowed.includes(config.xmpp.domain.toLowerCase()),
		`XMPP_Server_Domain_Allow_List (${allowList}) does not include ${config.xmpp.domain}`,
	);

	return { admin, domain, mucDomain: `${mucSubdomain || 'conference'}.${domain}`, cleanup, rooms: new Set() };
}

/** Deletes the suite's rooms, then runs every other cleanup task. */
export async function teardown(rc: RocketChat | undefined): Promise<void> {
	if (!rc) {
		return;
	}
	for (const roomId of rc.rooms) {
		await post(rc.admin, 'rooms.delete', { roomId }).catch(() => undefined);
	}
	await rc.cleanup.run();
}

export type LocalUser = { _id: string; username: string; jid: string; config: IRequestConfig };

/**
 * A fresh Rocket.Chat user, logged in and deleted on cleanup. Its email stays unverified, as
 * `createUser` leaves it: email 2FA only applies to verified addresses and would block the login.
 */
export async function createLocalUser(rc: RocketChat, label: string): Promise<LocalUser> {
	const username = `xe2e-${label}-${uniqueSuffix()}`;
	const user = await createUser({ username, joinDefaultChannels: false }, rc.admin);
	rc.cleanup.add(() => deleteUser(user, { confirmRelinquish: true }, rc.admin));
	return { _id: user._id, username, jid: `${username}@${rc.domain}`, config: await getRequestConfig(apiUrl, username, password) };
}

/** Keeps a DDP session open for the user: without one their connection status stays offline, masking any status they pick. */
export async function connectSession(rc: RocketChat, user: LocalUser): Promise<void> {
	const session = new DDPListener(config.ddpUrl, user.config);
	rc.cleanup.add(() => session.disconnect());
	await session.connect();
}

export const findUser = (rc: RocketChat, username: string) => getUserByUsername(username, rc.admin);

/** Deletes, on cleanup, the local record Rocket.Chat materializes for a remote JID. */
export function forgetRemoteUserOnCleanup(rc: RocketChat, username: string): void {
	rc.cleanup.add(async () => {
		const user = await findUser(rc, username);
		if (user) {
			await deleteUser(user, { confirmRelinquish: true }, rc.admin);
		}
	});
}

export type RoomRef = Pick<IRoom, '_id' | 't'>;

export function deleteRoomOnCleanup(rc: RocketChat, roomId: string): void {
	rc.rooms.add(roomId);
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

/** Resolves once a message with this text shows up in the room. */
export async function waitForMessage(user: LocalUser, room: RoomRef, text: string): Promise<IMessage> {
	let found: IMessage | undefined;
	await retry(
		`message "${text}" in room ${room._id}`,
		async () => {
			[found] = await messagesWithText(user, room, text);
			assert.ok(found, `message "${text}" not in room ${room._id} yet`);
		},
		polling,
	);
	return found as IMessage;
}

/**
 * Asserts a message was stored exactly once. Polling alone would pass on the first copy, so
 * after it shows up this waits for late duplicates before counting.
 */
export async function expectStoredOnce(user: LocalUser, room: RoomRef, text: string, settleMs = 3000): Promise<IMessage> {
	await waitForMessage(user, room, text);
	await sleep(settleMs);
	const copies = await messagesWithText(user, room, text);
	assert.equal(copies.length, 1, `expected "${text}" once, got ${copies.length}: ${JSON.stringify(copies.map((m) => m.u.username))}`);
	return copies[0];
}

/** Sends through the same method the web client uses, so every message hook runs. */
export async function sendMessage(user: LocalUser, roomId: string, msg: string): Promise<IMessage> {
	const res = await sendMessageViaMethod({ rid: roomId, msg, config: user.config });
	const { result, error } = JSON.parse(expectSuccess<{ message: string }>('sendMessage', res).message) as {
		result?: IMessage;
		error?: unknown;
	};
	assert.ok(result, `sendMessage failed: ${JSON.stringify(error)}`);
	return result;
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
		polling,
	);
	deleteRoomOnCleanup(rc, (dm as IRoom)._id);
	return dm as IRoom;
}

export async function setStatus(user: LocalUser, status: 'online' | 'away' | 'busy' | 'offline'): Promise<void> {
	await post(user.config, 'users.setStatus', { status });
}
