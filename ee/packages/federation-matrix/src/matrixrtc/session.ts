import { randomInt } from 'node:crypto';

import { VideoConf } from '@rocket.chat/core-services';
import { getVideoConferenceMemberFederation, isUserNativeFederated } from '@rocket.chat/core-typings';
import type { IMatrixRTCMembership, IUser, IVideoConference, VideoConferenceFederation } from '@rocket.chat/core-typings';
import { federationSDK } from '@rocket.chat/federation-sdk';
import type { EventID, RoomID, UserID } from '@rocket.chat/federation-sdk';
import { Logger } from '@rocket.chat/logger';
import { MatrixRTCMemberships } from '@rocket.chat/models';

import { getMatrixRTCProfile } from './config';
import {
	CALL_MEMBER_EVENT_TYPE,
	COMPAT_MEMBERSHIP_EXPIRY_MS,
	DECLINE_STICKY_DURATION_MS,
	NOTIFICATION_STICKY_DURATION_MS,
	RTC_DECLINE_EVENT_TYPES,
	RTC_NOTIFICATION_EVENT_TYPES,
	buildCompatMembership,
	buildCompatMembershipLeave,
	buildRtcDecline,
	buildRtcNotification,
	compatMembershipStateKey,
} from './events';
import type { CallIntent } from './events';
import { localLiveKitIdentityFor } from './identities';
import { getMatrixRTCLiveKitIssuer } from './issuer';
import { createKeyedQueue } from './keyedQueue';

const logger = new Logger('MatrixRTCSession');

/** How long before a membership stops counting it is announced again: many heartbeats, and many sweeps, away. */
export const MEMBERSHIP_REFRESH_HEADROOM_MS = 10 * 60_000;

/** Rocket.Chat calls are video calls; a member may still turn the camera off. */
const CALL_INTENT: CallIntent = 'video';

/** The shape of Element's device ids, which some clients display. */
const DEVICE_ID_LENGTH = 10;
const DEVICE_ID_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const perMember = createKeyedQueue();

/** A room's version never changes, and the state it is read from is costly to build. */
const roomVersions = new Map<string, string>();

const generateDeviceId = (): string =>
	Array.from({ length: DEVICE_ID_LENGTH }, () => DEVICE_ID_ALPHABET[randomInt(DEVICE_ID_ALPHABET.length)]).join('');

const sessionOf = (call: IVideoConference): VideoConferenceFederation => {
	if (!call.federation) {
		throw new Error(`Conference ${call._id} is not in a federated room`);
	}

	return call.federation;
};

/** A user of this server, or the federated user standing for a member of another. */
const matrixUserIdOf = (user: IUser): string =>
	isUserNativeFederated(user) ? user.federation.mui : `@${user.username}:${federationSDK.getConfig('serverName')}`;

const roomVersionOf = async (mrid: string): Promise<string> => {
	const known = roomVersions.get(mrid);
	if (known) {
		return known;
	}

	const { version } = await federationSDK.getLatestRoomState2(mrid);
	roomVersions.set(mrid, version);

	return version;
};

/** When an event was sent by the clock receivers read it with, which is what a refresh pins `created_ts` to. */
const originServerTsOf = async (eventId: EventID): Promise<number | undefined> =>
	(await federationSDK.getEventById(eventId))?.event.origin_server_ts;

const announceCompatMembership = async ({
	mrid,
	userId,
	deviceId,
	stateKey,
	serviceUrl,
	expires,
	createdTs,
}: {
	mrid: string;
	userId: string;
	deviceId: string;
	stateKey: string;
	serviceUrl: string;
	expires: number;
	createdTs?: number;
}): Promise<EventID> => {
	const content = buildCompatMembership({ userId, deviceId, serviceUrl, expires, createdTs, callIntent: CALL_INTENT });
	const { eventId } = await federationSDK.sendStateEvent(mrid as RoomID, CALL_MEMBER_EVENT_TYPE, stateKey, content, userId as UserID);

	return eventId;
};

const stickyEventsUnavailable = (profile: string): Error =>
	new Error(`The ${profile} profile announces sticky events, which this build of the federation SDK cannot send`);

/** Announces a fresh membership: a new device, a new member id, and this server's SFU. */
async function announceMembership(call: IVideoConference, user: IUser, now: Date): Promise<IMatrixRTCMembership> {
	const { mrid, slotId } = sessionOf(call);

	const ownTransport = getMatrixRTCLiveKitIssuer()?.getOwnTransport();
	if (!ownTransport) {
		throw new Error('Federated calls are unavailable: LiveKit is not configured on this server');
	}

	const profile = getMatrixRTCProfile();
	if (profile !== 'compatibility') {
		throw stickyEventsUnavailable(profile);
	}

	const userId = matrixUserIdOf(user);
	const deviceId = generateDeviceId();
	// The member id the OpenID `/get_token` path reads from a compatibility membership is its `membershipID`.
	const memberId = `${userId}:${deviceId}`;
	const stateKey = compatMembershipStateKey(userId, deviceId, await roomVersionOf(mrid));

	const eventId = await announceCompatMembership({
		mrid,
		userId,
		deviceId,
		stateKey,
		serviceUrl: ownTransport.serviceUrl,
		expires: COMPAT_MEMBERSHIP_EXPIRY_MS,
	});
	const joinedAt = new Date((await originServerTsOf(eventId)) ?? now.getTime());

	const membership: Omit<IMatrixRTCMembership, '_id' | '_updatedAt'> = {
		rid: call.rid,
		mrid,
		slotId,
		callId: call._id,
		mode: 'compatibility',
		userId,
		uid: user._id,
		local: true,
		deviceId,
		memberId,
		stateKey,
		eventId,
		transport: { type: 'livekit', serviceUrl: ownTransport.serviceUrl },
		serverName: federationSDK.getConfig('serverName'),
		livekitIdentity: localLiveKitIdentityFor(profile, { userId, deviceId, memberId }),
		callIntent: CALL_INTENT,
		joinedAt,
		expiresAt: new Date(joinedAt.getTime() + COMPAT_MEMBERSHIP_EXPIRY_MS),
	};

	const { insertedId } = await MatrixRTCMemberships.insertOne(membership);

	return { ...membership, _id: insertedId, _updatedAt: now };
}

/** Announces the membership again, with content that differs from the last announcement. */
async function refreshMembership(membership: IMatrixRTCMembership): Promise<IMatrixRTCMembership> {
	if (membership.mode !== 'compatibility') {
		throw stickyEventsUnavailable(membership.mode);
	}

	const { mrid, userId, deviceId, stateKey, transport, joinedAt } = membership;
	if (!stateKey || !transport.serviceUrl) {
		throw new Error(`Membership ${membership._id} lacks what its compatibility announcement needs`);
	}

	const expires = membership.expiresAt.getTime() - joinedAt.getTime() + COMPAT_MEMBERSHIP_EXPIRY_MS;
	const eventId = await announceCompatMembership({
		mrid,
		userId,
		deviceId,
		stateKey,
		serviceUrl: transport.serviceUrl,
		expires,
		createdTs: joinedAt.getTime(),
	});
	const expiresAt = new Date(joinedAt.getTime() + expires);

	await MatrixRTCMemberships.updateAnnouncementById(membership._id, { eventId, expiresAt });

	return { ...membership, eventId, expiresAt };
}

/** Keeps a membership counting: a failed refresh leaves the one that still counts, and the next renewal tries again. */
async function refreshIfDue(membership: IMatrixRTCMembership, now: Date): Promise<IMatrixRTCMembership> {
	if (membership.expiresAt.getTime() - now.getTime() > MEMBERSHIP_REFRESH_HEADROOM_MS) {
		return membership;
	}

	try {
		return await refreshMembership(membership);
	} catch (err) {
		logger.error({ msg: 'Failed to refresh a MatrixRTC membership', membershipId: membership._id, callId: membership.callId, err });
		return membership;
	}
}

async function announceLeave({ _id, mode, mrid, userId, stateKey }: IMatrixRTCMembership): Promise<void> {
	try {
		if (mode !== 'compatibility') {
			throw stickyEventsUnavailable(mode);
		}

		if (stateKey) {
			await federationSDK.sendStateEvent(mrid as RoomID, CALL_MEMBER_EVENT_TYPE, stateKey, buildCompatMembershipLeave(), userId as UserID);
		}
	} catch (err) {
		logger.error({ msg: 'Failed to announce that a member left a MatrixRTC session', membershipId: _id, err });
	}
}

const memberKey = (callId: IVideoConference['_id'], uid: IUser['_id']): string => `${callId}:${uid}`;

/**
 * Announces in the room that one of this server's users is in a federated conference, or confirms the announcement
 * still stands, and returns the membership. Safe to repeat on every join and every token request: it is also what
 * announces the membership again before it would stop counting. The member's roster entry follows the membership.
 */
export async function joinRTCSession(call: IVideoConference, user: IUser): Promise<IMatrixRTCMembership> {
	sessionOf(call);

	const membership = await perMember(memberKey(call._id, user._id), async () => {
		const now = new Date();
		const existing = await MatrixRTCMemberships.findOneActiveLocal(call._id, user._id, now);

		return existing ? refreshIfDue(existing, now) : announceMembership(call, user, now);
	});

	await VideoConf.setMemberFederation(call._id, user._id, getVideoConferenceMemberFederation(membership));

	return membership;
}

/**
 * Announces in the room that one of this server's users left a federated conference, for every device this server
 * announced for them there. A leave that fails to go out is logged, never thrown: the membership runs out anyway.
 */
export async function leaveRTCSession(call: IVideoConference, uid: IUser['_id']): Promise<void> {
	await perMember(memberKey(call._id, uid), async () => {
		const memberships = await MatrixRTCMemberships.findLocalByCallIdAndUid(call._id, uid).toArray();
		if (!memberships.length) {
			return;
		}

		await Promise.all(memberships.map(announceLeave));
		await MatrixRTCMemberships.removeByIds(memberships.map(({ _id }) => _id));
	});
}

/**
 * Rings, or tells about the call, the members of other servers through the room, mentioning each of them. The ring
 * relates to the caller's own membership, so the caller must be announced first.
 */
export async function notifyRTCSession(
	call: IVideoConference,
	caller: IUser,
	targets: IUser[],
	kind: 'ring' | 'notification',
): Promise<void> {
	const { mrid } = sessionOf(call);

	const membership = await MatrixRTCMemberships.findOneActiveLocal(call._id, caller._id);
	if (!membership?.eventId) {
		throw new Error(`User ${caller._id} has no membership in conference ${call._id} for a ring to relate to`);
	}

	const userIds = targets.map(matrixUserIdOf);
	const content = buildRtcNotification({
		kind,
		userIds,
		membershipEventId: membership.eventId,
		senderTs: Date.now(),
		callIntent: membership.callIntent,
	});

	const { eventId } = await federationSDK.sendStickyEvent(
		mrid as RoomID,
		RTC_NOTIFICATION_EVENT_TYPES[0],
		content,
		membership.userId as UserID,
		NOTIFICATION_STICKY_DURATION_MS,
	);

	await MatrixRTCMemberships.setNotificationById(membership._id, { eventId, userIds });
}

/** Turns down, for one of this server's users, the ring another server rang them with in a conference, if any. */
export async function declineRTCSession(call: IVideoConference, user: IUser): Promise<void> {
	const { mrid } = sessionOf(call);
	const userId = matrixUserIdOf(user);

	const ringer = await MatrixRTCMemberships.findOneRemoteRinging(call._id, userId);
	if (!ringer?.notification) {
		return;
	}

	await federationSDK.sendStickyEvent(
		mrid as RoomID,
		RTC_DECLINE_EVENT_TYPES[0],
		buildRtcDecline(ringer.notification.eventId),
		userId as UserID,
		DECLINE_STICKY_DURATION_MS,
	);
}
