import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import sinon from 'sinon';

import { createService, resetAll } from './testHarness';

const findOneById = sinon.stub();
const usersFindOneById = sinon.stub();
const roomsFindOneById = sinon.stub();
const findByRoomIdWhenUsernameExists = sinon.stub();
const createRoom = sinon.stub();
const setDiscussionRidById = sinon.stub().resolves();
const findByRoomId = sinon.stub();
const addUsersToRoomMethod = sinon.stub().resolves();

/** Subscriptions keyed by room, so a test can give two rooms different members. */
let membersByRoom: Record<string, string[]> = {};

const resolveChatAccessMode = sinon.stub().callsFake(({ mode }: { mode: string }) => mode);

const user = { _id: 'user1', name: 'User One', username: 'user.one' };

const VideoConfService = createService({
	models: {
		VideoConference: { findOneById, setDiscussionRidById },
		Users: { findOneById: usersFindOneById, find: sinon.stub().returns({ toArray: sinon.stub().resolves([]) }) },
		Rooms: { findOneById: roomsFindOneById },
		Subscriptions: {
			findByRoomIdWhenUsernameExists,
			findByRoomId,
			findByRoomIdAndNotUserId: sinon.stub().returns({ toArray: sinon.stub().resolves([]) }),
		},
	},
	overrides: {
		'../../../lib/videoConference/chatAccess': { resolveChatAccessMode },
		'../../lib/rooms/createRoom': { createRoom },
		'../../meteor-methods/rooms/addUsersToRoom': { addUsersToRoomMethod },
		'../../settings': {
			settings: {
				get: (key: string) => (key === 'VideoConf_Persistent_Chat_Discussion_Name' ? '[date] Video Call Chat' : true),
			},
		},
		'../../../app/authorization/server/functions/hasPermission': { hasAtLeastOnePermissionAsync: async () => true },
	},
});

describe('VideoConfService chat sharing', () => {
	let service: any;

	beforeEach(() => {
		service = new VideoConfService();

		const stubs = [
			findOneById,
			usersFindOneById,
			roomsFindOneById,
			findByRoomIdWhenUsernameExists,
			createRoom,
			setDiscussionRidById,
			findByRoomId,
			addUsersToRoomMethod,
			resolveChatAccessMode,
		];
		resetAll(...stubs);
		stubs.forEach((stub) => stub.resetBehavior());

		membersByRoom = {};
		findByRoomIdWhenUsernameExists.callsFake((rid: string) => ({
			toArray: async () => (membersByRoom[rid] ?? []).map((username) => ({ u: { username } })),
		}));
		findByRoomId.returns({ toArray: sinon.stub().resolves([]) });
		usersFindOneById.resolves(user);
		createRoom.resolves({ _id: 'newDiscussion' });
		// `assignDiscussionToConference` reads the room it was just handed back, to check it is real.
		roomsFindOneById.withArgs('newDiscussion').resolves({ _id: 'newDiscussion' });
		setDiscussionRidById.resolves();
		addUsersToRoomMethod.resolves();
		resolveChatAccessMode.callsFake(({ mode }: { mode: string }) => mode);
	});

	describe('createConferenceDiscussionWithParticipants', () => {
		// A second fork builds off the discussion, which is right — but somebody who joined the room the call
		// started in since the first fork is part of the conversation, and reading only the discussion drops them.
		it('should carry the original room members across a second fork', async () => {
			findOneById.resolves({ _id: 'call1', rid: 'room1', discussionRid: 'discussion1', users: [], messages: {} });
			roomsFindOneById.withArgs('discussion1').resolves({ _id: 'discussion1', t: 'p', prid: 'room1' });
			roomsFindOneById.withArgs('room1').resolves({ _id: 'room1', t: 'c' });
			membersByRoom = { discussion1: ['in.discussion'], room1: ['joined.room.later'] };

			await service.createConferenceDiscussionWithParticipants('user1', 'call1', ['newcomer']);

			expect(createRoom.firstCall.args[3]).to.have.members(['joined.room.later', 'in.discussion', 'newcomer']);
		});

		// Nothing to carry across when the chat has not moved yet: the base room *is* the original room.
		it('should read the room only once on a first fork', async () => {
			findOneById.resolves({ _id: 'call1', rid: 'room1', users: [], messages: {} });
			roomsFindOneById.withArgs('room1').resolves({ _id: 'room1', t: 'c' });
			membersByRoom = { room1: ['already.here'] };

			await service.createConferenceDiscussionWithParticipants('user1', 'call1', ['newcomer']);

			expect(createRoom.firstCall.args[3]).to.have.members(['already.here', 'newcomer']);
			expect(findByRoomIdWhenUsernameExists.callCount).to.equal(1);
		});

		// A DM lists its members on the room rather than in subscriptions.
		it('should take a DM’s members from the room itself', async () => {
			findOneById.resolves({ _id: 'call1', rid: 'dm1', users: [], messages: {} });
			roomsFindOneById.withArgs('dm1').resolves({ _id: 'dm1', t: 'd', usernames: ['one', 'two'] });

			await service.createConferenceDiscussionWithParticipants('user1', 'call1', ['newcomer']);

			expect(createRoom.firstCall.args[3]).to.have.members(['one', 'two', 'newcomer']);
		});
	});

	describe('shareChatWithMembers', () => {
		const withAccess = (membersWithoutAccess: string[], usernamesWithoutAccess: string[]) => {
			findOneById.resolves({ _id: 'call1', rid: 'room1', users: [] });
			roomsFindOneById.withArgs('room1').resolves({ _id: 'room1', t: 'c', fname: 'Room One' });
			sinon.stub(service, 'resolveChatAccess').resolves({
				access: { rid: 'room1', name: 'Room One', type: 'c', membersWithoutAccess, canInvite: true },
				usernamesWithoutAccess,
			});
		};

		it('should invite the members who cannot read the chat when told nothing else', async () => {
			withAccess(['user9'], ['locked.out']);

			await service.shareChatWithMembers('user1', 'call1', 'invite');

			expect(addUsersToRoomMethod.firstCall.args[1].users).to.deep.equal(['locked.out']);
		});

		it('should do nothing when everyone can already read the chat', async () => {
			withAccess([], []);

			const rid = await service.shareChatWithMembers('user1', 'call1', 'invite');

			expect(rid).to.equal('room1');
			expect(addUsersToRoomMethod.called).to.be.false;
		});

		// Named outright, these are people being brought in rather than members who cannot read the chat.
		it('should share with the people it was given instead of working them out', async () => {
			withAccess(['user9'], ['locked.out']);

			await service.shareChatWithMembers('user1', 'call1', 'invite', ['someone.new']);

			expect(addUsersToRoomMethod.firstCall.args[1].users).to.deep.equal(['someone.new']);
		});

		// Bringing somebody in is not conditional on an existing member being locked out.
		it('should share with the people it was given even when nobody is locked out', async () => {
			withAccess([], []);

			await service.shareChatWithMembers('user1', 'call1', 'invite', ['someone.new']);

			expect(addUsersToRoomMethod.firstCall.args[1].users).to.deep.equal(['someone.new']);
		});

		it('should refuse a mode the room cannot do, whoever was named', async () => {
			withAccess([], []);
			resolveChatAccessMode.returns(null);

			await expect(service.shareChatWithMembers('user1', 'call1', 'invite', ['someone.new'])).to.be.rejectedWith('error-not-allowed');
		});
	});
});
