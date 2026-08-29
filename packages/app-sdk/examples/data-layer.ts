/**
 * Worked example for the host data & query layer (PROPOSAL-DATA-LAYER.md).
 *
 * Every `@ts-expect-error` below is an assertion: the file only compiles if the
 * selection inference is *exact*. If a request stopped narrowing the result —
 * if `get` ever went back to returning the whole entity — those lines would
 * stop erroring and this example would fail to type-check.
 */

import { data } from '@rocket.chat/app-sdk';

declare const clients: data.DataClients;
declare function sink(...values: unknown[]): void;

/* ------------------------------------------------------------------ *
 * 1. No selection → the record's own fields, and nothing else.
 * ------------------------------------------------------------------ */

export async function plainRead(roomId: string): Promise<void> {
	const room = await clients.rooms.get(roomId);
	if (!room) {
		return;
	}
	sink(room.id, room.type, room.topic, room.updatedAt);

	// @ts-expect-error a relation you did not ask for is not there
	sink(room.creator);
}

/* ------------------------------------------------------------------ *
 * 2. `select` narrows the fields; `with` pulls relations in one round trip.
 * ------------------------------------------------------------------ */

export async function narrowedRead(roomId: string): Promise<void> {
	const room = await clients.rooms.get(roomId, {
		select: ['id', 'name'],
		with: { creator: { select: ['id', 'username'] } },
	});
	if (!room) {
		return;
	}
	sink(room.id, room.name, room.creator?.username);

	// @ts-expect-error `topic` was not selected
	sink(room.topic);
	// @ts-expect-error `email` was not selected on the creator
	sink(room.creator?.email);
}

/** `with: { x: true }` is the whole related record — the old "hydrated" shape. */
export async function fullRelation(roomId: string): Promise<void> {
	const room = await clients.rooms.get(roomId, { with: { creator: true } });
	if (!room) {
		return;
	}
	sink(room.topic, room.creator?.email, room.creator?.roles);
}

/** A `many` relation is an array, selected the same way. */
export async function members(roomId: string): Promise<void> {
	const room = await clients.rooms.get(roomId, { with: { members: { select: ['username'] } } });
	if (!room) {
		return;
	}
	for (const member of room.members) {
		sink(member.username);
		// @ts-expect-error `roles` was not selected on the members
		sink(member.roles);
	}
}

/** Depth 2 is the budget (§11.1); it still infers all the way down. */
export async function nested(roomId: string): Promise<void> {
	const room = await clients.rooms.get(roomId, {
		select: ['id'],
		with: { parent: { select: ['id', 'name'], with: { creator: { select: ['username'] } } } },
	});
	if (!room) {
		return;
	}
	sink(room.id, room.parent?.name, room.parent?.creator?.username);
}

/* ------------------------------------------------------------------ *
 * 3. Lists are cursors with a closed filter.
 * ------------------------------------------------------------------ */

export async function recentMessages(roomId: string, since: Date): Promise<void> {
	for await (const message of clients.rooms.messages(roomId, {
		where: { since, threads: 'exclude' },
		with: { sender: { select: ['username'] } },
		select: ['id', 'text'],
		pageSize: 100,
	})) {
		sink(message.id, message.text, message.sender.username);
	}
}

export function rejectsUnknownFilters(roomId: string): void {
	sink(
		clients.rooms.messages(roomId, {
			// @ts-expect-error `tmid` is a storage field, not a declared filter
			where: { tmid: 'x' },
		}),
	);
}

/* ------------------------------------------------------------------ *
 * 4. Views: a thread and a discussion have no client of their own.
 * ------------------------------------------------------------------ */

export async function threadOfMessage(messageId: string): Promise<void> {
	const message = await clients.messages.get(messageId, { with: { thread: true } });
	if (!message?.thread) {
		return;
	}
	sink(message.thread.count, message.thread.lastReplyAt);

	for await (const reply of clients.messages.replies(message.thread.id, {
		with: { sender: { select: ['username'] } },
	})) {
		sink(reply.text, reply.sender.username);
	}
}

export async function discussionsOfRoom(roomId: string): Promise<void> {
	for await (const room of clients.rooms.list({ where: { isDiscussion: true, parentRoomId: roomId } })) {
		// the guard narrows `parentRoomId` from `string | undefined` to `string`
		if (data.isDiscussion(room)) {
			const parentId: string = room.parentRoomId;
			sink(parentId, data.isInTeam(room), data.isDirect(room));
		}
	}
}

/** A discussion *is* a room, so the room client reads it. */
export async function readDiscussionAsRoom(discussionId: string): Promise<void> {
	const room = await clients.rooms.get(discussionId, { with: { parent: { select: ['name'] } } });
	sink(room?.parent?.name);
}

/* ------------------------------------------------------------------ *
 * 5. Team owns a record, so it owns a client — and takes a tagged reference.
 * ------------------------------------------------------------------ */

export async function teamByEitherId(teamId: string, mainRoomId: string): Promise<void> {
	const byTeam = await clients.teams.get({ teamId }, { with: { mainRoom: { select: ['id', 'name'] } } });
	const byRoom = await clients.teams.get({ mainRoomId });
	sink(byTeam?.mainRoom.name, byRoom?.name);

	// @ts-expect-error a bare string hides which of the two ids you meant
	await clients.teams.get(teamId);

	for await (const room of clients.teams.rooms(teamId, { select: ['id', 'name'] })) {
		sink(room.name);
	}
}

/* ------------------------------------------------------------------ *
 * 6. Writes are named commands, not `save`.
 * ------------------------------------------------------------------ */

export async function writes(roomId: string, messageId: string, actor: string): Promise<void> {
	const discussionId = await clients.rooms.createDiscussion({
		parentRoom: roomId,
		parentMessage: messageId,
		name: 'follow-up',
		members: ['alice'],
		reply: 'moved here',
	});
	await clients.rooms.addMembers(discussionId, ['bob'], { asUser: actor });

	// optimistic concurrency: reject rather than lose a concurrent human edit
	const message = await clients.messages.get(messageId, { select: ['id', 'text', 'updatedAt'] });
	if (message) {
		await clients.messages.update(message.id, { text: '[redacted]' }, { ifUnchangedSince: message.updatedAt });
	}

	// @ts-expect-error a discussion is not a room *type*; it is a parent pointer
	await clients.rooms.create({ type: 'discussion', name: 'nope' });
}

/* ------------------------------------------------------------------ *
 * 7. The request is a value, so the host can price it before it runs.
 * ------------------------------------------------------------------ */

const principal: data.Principal = { app: 'reminders', actor: 'u1', as: 'app' };

export function envelope(): data.DataRequest {
	const request = data.toDataRequest('room', 'get', principal, {
		select: ['id', 'name'],
		with: { creator: { select: ['id', 'username'] } },
	});
	data.assertWithinBudget(request);
	return request; // serializes as-is onto rocketchat.apps.data.room.get
}

export function overBudget(): string {
	const request = data.toDataRequest('room', 'get', principal, {
		with: { parent: { with: { team: { with: { mainRoom: true } } } } },
	});
	try {
		data.assertWithinBudget(request);
		return 'accepted';
	} catch (error) {
		return error instanceof data.DataBudgetError ? error.message : 'unknown';
	}
}

/** The host declaration is the only place that knows a discussion is `prid`. */
export const roomDescriptor = data.roomEntity;
