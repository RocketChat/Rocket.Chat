import type { IVideoConferenceUser, VideoConference } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, beforeEach, describe, it } from 'mocha';
import sinon from 'sinon';

import { buildDirectCall, buildGroupCall, buildMember, createService, resetAll } from './testHarness';

const me = 'me';

let running: VideoConference[] = [];
let subscribedRids: string[] = [];
let subscriptionNames: Record<string, string | undefined> = {};

const VideoConferenceModelMock = {
	find: sinon.stub().callsFake(() => ({ toArray: async () => running.map((call) => ({ ...call, users: [...call.users] })) })),
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
		it('carries a few of the people in it', async () => {
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
			expect(call.participants).to.have.length(3);
			expect(call.participants[0]).to.have.keys(['_id', 'username', 'name']);
		});

		it('carries nobody who is not in the call', async () => {
			running = [buildGroupCall([buildMember({ _id: 'present' }), buildMember({ _id: 'gone', leftAt: new Date() })], { rid: 'channel' })];
			subscribedRids = ['channel'];

			const [call] = await service.listJoinableCalls(me);

			expect(call.participants.map(({ _id }: { _id: string }) => _id)).to.deep.equal(['present']);
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

		// A member added from outside the room has no subscription to name it from.
		it('falls back to the room when there is no subscription to name it from', async () => {
			running = [
				buildDirectCall([buildMember({ _id: 'other' }), buildMember({ _id: me, joined: false, joinedAt: undefined })], { rid: 'the-dm' }),
			];

			const [call] = await service.listJoinableCalls(me);

			expect(call.name).to.equal('name-of-the-dm');
		});
	});
});
