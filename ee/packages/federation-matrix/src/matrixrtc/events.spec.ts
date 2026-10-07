import {
	buildCompatMembership,
	buildCompatMembershipLeave,
	buildRtcDecline,
	buildRtcMembership,
	buildRtcMembershipLeave,
	buildRtcNotification,
	compatMembershipStateKey,
	isNotificationLive,
	parseCompatMembership,
	parseRtcDecline,
	parseRtcMembership,
	parseRtcNotification,
	stickyExpiryOf,
} from './events';

// Fixtures are the JSON examples of docs/features/video-conference-federation/protocol.md, as Element sends them.

const MEMBER_ID = '2f4c3a1e-8d1b-4c39-9b1f-0a7e6c2d5b10';

/** protocol.md §2.2 */
const rtcJoinContent = () => ({
	slot_id: 'm.call#ROOM',
	application: { 'type': 'm.call', 'm.call.intent': 'video' },
	transports: {
		published: [{ type: 'livekit', livekit_service_url: 'https://matrix-rtc.example.com/livekit/jwt' }],
		can_subscribe: ['livekit'],
	},
	member: { device_id: 'ABCDEFGHIJ', user_id: '@alice:example.com', id: MEMBER_ID },
	versions: [],
	msc4354_sticky_key: MEMBER_ID,
});

/** protocol.md §3.2, Main */
const compatJoinContent = () => ({
	'application': 'm.call',
	'call_id': '',
	'scope': 'm.room',
	'device_id': 'ABCDEFGHIJ',
	'membershipID': '@alice:example.com:ABCDEFGHIJ',
	'expires': 14400000,
	'm.call.intent': 'video',
	'focus_active': { type: 'livekit', focus_selection: 'multi_sfu' },
	'foci_preferred': [{ type: 'livekit', livekit_service_url: 'https://matrix-rtc.example.com/livekit/jwt' }],
});

/** protocol.md §6.1 */
const notificationContent = () => ({
	'slot_id': 'm.call#ROOM',
	'm.mentions': { user_ids: [], room: true },
	'notification_type': 'ring',
	'm.relates_to': { rel_type: 'm.reference', event_id: '$own_membership_event_id' },
	'sender_ts': 1791374400000,
	'lifetime': 90000,
	'msc4354_sticky_key': 'm.call#ROOM',
	'm.call.intent': 'video',
});

const ORIGIN_TS = 1791374400000;
const HOUR = 3_600_000;

const pdu = (content: Record<string, unknown>, extra: Record<string, unknown> = {}) => ({
	sender: '@alice:example.com',
	origin_server_ts: ORIGIN_TS,
	content,
	...extra,
});

const sticky = (content: Record<string, unknown>, durationMs = HOUR) => pdu(content, { msc4354_sticky: { duration_ms: durationMs } });

describe('compatibility memberships', () => {
	it('reads the member a Main-generation state event announces', () => {
		expect(parseCompatMembership(pdu(compatJoinContent()))).toEqual({
			form: 'compatibility',
			userId: '@alice:example.com',
			deviceId: 'ABCDEFGHIJ',
			memberId: '@alice:example.com:ABCDEFGHIJ',
			slotId: 'm.call#ROOM',
			transport: { type: 'livekit', serviceUrl: 'https://matrix-rtc.example.com/livekit/jwt' },
			callIntent: 'video',
			joinedAt: ORIGIN_TS,
			expiresAt: ORIGIN_TS + 4 * HOUR,
		});
	});

	it('ignores the dead livekit_alias of the Released generation', () => {
		const content = {
			...compatJoinContent(),
			foci_preferred: [
				{ livekit_alias: '!abc:example.com', type: 'livekit', livekit_service_url: 'https://matrix-rtc.example.com/livekit/jwt' },
			],
		};

		expect(parseCompatMembership(pdu(content))?.transport).toEqual({
			type: 'livekit',
			serviceUrl: 'https://matrix-rtc.example.com/livekit/jwt',
		});
	});

	it('counts a refresh from its first announcement, for as long as it grew', () => {
		const membership = parseCompatMembership(pdu({ ...compatJoinContent(), created_ts: ORIGIN_TS - HOUR, expires: 8 * HOUR }));

		expect(membership).toMatchObject({ joinedAt: ORIGIN_TS - HOUR, expiresAt: ORIGIN_TS + 7 * HOUR });
	});

	it('defaults the membership id and the expiry the way receivers do', () => {
		const { membershipID: _, expires: __, ...content } = compatJoinContent();

		expect(parseCompatMembership(pdu(content))).toMatchObject({
			memberId: '@alice:example.com:ABCDEFGHIJ',
			expiresAt: ORIGIN_TS + 4 * HOUR,
		});
	});

	it('announces nobody in the leave form', () => {
		expect(parseCompatMembership(pdu(buildCompatMembershipLeave()))).toBeUndefined();
	});

	it('ignores the pre-2024 form', () => {
		expect(parseCompatMembership(pdu({ memberships: [compatJoinContent()] }))).toBeUndefined();
	});

	it.each([
		['a device id that is not a string', { device_id: 42 }],
		['no call id', { call_id: undefined }],
		['no active focus type', { focus_active: {} }],
		['a preferred focus without a type', { foci_preferred: [{ livekit_service_url: 'https://x' }] }],
		['a created_ts that is not a number', { created_ts: 'yesterday' }],
		['capabilities that are not strings', { capabilities: [1] }],
	])('rejects, as js-sdk does, content with %s', (_, override) => {
		expect(parseCompatMembership(pdu({ ...compatJoinContent(), ...override }))).toBeUndefined();
	});

	it('cannot use a member publishing on something other than LiveKit', () => {
		expect(parseCompatMembership(pdu({ ...compatJoinContent(), foci_preferred: [{ type: 'full_mesh' }] }))).toBeUndefined();
	});

	it('names the state key with the underscore prefix except where the room version lets users own their key', () => {
		expect(compatMembershipStateKey('@alice:example.com', 'ABCDEFGHIJ', '10')).toBe('_@alice:example.com_ABCDEFGHIJ_m.call');
		expect(compatMembershipStateKey('@alice:example.com', 'ABCDEFGHIJ', 'org.matrix.msc3757.11')).toBe(
			'@alice:example.com_ABCDEFGHIJ_m.call',
		);
		expect(compatMembershipStateKey('@alice:example.com', 'ABCDEFGHIJ', 'org.matrix.msc3779.10')).toBe(
			'@alice:example.com_ABCDEFGHIJ_m.call',
		);
	});

	it('builds the Main form, with no livekit_alias', () => {
		expect(
			buildCompatMembership({
				userId: '@alice:example.com',
				deviceId: 'ABCDEFGHIJ',
				serviceUrl: 'https://matrix-rtc.example.com/livekit/jwt',
				expires: 14400000,
				callIntent: 'video',
			}),
		).toEqual(compatJoinContent());
	});

	it('builds a refresh that pins created_ts, so the content differs from the join', () => {
		const refresh = buildCompatMembership({
			userId: '@alice:example.com',
			deviceId: 'ABCDEFGHIJ',
			serviceUrl: 'https://matrix-rtc.example.com/livekit/jwt',
			expires: 8 * HOUR,
			createdTs: ORIGIN_TS,
			callIntent: 'video',
		});

		expect(refresh).toEqual({ ...compatJoinContent(), expires: 8 * HOUR, created_ts: ORIGIN_TS });
	});

	it('reads back what it builds', () => {
		const content = buildCompatMembership({
			userId: '@alice:example.com',
			deviceId: 'ABCDEFGHIJ',
			serviceUrl: 'https://rc.example.com/matrixrtc/livekit-jwt',
			expires: 4 * HOUR,
		});

		expect(parseCompatMembership(pdu(content))).toMatchObject({
			deviceId: 'ABCDEFGHIJ',
			slotId: 'm.call#ROOM',
			transport: { type: 'livekit', serviceUrl: 'https://rc.example.com/matrixrtc/livekit-jwt' },
		});
	});
});

describe('sticky memberships', () => {
	const now = ORIGIN_TS + 1000;

	it('reads the member a join announces, sticky for an hour from when it was sent', () => {
		expect(parseRtcMembership(sticky(rtcJoinContent()), { now })).toEqual({
			kind: 'join',
			form: 'matrix_2_0',
			userId: '@alice:example.com',
			deviceId: 'ABCDEFGHIJ',
			memberId: MEMBER_ID,
			slotId: 'm.call#ROOM',
			transport: { type: 'livekit', serviceUrl: 'https://matrix-rtc.example.com/livekit/jwt' },
			callIntent: 'video',
			joinedAt: ORIGIN_TS,
			expiresAt: ORIGIN_TS + HOUR,
		});
	});

	it('reads the federation PDU example, stickiness and all', () => {
		// protocol.md §1.7, the PDU Rocket.Chat itself sends
		const event = {
			content: {
				application: { 'type': 'm.call', 'm.call.intent': 'video' },
				member: { device_id: 'RCDEVICE01', id: MEMBER_ID, user_id: '@alice:rc.example.com' },
				msc4354_sticky_key: MEMBER_ID,
				slot_id: 'm.call#ROOM',
				transports: {
					can_subscribe: ['livekit'],
					published: [{ type: 'livekit', livekit_service_url: 'https://rc.example.com/_rc/livekit-jwt' }],
				},
				versions: [],
			},
			msc4354_sticky: { duration_ms: 3600000 },
			origin_server_ts: 1791374400000,
			sender: '@alice:rc.example.com',
		};

		expect(parseRtcMembership(event, { now })).toMatchObject({ kind: 'join', deviceId: 'RCDEVICE01', expiresAt: ORIGIN_TS + HOUR });
	});

	it('prefers the expiry the server gives', () => {
		expect(parseRtcMembership(sticky(rtcJoinContent()), { now, expiresAt: now + 5000 })).toMatchObject({ expiresAt: now + 5000 });
	});

	it('starts the stickiness no later than now, whatever the sender clock says', () => {
		const event = { ...sticky(rtcJoinContent()), origin_server_ts: now + HOUR };

		expect(stickyExpiryOf(event, now)).toBe(now + HOUR);
	});

	it('clamps the stickiness to an hour', () => {
		expect(stickyExpiryOf(sticky(rtcJoinContent(), 10 * HOUR), now)).toBe(ORIGIN_TS + HOUR);
	});

	it('accepts the stable sticky field', () => {
		expect(stickyExpiryOf(pdu(rtcJoinContent(), { sticky: { duration_ms: 60_000 } }), now)).toBe(ORIGIN_TS + 60_000);
	});

	it.each([
		['no stickiness', undefined],
		['a zero duration', { duration_ms: 0 }],
		['a negative duration', { duration_ms: -1 }],
		['a duration that is not an integer', { duration_ms: 1.5 }],
	])('does not count an event with %s', (_, stickiness) => {
		expect(parseRtcMembership(pdu(rtcJoinContent(), { msc4354_sticky: stickiness }), { now })).toBeUndefined();
	});

	it('reads the leave form as a leave of that member', () => {
		// protocol.md §2.3
		const content = { slot_id: 'm.call#ROOM', msc4354_sticky_key: MEMBER_ID };

		expect(parseRtcMembership(sticky(content), { now })).toEqual({ kind: 'leave', userId: '@alice:example.com', memberId: MEMBER_ID });
	});

	it('treats a member claiming to be someone other than the sender as gone', () => {
		const content = { ...rtcJoinContent(), member: { ...rtcJoinContent().member, user_id: '@mallory:example.com' } };

		expect(parseRtcMembership(sticky(content), { now })).toMatchObject({ kind: 'leave', memberId: MEMBER_ID });
	});

	it.each([
		['a slot of another application', { slot_id: 'm.other#ROOM' }],
		['a slot with two separators', { slot_id: 'm.call#ROOM#2' }],
		['an application type with a separator', { application: { type: 'm.call#x' } }],
		['no versions', { versions: undefined }],
		['published transports without a type', { transports: { published: [{ url: 'wss://x' }] } }],
		['subscribable transports that are not strings', { transports: { published: [], can_subscribe: [1] } }],
		['a member id that is not the sticky key', { member: { device_id: 'ABCDEFGHIJ', user_id: '@alice:example.com', id: 'other' } }],
		['nothing to publish on but a full mesh', { transports: { published: [{ type: 'full_mesh' }] } }],
	])('treats content with %s as gone', (_, override) => {
		expect(parseRtcMembership(sticky({ ...rtcJoinContent(), ...override }), { now })).toMatchObject({ kind: 'leave' });
	});

	it('cannot place an event whose sticky keys disagree', () => {
		expect(parseRtcMembership(sticky({ ...rtcJoinContent(), sticky_key: 'other' }), { now })).toBeUndefined();
	});

	it('reads the stable sticky key', () => {
		const { msc4354_sticky_key: _, ...content } = rtcJoinContent();

		expect(parseRtcMembership(sticky({ ...content, sticky_key: MEMBER_ID }), { now })).toMatchObject({ kind: 'join', memberId: MEMBER_ID });
	});

	it('reads the SFU address of an MSC4195 member', () => {
		const content = { ...rtcJoinContent(), transports: { published: [{ type: 'livekit', url: 'wss://sfu.example.com' }] } };

		expect(parseRtcMembership(sticky(content), { now })).toMatchObject({ transport: { type: 'livekit', url: 'wss://sfu.example.com' } });
	});

	it('builds the join js-sdk sends', () => {
		expect(
			buildRtcMembership({
				userId: '@alice:example.com',
				deviceId: 'ABCDEFGHIJ',
				memberId: MEMBER_ID,
				transport: { type: 'livekit', serviceUrl: 'https://matrix-rtc.example.com/livekit/jwt' },
				callIntent: 'video',
			}),
		).toEqual(rtcJoinContent());
	});

	it('builds the MSC4195 join, naming the SFU itself', () => {
		const content = buildRtcMembership({
			userId: '@alice:example.com',
			deviceId: 'ABCDEFGHIJ',
			memberId: MEMBER_ID,
			transport: { type: 'livekit', url: 'wss://sfu.example.com' },
		});

		expect(content.transports).toEqual({ published: [{ type: 'livekit', url: 'wss://sfu.example.com' }], can_subscribe: ['livekit'] });
		expect(content.application).toEqual({ type: 'm.call' });
	});

	it('builds the leave js-sdk sends', () => {
		expect(buildRtcMembershipLeave(MEMBER_ID)).toEqual({ slot_id: 'm.call#ROOM', msc4354_sticky_key: MEMBER_ID });
	});
});

describe('rings', () => {
	it('reads the ring Element sends', () => {
		expect(parseRtcNotification(pdu(notificationContent()))).toEqual({
			kind: 'ring',
			slotId: 'm.call#ROOM',
			userIds: [],
			roomMention: true,
			membershipEventId: '$own_membership_event_id',
			sentAt: 1791374400000,
			lifetime: 90000,
			callIntent: 'video',
		});
	});

	it('trusts the server clock over a sender clock that is off by 15 s or more', () => {
		const event = { ...pdu(notificationContent()), origin_server_ts: ORIGIN_TS + 15_000 };

		expect(parseRtcNotification(event)?.sentAt).toBe(ORIGIN_TS + 15_000);
	});

	it('rings for its lifetime and no longer', () => {
		const ring = parseRtcNotification(pdu(notificationContent()));
		if (!ring) {
			throw new Error('the fixture should parse');
		}

		expect(isNotificationLive(ring, ORIGIN_TS + 90_000)).toBe(true);
		expect(isNotificationLive(ring, ORIGIN_TS + 90_001)).toBe(false);
	});

	it('ignores a ring that relates to nothing, which Element Web would not show either', () => {
		const { 'm.relates_to': _, ...content } = notificationContent();

		expect(parseRtcNotification(pdu(content))).toBeUndefined();
	});

	it('ignores a withdrawn ring', () => {
		expect(parseRtcNotification(pdu({ msc4354_sticky_key: 'm.call#ROOM' }))).toBeUndefined();
	});

	it('builds a ring that mentions the callee and relates to the caller membership', () => {
		expect(
			buildRtcNotification({
				kind: 'ring',
				userIds: ['@bob:example.org'],
				membershipEventId: '$own_membership_event_id',
				senderTs: 1791374400000,
				callIntent: 'video',
			}),
		).toEqual({ ...notificationContent(), 'm.mentions': { user_ids: ['@bob:example.org'] } });
	});
});

describe('declines', () => {
	// protocol.md §6.2
	const declineContent = {
		'm.relates_to': { rel_type: 'm.reference', event_id: '$notification_event_id' },
		'msc4354_sticky_key': '$notification_event_id',
	};

	it('reads the ring a decline turns down', () => {
		expect(parseRtcDecline(pdu(declineContent))).toEqual({ notificationEventId: '$notification_event_id' });
	});

	it('ignores a decline that relates to nothing', () => {
		expect(parseRtcDecline(pdu({ 'm.relates_to': { rel_type: 'm.annotation', event_id: '$x' } }))).toBeUndefined();
	});

	it('builds the decline js-sdk sends', () => {
		expect(buildRtcDecline('$notification_event_id')).toEqual(declineContent);
	});
});
