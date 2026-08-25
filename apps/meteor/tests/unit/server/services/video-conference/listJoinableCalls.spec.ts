import type { IVideoConferenceUser, VideoConference } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, beforeEach, describe, it } from 'mocha';
import sinon from 'sinon';

import { buildDirectCall, buildGroupCall, buildMember, createService, resetAll } from './testHarness';
import { CALL_FACES_SHOWN } from '../../../../../lib/videoConference/constants';

const me = 'me';

let running: VideoConference[] = [];
let subscribedRids: string[] = [];
let subscriptionNames: Record<string, string | undefined> = {};

/**
 * Answers with only the fields the query asked for, as a database would.
 *
 * Not pedantry: handing back the whole fixture hides a projection that forgot a field the code goes on to read,
 * and the failure lands in production as an endpoint that throws — which is exactly what happened here when
 * naming a call started needing `createdBy`.
 */
const project = <T extends Record<string, unknown>>(doc: T, projection?: Record<string, 1>): Partial<T> =>
	projection ? (Object.fromEntries(Object.entries(doc).filter(([key]) => key === '_id' || projection[key])) as Partial<T>) : { ...doc };

const VideoConferenceModelMock = {
	find: sinon.stub().callsFake((_query: unknown, options?: { projection?: Record<string, 1> }) => ({
		toArray: async () => running.map((call) => project({ ...call, users: [...call.users] }, options?.projection)),
	})),
};

const SubscriptionsMock = {
	findByUserIdAndRoomIds: sinon.stub().callsFake((_uid: string, rids: string[]) => ({
		toArray: async () => rids.filter((rid) => subscribedRids.includes(rid)).map((rid) => ({ rid, fname: subscriptionNames[rid] })),
	})),
};

const RoomsMock = {
	findOneById: sinon.stub().callsFake(async (rid: string) => ({ _id: rid, name: `name-of-${rid}`, fname: `name-of-${rid}` })),
};

const VideoConfService = createService({
	models: { VideoConference: VideoConferenceModelMock, Subscriptions: SubscriptionsMock, Rooms: RoomsMock },
});

describe('VideoConfService.listJoinableCalls', () => {
	let service: any;

	before(() => {
		// The service reads settings at construction in some paths; nothing here depends on them.
		service = new VideoConfService();
	});

	beforeEach(() => {
		resetAll(VideoConferenceModelMock.find, SubscriptionsMock.findByUserIdAndRoomIds, RoomsMock.findOneById);
		running = [];
		subscribedRids = [];
		subscriptionNames = {};
	});

	after(() => {
		sinon.restore();
	});

	// The two ways in, and they are the same pair the endpoints authorize with: being a member of the call, or
	// being in the room it belongs to.
	it('offers a call the user is a member of, even with no subscription to its room', async () => {
		running = [buildGroupCall([buildMember({ _id: 'other' }), buildMember({ _id: me, joined: false, joinedAt: undefined })])];

		const calls = await service.listJoinableCalls(me);

		expect(calls.map(({ callId }: { callId: string }) => callId)).to.deep.equal(['call1']);
	});

	it('offers a call in a room the user is in, even without membership of the call', async () => {
		running = [buildGroupCall([buildMember({ _id: 'other' })], { rid: 'channel' })];
		subscribedRids = ['channel'];

		const calls = await service.listJoinableCalls(me);

		expect(calls.map(({ callId }: { callId: string }) => callId)).to.deep.equal(['call1']);
	});

	// A public channel is readable by anyone, so room *access* would put calls from channels the user never joined
	// in their sidebar. Being in the room is the line.
	it('does not offer a call the user has no claim to', async () => {
		running = [buildGroupCall([buildMember({ _id: 'other' })], { rid: 'somewhere-else' })];

		const calls = await service.listJoinableCalls(me);

		expect(calls).to.deep.equal([]);
	});

	it('follows the chat into a discussion when that is the room the user is in', async () => {
		running = [buildGroupCall([buildMember({ _id: 'other' })], { rid: 'parent', discussionRid: 'the-discussion' })];
		subscribedRids = ['the-discussion'];

		const calls = await service.listJoinableCalls(me);

		expect(calls).to.have.length(1);
	});

	// A conference only stops when someone ends it or the expiry cron reaches it, so an abandoned one would
	// otherwise be advertised as joinable for a day.
	it('leaves out a call nobody is in', async () => {
		running = [
			buildGroupCall([buildMember({ _id: 'other', leftAt: new Date() })], { rid: 'channel', _id: 'empty' }),
			buildGroupCall([buildMember({ _id: 'other' })], { rid: 'channel', _id: 'occupied' }),
		];
		subscribedRids = ['channel'];

		const calls = await service.listJoinableCalls(me);

		expect(calls.map(({ callId }: { callId: string }) => callId)).to.deep.equal(['occupied']);
	});

	// One query for every room in play, rather than one per call: it answers both whether the user is in the room
	// and what a nameless room should be called.
	it('asks about every room in play at once', async () => {
		running = [
			buildGroupCall([buildMember({ _id: me })], { rid: 'mine', _id: 'a-member-of' }),
			buildGroupCall([buildMember({ _id: 'other' })], { rid: 'channel', _id: 'by-room' }),
		];
		subscribedRids = ['channel'];

		await service.listJoinableCalls(me);

		expect(SubscriptionsMock.findByUserIdAndRoomIds.callCount).to.equal(1);
		const [, rids] = SubscriptionsMock.findByUserIdAndRoomIds.firstCall.args;
		expect(rids).to.deep.equal(['mine', 'channel']);
	});

	it('says nothing when no call is running', async () => {
		const calls = await service.listJoinableCalls(me);

		expect(calls).to.deep.equal([]);
		expect(SubscriptionsMock.findByUserIdAndRoomIds.called).to.be.false;
	});

	describe('what each row says', () => {
		it('counts only the people who are in the call', async () => {
			running = [
				buildGroupCall(
					[
						buildMember({ _id: 'present' }),
						buildMember({ _id: 'gone', leftAt: new Date() }),
						buildMember({ _id: me, joined: false, joinedAt: undefined }),
					],
					{ rid: 'channel' },
				),
			];
			subscribedRids = ['channel'];

			const [call] = await service.listJoinableCalls(me);

			expect(call.usersCount).to.equal(1);
		});

		// Joining another call means leaving this one, so the caller has to be able to tell which one that is.
		it('says whether the user is in it', async () => {
			running = [
				buildGroupCall([buildMember({ _id: me })], { rid: 'channel', _id: 'in-it' }),
				buildGroupCall([buildMember({ _id: 'other' }), buildMember({ _id: me, joined: false, joinedAt: undefined })], {
					rid: 'channel',
					_id: 'not-in-it',
				}),
			];
			subscribedRids = ['channel'];

			const calls = await service.listJoinableCalls(me);

			expect(calls.find(({ callId }: { callId: string }) => callId === 'in-it')?.joined).to.be.true;
			expect(calls.find(({ callId }: { callId: string }) => callId === 'not-in-it')?.joined).to.be.false;
		});

		// The sidebar hides these and the call history keeps them, so the row has to carry the fact either way.
		it('says whether the user declined it', async () => {
			const decliner: IVideoConferenceUser = buildMember({ _id: me, joined: false, joinedAt: undefined, declined: true });
			running = [buildGroupCall([buildMember({ _id: 'other' }), decliner], { rid: 'channel' })];
			subscribedRids = ['channel'];

			const [call] = await service.listJoinableCalls(me);

			expect(call.declined).to.be.true;
		});

		// Faces, not just a number: the row shows who is already in there, and the count is what a "+3" comes from.
		// The list shows faces rather than a number, so a few of the people travel with the call — capped here,
		// because a call in a busy channel would otherwise send a whole roster to draw three avatars.
		it('carries a few of the people in it, and says how many there are altogether', async () => {
			running = [
				buildGroupCall(
					[buildMember({ _id: 'one' }), buildMember({ _id: 'two' }), buildMember({ _id: 'three' }), buildMember({ _id: 'four' })],
					{
						rid: 'channel',
					},
				),
			];
			subscribedRids = ['channel'];

			const [call] = await service.listJoinableCalls(me);

			expect(call.usersCount).to.equal(4);
			expect(call.participants).to.have.length(CALL_FACES_SHOWN);
			expect(call.participants.map(({ _id }: { _id: string }) => _id)).to.deep.equal(['one', 'two']);
			// Enough to draw a face with, and nothing else — a payload is not a place to publish a roster.
			expect(Object.keys(call.participants[0]).sort()).to.deep.equal(['_id', 'name', 'username']);
		});

		// Faces are of the people who are *in* the call, not of everyone invited to it.
		it('carries nobody who is not in the call', async () => {
			running = [
				buildGroupCall([buildMember({ _id: 'here' }), buildMember({ _id: 'invited', joined: false, joinedAt: undefined })], {
					rid: 'channel',
				}),
			];
			subscribedRids = ['channel'];

			const [call] = await service.listJoinableCalls(me);

			expect(call.participants.map(({ _id }: { _id: string }) => _id)).to.deep.equal(['here']);
		});

		it('counts nobody who is not in the call', async () => {
			running = [buildGroupCall([buildMember({ _id: 'present' }), buildMember({ _id: 'gone', leftAt: new Date() })], { rid: 'channel' })];
			subscribedRids = ['channel'];

			const [call] = await service.listJoinableCalls(me);

			expect(call.usersCount).to.equal(1);
		});

		it('names a group conference by its title', async () => {
			running = [buildGroupCall([buildMember({ _id: 'other' })], { rid: 'channel', title: 'Sprint planning' })];
			subscribedRids = ['channel'];

			const [call] = await service.listJoinableCalls(me);

			expect(call.name).to.equal('Sprint planning');
		});

		// A direct message has no name of its own — it is named after the other person, and that name lives on
		// each side's own subscription. Falling back to the room would show a raw id.
		it("names a direct call from the reader's own subscription", async () => {
			running = [buildDirectCall([buildMember({ _id: 'other' })], { rid: 'the-dm' })];
			subscribedRids = ['the-dm'];
			subscriptionNames = { 'the-dm': 'Alice Liddell' };

			const [call] = await service.listJoinableCalls(me);

			expect(call.name).to.equal('Alice Liddell');
		});

		// A member added from outside the room has no subscription to name it from, and the room cannot help: a DM
		// room carries neither `name` nor `fname`, so this used to end at `getRoomName`'s last resort and show the
		// reader a raw room id. Whoever started the call is who they want named.
		it('names a direct call after whoever started it when there is no subscription', async () => {
			running = [
				buildDirectCall([buildMember({ _id: 'other' }), buildMember({ _id: me, joined: false, joinedAt: undefined })], { rid: 'the-dm' }),
			];

			const [call] = await service.listJoinableCalls(me);

			// `buildDirectCall` names the creator "Creator User" — the point is that it is a person, not the room.
			expect(call.name).to.equal('Creator User');
			expect(RoomsMock.findOneById.called, 'no room lookup is needed to name a call after a person').to.be.false;
		});

		// The group case still ends at the room, which is the right answer for a call named after one.
		it('falls back to the room for a group conference with no title', async () => {
			running = [buildGroupCall([buildMember({ _id: 'other' })], { rid: 'channel', title: undefined as unknown as string })];
			subscribedRids = ['channel'];

			const [call] = await service.listJoinableCalls(me);

			expect(call.name).to.equal('name-of-channel');
		});
	});
});
