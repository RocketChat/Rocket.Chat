import type { IMessage, IRoom, IScheduledMessage, IUser } from '@rocket.chat/core-typings';
import { Messages, ScheduledMessages } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import { Meteor } from 'meteor/meteor';

import { MAX_SCHEDULING_HORIZON_MS, MIN_SCHEDULING_LEAD_MS } from '../../../../lib/messages/scheduling';
import { settings } from '../../../settings';
import { canSendMessageAsync } from '../../authorization/canSendMessage';

/**
 * How many times a single request will look for a free quota slot. Losing a slot means another request
 * from the *same user* inserted concurrently, so the contention is tiny and bounded in practice.
 */
const MAX_SLOT_ATTEMPTS = 5;

/**
 * Lowest slot below `limit` that the user is not already holding. `undefined` means the quota is full.
 * With no configured limit the search stops at the first gap, so slots stay dense.
 */
const findFreeSlot = (occupied: number[], limit: number): number | undefined => {
	const taken = new Set(occupied);

	for (let slot = 0; slot < limit; slot++) {
		if (!taken.has(slot)) {
			return slot;
		}
	}

	return undefined;
};

const assertSchedulingEnabled = (): void => {
	if (!settings.get<boolean>('Message_AllowScheduling')) {
		throw new Meteor.Error('error-message-scheduling-disabled', 'Message scheduling is disabled');
	}
};

const assertValidScheduleDate = (scheduledAt: Date): void => {
	if (Number.isNaN(scheduledAt.getTime())) {
		throw new Meteor.Error('error-invalid-date', 'The provided date is invalid');
	}

	const now = Date.now();

	if (scheduledAt.getTime() < now + MIN_SCHEDULING_LEAD_MS) {
		throw new Meteor.Error('error-message-scheduled-too-soon', 'Messages must be scheduled at least one minute in the future');
	}

	if (scheduledAt.getTime() > now + MAX_SCHEDULING_HORIZON_MS) {
		throw new Meteor.Error('error-message-scheduled-too-far', 'Messages cannot be scheduled more than a year in advance');
	}
};

const assertValidMessage = (msg: string): void => {
	if (!msg.trim()) {
		throw new Meteor.Error('error-message-empty', 'Cannot schedule an empty message');
	}

	const maxAllowedSize = settings.get<number>('Message_MaxAllowedSize') ?? 0;
	if (maxAllowedSize && msg.length > maxAllowedSize) {
		throw new Meteor.Error('error-message-size-exceeded', 'Message size exceeds Message_MaxAllowedSize');
	}
};

/**
 * A scheduled message is stored as plaintext and posted later by a background job, which cannot hold
 * the room key. Mirrors the check `executeSendMessage` applies to un-encrypted messages, so scheduling
 * is refused exactly where sending the message unencrypted would be.
 */
const assertRoomAcceptsPlaintext = (room: IRoom): void => {
	if (room.encrypted && settings.get<boolean>('E2E_Enable') && !settings.get<boolean>('E2E_Allow_Unencrypted_Messages')) {
		throw new Meteor.Error('error-message-scheduling-not-allowed-in-encrypted-room', 'Messages cannot be scheduled in encrypted rooms');
	}
};

/**
 * Resolves the room a scheduled message will land in and verifies the user may post there *now*.
 * Permissions are re-checked at delivery time as well, since they may change while the message waits.
 */
const resolveTargetRoom = async (user: IUser, rid: IRoom['_id'], tmid?: IMessage['_id']): Promise<IRoom> => {
	let targetRid = rid;

	if (tmid) {
		if (!settings.get<boolean>('Threads_enabled')) {
			throw new Meteor.Error('error-not-allowed', 'not-allowed');
		}

		const parentMessage = await Messages.findOneById(tmid, { projection: { rid: 1, tmid: 1 } });
		if (!parentMessage) {
			throw new Meteor.Error('error-invalid-message', 'Invalid thread message');
		}

		targetRid = parentMessage.rid;
	}

	const room = await canSendMessageAsync(targetRid, user);

	assertRoomAcceptsPlaintext(room);

	return room;
};

export async function scheduleMessage(
	user: IUser,
	{ rid, msg, scheduledAt, tmid, tshow }: { rid: IRoom['_id']; msg: string; scheduledAt: Date; tmid?: IMessage['_id']; tshow?: boolean },
): Promise<IScheduledMessage> {
	assertSchedulingEnabled();
	assertValidMessage(msg);
	assertValidScheduleDate(scheduledAt);

	if (tshow && !tmid) {
		throw new Meteor.Error('invalid-params', 'tshow provided but missing tmid');
	}

	const room = await resolveTargetRoom(user, rid, tmid);

	const maxPerUser = settings.get<number>('Message_MaxScheduledMessagesPerUser') ?? 0;
	const limit = maxPerUser > 0 ? maxPerUser : Infinity;

	const now = new Date();
	const scheduledMessage: Omit<IScheduledMessage, 'slot'> = {
		_id: Random.id(),
		_updatedAt: now,
		uid: user._id,
		rid: room._id,
		msg,
		scheduledAt,
		createdAt: now,
		updatedAt: now,
		status: 'scheduled',
		...(tmid && { tmid }),
		...(tshow && { tshow }),
	};

	for (let attempt = 0; attempt < MAX_SLOT_ATTEMPTS; attempt++) {
		const slot = findFreeSlot(await ScheduledMessages.findOccupiedSlotsByUserId(user._id), limit);

		if (slot === undefined) {
			throw new Meteor.Error('error-max-scheduled-messages-reached', 'Maximum number of scheduled messages reached', {
				limit: maxPerUser,
			});
		}

		const record: IScheduledMessage = { ...scheduledMessage, slot };

		if (await ScheduledMessages.insertPending(record)) {
			return record;
		}
	}

	throw new Meteor.Error('error-scheduled-message-conflict', 'Could not schedule the message, please try again');
}

export async function listScheduledMessages(
	uid: IUser['_id'],
	{ rid, count, offset }: { rid?: IRoom['_id']; count?: number; offset?: number } = {},
): Promise<{ messages: IScheduledMessage[]; total: number }> {
	const [messages, total] = await Promise.all([
		ScheduledMessages.findPendingByUserId(uid, { rid, skip: offset, limit: count }).toArray(),
		ScheduledMessages.countPendingByUserId(uid, rid),
	]);

	return { messages, total };
}

export async function updateScheduledMessage(
	user: IUser,
	id: IScheduledMessage['_id'],
	{ msg, scheduledAt }: { msg?: string; scheduledAt?: Date },
): Promise<IScheduledMessage> {
	assertSchedulingEnabled();

	if (msg === undefined && scheduledAt === undefined) {
		throw new Meteor.Error('error-invalid-params', 'Nothing to update');
	}

	if (msg !== undefined) {
		assertValidMessage(msg);
	}

	if (scheduledAt !== undefined) {
		assertValidScheduleDate(scheduledAt);
	}

	const scheduledMessage = await ScheduledMessages.findOneByIdAndUserId(id, user._id);
	if (!scheduledMessage) {
		throw new Meteor.Error('error-scheduled-message-not-found', 'Scheduled message not found');
	}

	if (scheduledMessage.status !== 'scheduled') {
		throw new Meteor.Error('error-scheduled-message-already-processed', 'This message is no longer pending');
	}

	// the room may have been archived/read-only since scheduling
	await resolveTargetRoom(user, scheduledMessage.rid, scheduledMessage.tmid);

	const updated = await ScheduledMessages.updatePendingById(id, user._id, { msg, scheduledAt });
	if (!updated) {
		throw new Meteor.Error('error-scheduled-message-already-processed', 'This message is no longer pending');
	}

	return updated;
}

export async function cancelScheduledMessage(uid: IUser['_id'], id: IScheduledMessage['_id']): Promise<void> {
	const { deletedCount } = await ScheduledMessages.deletePendingByIdAndUserId(id, uid);

	if (!deletedCount) {
		throw new Meteor.Error('error-scheduled-message-not-found', 'Scheduled message not found');
	}
}
