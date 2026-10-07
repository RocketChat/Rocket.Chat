import { VideoConf } from '@rocket.chat/core-services';
import { isRoomNativeFederated, isUserNativeFederated, VideoConferenceStatus } from '@rocket.chat/core-typings';
import type { IMatrixRTCMembership, IRoomNativeFederated, IUser } from '@rocket.chat/core-typings';
import { federationSDK } from '@rocket.chat/federation-sdk';
import type { HomeserverEventSignatures, RoomID } from '@rocket.chat/federation-sdk';
import { Logger } from '@rocket.chat/logger';
import { MatrixRTCMemberships, Rooms, Users, VideoConference } from '@rocket.chat/models';

import { isMatrixRTCEnabled } from './config';
import { MATRIXRTC_ROOM_CALL_SLOT_ID } from './derive';
import {
	CALL_MEMBER_EVENT_TYPE,
	RTC_DECLINE_EVENT_TYPES,
	RTC_MEMBER_EVENT_TYPES,
	RTC_NOTIFICATION_EVENT_TYPES,
	isNotificationLive,
	parseCompatMembership,
	parseRtcDecline,
	parseRtcMembership,
	parseRtcNotification,
} from './events';
import type { AnnouncedMembership, RtcNotification } from './events';
import { remoteLiveKitIdentitiesFor } from './identities';
import { createKeyedQueue } from './keyedQueue';
import { extractDomainFromMatrixUserId } from '../helpers/extractDomainFromMatrixUserId';
import { getOrCreateFederatedUser } from '../helpers/getOrCreateFederatedUser';
import { getUsernameServername } from '../helpers/getUsernameServername';

const logger = new Logger('MatrixRTCInbound');

type MatrixEvent = HomeserverEventSignatures['homeserver.matrix.event'];

type ActiveStickyEvent = Awaited<ReturnType<typeof federationSDK.getActiveStickyEvents>>[number];

export type RemoteMembership = Omit<IMatrixRTCMembership, '_id' | '_updatedAt' | 'callId' | 'local'>;

/** The services a rebuild reports to may still be starting when calls first become possible. */
const STARTUP_REBUILD_DELAY_MS = 10_000;

const RTC_MEMBER_TYPES = new Set<string>(RTC_MEMBER_EVENT_TYPES);

const RTC_NOTIFICATION_TYPES = new Set<string>(RTC_NOTIFICATION_EVENT_TYPES);

const RTC_DECLINE_TYPES = new Set<string>(RTC_DECLINE_EVENT_TYPES);

const perRoom = createKeyedQueue();

const queuedRebuilds = new Set<string>();

const isOwnUser = (userId: string): boolean => extractDomainFromMatrixUserId(userId) === federationSDK.getConfig('serverName');

const isMembershipEvent = (type: string): boolean => type === CALL_MEMBER_EVENT_TYPE || RTC_MEMBER_TYPES.has(type);

const stickyKeyOf = ({ content }: ActiveStickyEvent['event']): unknown => content.msc4354_sticky_key ?? content.sticky_key;

/**
 * The entry js-sdk keeps for each `(type, sender, sticky key)`: the one sticky for longest, then the highest event
 * id. A leave is an entry too, which is how it supersedes the join it ends.
 */
const currentStickyEntries = (events: ActiveStickyEvent[]): ActiveStickyEvent[] => {
	const entries = new Map<string, ActiveStickyEvent>();

	for (const entry of events) {
		const stickyKey = stickyKeyOf(entry.event);
		if (typeof stickyKey !== 'string') {
			continue;
		}

		const key = JSON.stringify([entry.event.type, entry.event.sender, stickyKey]);
		const current = entries.get(key);
		if (!current || entry.expiresAt > current.expiresAt || (entry.expiresAt === current.expiresAt && entry.event_id > current.event_id)) {
			entries.set(key, entry);
		}
	}

	return [...entries.values()];
};

type Announcement = { membership: AnnouncedMembership; eventId: string; stateKey?: string };

/** Every member of another server the room announces in its call right now, in either form. */
async function readAnnouncements(mrid: RoomID, now: number): Promise<Announcement[]> {
	const state = await federationSDK.getLatestRoomState(mrid);

	const isJoined = (userId: string): boolean =>
		(state.get(`m.room.member:${userId}`)?.event.content as { membership?: unknown } | undefined)?.membership === 'join';

	const counts = ({ userId, slotId, expiresAt }: AnnouncedMembership): boolean =>
		!isOwnUser(userId) && isJoined(userId) && slotId === MATRIXRTC_ROOM_CALL_SLOT_ID && expiresAt > now;

	const announcements: Announcement[] = [];

	for (const pdu of state.values()) {
		if ((pdu.type as string) !== CALL_MEMBER_EVENT_TYPE || pdu.stateKey === undefined) {
			continue;
		}

		const membership = parseCompatMembership(pdu.event);
		if (membership && counts(membership)) {
			announcements.push({ membership, eventId: pdu.eventId, stateKey: pdu.stateKey });
		}
	}

	const stickyEvents = (
		await Promise.all(RTC_MEMBER_EVENT_TYPES.map((type) => federationSDK.getActiveStickyEvents(mrid, { type, now })))
	).flat();

	for (const { event, event_id: eventId, expiresAt } of currentStickyEntries(stickyEvents)) {
		const change = parseRtcMembership(event, { now, expiresAt });
		if (change?.kind === 'join' && counts(change)) {
			const { kind: _, ...membership } = change;
			announcements.push({ membership, eventId });
		}
	}

	return announcements;
}

async function toRemoteMembership(room: IRoomNativeFederated, { membership, eventId, stateKey }: Announcement): Promise<RemoteMembership> {
	const { form, userId, deviceId, memberId, slotId, transport, callIntent, joinedAt, expiresAt } = membership;
	const user = await getOrCreateFederatedUser(userId);

	return {
		rid: room._id,
		mrid: room.federation.mrid,
		slotId,
		mode: form,
		userId,
		uid: user._id,
		deviceId,
		memberId,
		...(stateKey !== undefined && { stateKey }),
		eventId,
		transport,
		serverName: extractDomainFromMatrixUserId(userId),
		...remoteLiveKitIdentitiesFor(membership),
		...(callIntent && { callIntent }),
		joinedAt: new Date(joinedAt),
		expiresAt: new Date(expiresAt),
	};
}

const keyOf = ({ mode, userId, stateKey, memberId }: Pick<IMatrixRTCMembership, 'mode' | 'userId' | 'stateKey' | 'memberId'>): string =>
	JSON.stringify(mode === 'compatibility' ? [userId, 'state', stateKey] : [userId, 'sticky', memberId]);

/**
 * Brings this server's record of the members other servers announce in a room's call in line with the room itself,
 * then the conference mirroring that call. Reading the room rather than the event in hand makes the order events
 * arrive in irrelevant.
 */
export async function rebuildRTCSession(room: IRoomNativeFederated): Promise<void> {
	const { mrid } = room.federation;

	const announcements = await readAnnouncements(mrid as RoomID, Date.now());
	const memberships = await Promise.all(announcements.map((announcement) => toRemoteMembership(room, announcement)));

	const announced = new Set(memberships.map(keyOf));
	const gone = (await MatrixRTCMemberships.findRemoteByRoom(mrid).toArray()).filter((membership) => !announced.has(keyOf(membership)));

	await Promise.all(memberships.map((membership) => MatrixRTCMemberships.upsertRemote(membership)));
	if (gone.length) {
		await MatrixRTCMemberships.removeByIds(gone.map(({ _id }) => _id));
	}

	await VideoConf.syncFederatedSession(room._id, { mrid, slotId: MATRIXRTC_ROOM_CALL_SLOT_ID });
}

/** A rebuild still waiting to start covers whatever arrives before it does. */
const queueRebuild = (room: IRoomNativeFederated): Promise<void> => {
	const { mrid } = room.federation;
	if (queuedRebuilds.has(mrid)) {
		return Promise.resolve();
	}

	queuedRebuilds.add(mrid);

	return perRoom(mrid, async () => {
		queuedRebuilds.delete(mrid);
		await rebuildRTCSession(room);
	});
};

/** Someone leaving the room leaves its call with it: js-sdk only counts members joined to the room. */
const isDepartureFromCall = async ({ type, room_id: mrid, state_key: userId, content }: MatrixEvent['event']): Promise<boolean> =>
	type === 'm.room.member' &&
	content.membership !== 'join' &&
	typeof userId === 'string' &&
	!!(await MatrixRTCMemberships.findOne({ mrid, userId, local: false }, { projection: { _id: 1 } }));

/** This server's users a ring is for: those it mentions, and everyone here in a direct message rung as a whole. */
async function localCalleesOf(
	room: IRoomNativeFederated,
	{ userIds, roomMention }: RtcNotification,
): Promise<{ uid: IUser['_id']; userId: string }[]> {
	const serverName = federationSDK.getConfig('serverName');

	const usernames = userIds.flatMap((userId) => {
		try {
			const [username, , isLocal] = getUsernameServername(userId, serverName);
			return isLocal ? [username] : [];
		} catch {
			return [];
		}
	});

	const callees = await Users.find(
		{ $or: [{ username: { $in: usernames } }, ...(roomMention && room.t === 'd' ? [{ _id: { $in: room.uids ?? [] } }] : [])] },
		{ projection: { username: 1, federated: 1, federation: 1 } },
	).toArray();

	return callees
		.filter((user) => !isUserNativeFederated(user) && user.username)
		.map(({ _id, username }) => ({ uid: _id, userId: `@${username}:${serverName}` }));
}

/** A ring from another server's member rings this server's users it is for, in the conference of its caller. */
async function ringLocalUsers(room: IRoomNativeFederated, { event, event_id: eventId }: MatrixEvent): Promise<void> {
	const ring = parseRtcNotification(event);
	if (!ring || ring.kind !== 'ring' || ring.slotId !== MATRIXRTC_ROOM_CALL_SLOT_ID || !isNotificationLive(ring, Date.now())) {
		return;
	}

	const callees = await localCalleesOf(room, ring);
	if (!callees.length) {
		return;
	}

	const { mrid } = room.federation;
	const caller =
		(await MatrixRTCMemberships.findOne({ mrid, eventId: ring.membershipEventId, userId: event.sender, local: false })) ??
		(await MatrixRTCMemberships.findOne({ mrid, userId: event.sender, local: false }, { sort: { joinedAt: -1 } }));
	if (!caller) {
		return;
	}

	const callId = caller.callId ?? (await VideoConf.syncFederatedSession(room._id, { mrid, slotId: MATRIXRTC_ROOM_CALL_SLOT_ID }));
	if (!callId) {
		return;
	}

	await MatrixRTCMemberships.setNotificationById(caller._id, { eventId, userIds: callees.map(({ userId }) => userId) });
	await VideoConf.ringFromFederation(
		callId,
		caller.uid,
		callees.map(({ uid }) => uid),
	);
}

/** Only a decline of a ring this server sent, by someone it rang, counts. */
async function recordDecline({ event }: MatrixEvent): Promise<void> {
	const decline = parseRtcDecline(event);
	if (!decline) {
		return;
	}

	const ringer = await MatrixRTCMemberships.findOneByNotificationEventId(decline.notificationEventId);
	if (!ringer?.local || !ringer.callId || !ringer.notification?.userIds.includes(event.sender)) {
		return;
	}

	const decliner = await getOrCreateFederatedUser(event.sender);
	await VideoConf.declineCall(decliner._id, ringer.callId);
}

type RTCEventKind = 'session' | 'ring' | 'decline';

const kindOf = async (event: MatrixEvent['event']): Promise<RTCEventKind | undefined> => {
	if (!isOwnUser(event.sender)) {
		if (isMembershipEvent(event.type)) {
			return 'session';
		}
		if (RTC_NOTIFICATION_TYPES.has(event.type)) {
			return 'ring';
		}
		if (RTC_DECLINE_TYPES.has(event.type)) {
			return 'decline';
		}
	}

	return (await isDepartureFromCall(event)) ? 'session' : undefined;
};

/**
 * What another server says about a room's call, in any form; everything else is ignored. Each room's events are
 * handled in the order they arrive, so a ring finds the membership announced before it.
 */
export async function handleMatrixRTCEvent(payload: MatrixEvent): Promise<void> {
	if (!isMatrixRTCEnabled()) {
		return;
	}

	const kind = await kindOf(payload.event);
	if (!kind) {
		return;
	}

	const room = await Rooms.findOneFederatedByMrid(payload.event.room_id);
	if (!room || !isRoomNativeFederated(room)) {
		return;
	}

	switch (kind) {
		case 'session':
			return queueRebuild(room);
		case 'ring':
			return perRoom(room.federation.mrid, () => ringLocalUsers(room, payload));
		case 'decline':
			return perRoom(room.federation.mrid, () => recordDecline(payload));
	}
}

/** The rooms whose calls this server knows of: remote members on record, or a conference still running. */
const roomsWithCalls = async (): Promise<string[]> => {
	const conferences = await VideoConference.find(
		{
			'status': { $in: [VideoConferenceStatus.CALLING, VideoConferenceStatus.STARTED] },
			'endedAt': { $exists: false },
			'federation.mrid': { $exists: true },
		},
		{ projection: { federation: 1 } },
	).toArray();

	return [
		...new Set([
			...(await MatrixRTCMemberships.findRemoteRoomIds()),
			...conferences.map(({ federation }) => federation?.mrid).filter((mrid): mrid is string => !!mrid),
		]),
	];
};

/** Catches up on what happened in rooms with calls while this server was not listening. */
export async function rebuildRTCSessions(): Promise<void> {
	for (const mrid of await roomsWithCalls()) {
		try {
			const room = await Rooms.findOneFederatedByMrid(mrid);
			if (room && isRoomNativeFederated(room)) {
				await queueRebuild(room);
			}
		} catch (err) {
			logger.error({ msg: 'Failed to rebuild the MatrixRTC session of a room', mrid, err });
		}
	}
}

let rebuildScheduled = false;

/** Once per process, the first time calls in federated rooms are possible. */
export const scheduleRTCSessionsRebuild = (): void => {
	if (rebuildScheduled) {
		return;
	}

	rebuildScheduled = true;
	setTimeout(() => {
		void rebuildRTCSessions().catch((err) => logger.error({ msg: 'Failed to rebuild MatrixRTC sessions', err }));
	}, STARTUP_REBUILD_DELAY_MS);
};
