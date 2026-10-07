import type { MatrixRTCLiveKitTransport, MatrixRTCMode } from '@rocket.chat/core-typings';

import { MATRIXRTC_ROOM_CALL_SLOT_ID } from './derive';

/** A device's membership as room state, one per device: what Element Call announces in its default mode. */
export const CALL_MEMBER_EVENT_TYPE = 'org.matrix.msc3401.call.member';

/** A membership as a sticky event (MSC4354), one per join. The unstable name is the one sent. */
export const RTC_MEMBER_EVENT_TYPES = ['org.matrix.msc4143.rtc.member', 'm.rtc.member'] as const;

/** A ring, or a quieter notification, about a call. */
export const RTC_NOTIFICATION_EVENT_TYPES = ['org.matrix.msc4075.rtc.notification', 'm.rtc.invite'] as const;

export const RTC_DECLINE_EVENT_TYPES = ['org.matrix.msc4310.rtc.decline', 'm.rtc.decline'] as const;

/** Servers clamp stickiness to this, whatever the event asks for. */
export const MAX_STICKY_DURATION_MS = 60 * 60_000;

export const MEMBERSHIP_STICKY_DURATION_MS = MAX_STICKY_DURATION_MS;

/** js-sdk's `membershipEventExpiryMs`: a compatibility membership's `expires` grows by this on every refresh. */
export const COMPAT_MEMBERSHIP_EXPIRY_MS = 4 * 60 * 60_000;

export const RING_LIFETIME_MS = 90_000;

/** Element keeps a notification sticky for 20 s past its lifetime. */
export const NOTIFICATION_STICKY_DURATION_MS = RING_LIFETIME_MS + 20_000;

export const DECLINE_STICKY_DURATION_MS = 120_000;

/** Beyond this gap between `sender_ts` and `origin_server_ts`, Element Web trusts the server's clock. */
const SENDER_CLOCK_TOLERANCE_MS = 15_000;

/** Room versions in which a state key starting with a user id is owned by that user (MSC3757, MSC3779). */
const OWNED_STATE_KEY_ROOM_VERSIONS = /^org\.matrix\.msc(3757|3779)\b/;

export type CallIntent = 'audio' | 'video';

/** The part of a PDU the parsers read. */
export type MatrixRTCPdu = {
	sender: string;
	content: Record<string, unknown>;
	origin_server_ts: number;
	/** Where MSC4354 puts the stickiness, unstable and stable. */
	msc4354_sticky?: unknown;
	sticky?: unknown;
};

/** A member of a session, as one event announces them. */
export type AnnouncedMembership = {
	form: MatrixRTCMode;
	userId: string;
	deviceId: string;
	/** `member.id`; for a compatibility membership, its `membershipID`. */
	memberId: string;
	slotId: string;
	/** The one the member publishes on. */
	transport: MatrixRTCLiveKitTransport;
	callIntent?: CallIntent;
	joinedAt: number;
	expiresAt: number;
};

/** What a sticky membership event does to the entry under its sticky key, which is the member id. */
export type RtcMembershipChange = ({ kind: 'join' } & AnnouncedMembership) | { kind: 'leave'; userId: string; memberId: string };

export type RtcNotification = {
	kind: 'ring' | 'notification';
	slotId: string;
	userIds: string[];
	roomMention: boolean;
	/** The caller's own membership event. */
	membershipEventId: string;
	/** When the caller rang, by the clock Element Web trusts. */
	sentAt: number;
	lifetime: number;
	callIntent?: CallIntent;
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === 'string';

const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every(isString);

const isAbsentOr = (value: unknown, check: (value: unknown) => boolean): boolean => value === undefined || check(value);

const isTyped = (value: unknown): boolean => isRecord(value) && isString(value.type);

const isMatrixUserId = (value: string): boolean => /^@[^:\s]+:\S+$/.test(value);

const callIntentOf = (value: unknown): CallIntent | undefined => (value === 'audio' || value === 'video' ? value : undefined);

/** Undefined for any other kind of transport, or one that names neither an SFU nor a token service. */
const liveKitTransportOf = (value: unknown): MatrixRTCLiveKitTransport | undefined => {
	if (!isRecord(value) || value.type !== 'livekit') {
		return undefined;
	}

	const url = isString(value.url) && value.url ? value.url : undefined;
	const serviceUrl = isString(value.livekit_service_url) && value.livekit_service_url ? value.livekit_service_url : undefined;
	if (!url && !serviceUrl) {
		return undefined;
	}

	return { type: 'livekit', ...(url && { url }), ...(serviceUrl && { serviceUrl }) };
};

const publishedTransportOf = ({ url, serviceUrl }: MatrixRTCLiveKitTransport): Record<string, string> => ({
	type: 'livekit',
	...(url && { url }),
	...(serviceUrl && { livekit_service_url: serviceUrl }),
});

type CompatContent = {
	'device_id': string;
	'call_id': string;
	'application': string;
	'focus_active': { type: string };
	'foci_preferred'?: Record<string, unknown>[];
	'created_ts'?: number;
	'expires'?: unknown;
	'membershipID'?: unknown;
	'm.call.intent'?: string;
};

/** js-sdk's `checkSessionsMembershipData`. */
const isCompatContent = (content: Record<string, unknown>): content is CompatContent =>
	isString(content.device_id) &&
	isString(content.call_id) &&
	isString(content.application) &&
	isTyped(content.focus_active) &&
	isAbsentOr(content.foci_preferred, (value) => Array.isArray(value) && value.every(isTyped)) &&
	isAbsentOr(content.created_ts, isNumber) &&
	isAbsentOr(content.scope, isString) &&
	isAbsentOr(content['m.call.intent'], isString) &&
	isAbsentOr(content.capabilities, isStringArray);

/**
 * The member a compatibility state event announces, or undefined when it announces none: a leave (`{}`), the pre-2024
 * form, content js-sdk rejects, or a member publishing on no LiveKit SFU.
 */
export function parseCompatMembership(event: MatrixRTCPdu): AnnouncedMembership | undefined {
	const { content, sender } = event;
	if (!isCompatContent(content)) {
		return undefined;
	}

	const transport = liveKitTransportOf(content.foci_preferred?.[0]);
	if (!transport) {
		return undefined;
	}

	const joinedAt = content.created_ts ?? event.origin_server_ts;
	const expires = isNumber(content.expires) ? content.expires : COMPAT_MEMBERSHIP_EXPIRY_MS;

	return {
		form: 'compatibility',
		userId: sender,
		deviceId: content.device_id,
		memberId: isString(content.membershipID) ? content.membershipID : `${sender}:${content.device_id}`,
		// js-sdk reads an empty call id as the room-wide slot.
		slotId: `${content.application}#${content.call_id || 'ROOM'}`,
		transport,
		callIntent: callIntentOf(content['m.call.intent']),
		joinedAt,
		expiresAt: joinedAt + expires,
	};
}

const STICKY_KEY_FIELDS = ['msc4354_sticky_key', 'sticky_key'];

const LEAVE_FIELDS = new Set(['slot_id', ...STICKY_KEY_FIELDS]);

/** Undefined when absent, or when the unstable and stable keys disagree. */
const stickyKeyOf = (content: Record<string, unknown>): string | undefined => {
	const { msc4354_sticky_key: unstable, sticky_key: stable } = content;
	if (unstable !== undefined && stable !== undefined && unstable !== stable) {
		return undefined;
	}

	const key = unstable ?? stable;
	return isString(key) ? key : undefined;
};

/**
 * When an event stops being sticky, as js-sdk computes it without a remaining TTL from the server. Undefined for an
 * event that is not sticky at all.
 */
export const stickyExpiryOf = (event: MatrixRTCPdu, now: number): number | undefined => {
	const sticky = [event.msc4354_sticky, event.sticky].find(isRecord);
	const duration = sticky?.duration_ms;
	if (!isNumber(duration) || !Number.isInteger(duration) || duration <= 0) {
		return undefined;
	}

	return Math.min(now, event.origin_server_ts) + Math.min(duration, MAX_STICKY_DURATION_MS);
};

type RtcJoinContent = {
	slot_id: string;
	application: Record<string, unknown> & { type: string };
	member: { user_id: string; device_id: string; id: string };
	transports: { published: Record<string, unknown>[] };
};

/** js-sdk's `checkRtcMembershipData`. */
const isRtcJoinContent = (content: Record<string, unknown>, sender: string): content is RtcJoinContent => {
	const { application, member, transports, slot_id: slotId } = content;

	return (
		isRecord(application) &&
		isString(application.type) &&
		!application.type.includes('#') &&
		isString(slotId) &&
		slotId.startsWith(`${application.type}#`) &&
		slotId.split('#').length === 2 &&
		isRecord(member) &&
		isString(member.user_id) &&
		isMatrixUserId(member.user_id) &&
		member.user_id === sender &&
		isString(member.device_id) &&
		isString(member.id) &&
		isRecord(transports) &&
		Array.isArray(transports.published) &&
		transports.published.every(isTyped) &&
		isAbsentOr(transports.can_subscribe, isStringArray) &&
		isStringArray(content.versions)
	);
};

/**
 * What a sticky membership event does to the entry under its sticky key, or undefined for an event that cannot be
 * one: not sticky, or with no usable sticky key.
 *
 * Content that announces no member replaces the entry all the same, so it is a leave: the leave form itself, content
 * js-sdk rejects, a sticky key that is not the member id, or a member publishing on no LiveKit SFU.
 *
 * @param expiresAt the server's word on when the event stops being sticky, when it gave one.
 */
export function parseRtcMembership(
	event: MatrixRTCPdu,
	{ now, expiresAt }: { now: number; expiresAt?: number },
): RtcMembershipChange | undefined {
	const { content, sender } = event;

	const memberId = stickyKeyOf(content);
	const expiry = expiresAt ?? stickyExpiryOf(event, now);
	if (!memberId || expiry === undefined) {
		return undefined;
	}

	const leave = { kind: 'leave', userId: sender, memberId } as const;

	if (
		Object.keys(content).every((field) => LEAVE_FIELDS.has(field)) ||
		!isRtcJoinContent(content, sender) ||
		content.member.id !== memberId
	) {
		return leave;
	}

	const transport = content.transports.published.map(liveKitTransportOf).find(Boolean);
	if (!transport) {
		return leave;
	}

	return {
		kind: 'join',
		form: 'matrix_2_0',
		userId: sender,
		deviceId: content.member.device_id,
		memberId,
		slotId: content.slot_id,
		transport,
		callIntent: callIntentOf(content.application['m.call.intent']),
		joinedAt: Math.min(now, event.origin_server_ts),
		expiresAt: expiry,
	};
}

/** Undefined for a withdrawn notification, and for one Element Web would not show: without its `m.reference`. */
export function parseRtcNotification(event: MatrixRTCPdu): RtcNotification | undefined {
	const { content } = event;
	const relation = content['m.relates_to'];
	const { notification_type: kind, slot_id: slotId, sender_ts: senderTs, lifetime } = content;

	if (!isRecord(relation) || relation.rel_type !== 'm.reference' || !isString(relation.event_id)) {
		return undefined;
	}

	if ((kind !== 'ring' && kind !== 'notification') || !isString(slotId) || !isNumber(senderTs) || !isNumber(lifetime)) {
		return undefined;
	}

	const mentions = isRecord(content['m.mentions']) ? content['m.mentions'] : {};

	return {
		kind,
		slotId,
		userIds: isStringArray(mentions.user_ids) ? mentions.user_ids : [],
		roomMention: mentions.room === true,
		membershipEventId: relation.event_id,
		sentAt: Math.abs(senderTs - event.origin_server_ts) < SENDER_CLOCK_TOLERANCE_MS ? senderTs : event.origin_server_ts,
		lifetime,
		callIntent: callIntentOf(content['m.call.intent']),
	};
}

export const isNotificationLive = ({ sentAt, lifetime }: Pick<RtcNotification, 'sentAt' | 'lifetime'>, now: number): boolean =>
	now - sentAt <= lifetime;

export function parseRtcDecline(event: MatrixRTCPdu): { notificationEventId: string } | undefined {
	const relation = event.content['m.relates_to'];
	if (!isRecord(relation) || relation.rel_type !== 'm.reference' || !isString(relation.event_id)) {
		return undefined;
	}

	return { notificationEventId: relation.event_id };
}

/** The state key of a device's compatibility membership in the room-wide slot. */
export const compatMembershipStateKey = (userId: string, deviceId: string, roomVersion: string): string => {
	const stateKey = `${userId}_${deviceId}_m.call`;

	// Elsewhere a state key starting with `@` must be the sender's own id, so it gets a prefix.
	return OWNED_STATE_KEY_ROOM_VERSIONS.test(roomVersion) ? stateKey : `_${stateKey}`;
};

/**
 * A compatibility membership in the room-wide slot. A refresh pins `createdTs` to the first announcement and grows
 * `expires`, since identical state would be a no-op.
 */
export const buildCompatMembership = ({
	userId,
	deviceId,
	serviceUrl,
	expires,
	createdTs,
	callIntent,
}: {
	userId: string;
	deviceId: string;
	serviceUrl: string;
	expires: number;
	createdTs?: number;
	callIntent?: CallIntent;
}): Record<string, unknown> => ({
	application: 'm.call',
	call_id: '',
	scope: 'm.room',
	device_id: deviceId,
	membershipID: `${userId}:${deviceId}`,
	expires,
	...(createdTs !== undefined && { created_ts: createdTs }),
	...(callIntent && { 'm.call.intent': callIntent }),
	focus_active: { type: 'livekit', focus_selection: 'multi_sfu' },
	foci_preferred: [{ type: 'livekit', livekit_service_url: serviceUrl }],
});

export const buildCompatMembershipLeave = (): Record<string, unknown> => ({});

/** A sticky membership in the room-wide slot, keyed by the member id. */
export const buildRtcMembership = ({
	userId,
	deviceId,
	memberId,
	transport,
	callIntent,
}: {
	userId: string;
	deviceId: string;
	memberId: string;
	transport: MatrixRTCLiveKitTransport;
	callIntent?: CallIntent;
}): Record<string, unknown> => ({
	slot_id: MATRIXRTC_ROOM_CALL_SLOT_ID,
	application: { type: 'm.call', ...(callIntent && { 'm.call.intent': callIntent }) },
	transports: { published: [publishedTransportOf(transport)], can_subscribe: ['livekit'] },
	member: { device_id: deviceId, user_id: userId, id: memberId },
	versions: [],
	msc4354_sticky_key: memberId,
});

/** Sent with the same sticky duration as the join it ends. */
export const buildRtcMembershipLeave = (memberId: string): Record<string, unknown> => ({
	slot_id: MATRIXRTC_ROOM_CALL_SLOT_ID,
	msc4354_sticky_key: memberId,
});

/** Mentions the callees by id: a caller without `notifications.room` power is heard only through `user_ids`. */
export const buildRtcNotification = ({
	kind,
	userIds,
	membershipEventId,
	senderTs,
	callIntent,
}: {
	kind: RtcNotification['kind'];
	userIds: string[];
	membershipEventId: string;
	senderTs: number;
	callIntent?: CallIntent;
}): Record<string, unknown> => ({
	'slot_id': MATRIXRTC_ROOM_CALL_SLOT_ID,
	'm.mentions': { user_ids: userIds },
	'notification_type': kind,
	'm.relates_to': { rel_type: 'm.reference', event_id: membershipEventId },
	'sender_ts': senderTs,
	'lifetime': RING_LIFETIME_MS,
	'msc4354_sticky_key': MATRIXRTC_ROOM_CALL_SLOT_ID,
	...(callIntent && { 'm.call.intent': callIntent }),
});

export const buildRtcDecline = (notificationEventId: string): Record<string, unknown> => ({
	'm.relates_to': { rel_type: 'm.reference', event_id: notificationEventId },
	'msc4354_sticky_key': notificationEventId,
});
