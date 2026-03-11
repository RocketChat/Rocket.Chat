import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import mock from 'proxyquire';
import Sinon from 'sinon';

type RoomType = 'c' | 'p' | 'd' | 'l';

interface IUser {
	_id: string;
	username: string;
	federated?: boolean;
	federation?: any;
}

interface IRoom {
	_id: string;
	t: RoomType;
	name?: string;
}

type GetRoomByNameOrIdWithOptionToJoinFn = (params: {
	user: Pick<IUser, '_id' | 'username' | 'federated' | 'federation'>;
	nameOrId: string;
	type?: RoomType;
	tryDirectByUserIdOnly?: boolean;
	joinChannel?: boolean;
	errorOnEmpty?: boolean;
}) => Promise<IRoom | null>;

describe.only('getRoomByNameOrIdWithOptionToJoin', () => {
	let RoomsStub: {
		findOneByIdOrName: Sinon.SinonStub;
		findOneDirectRoomContainingAllUserIDs: Sinon.SinonStub;
		findOneById: Sinon.SinonStub;
	};
	let SubscriptionsStub: {
		findOneByRoomIdAndUserId: Sinon.SinonStub;
	};
	let UsersStub: {
		findOneById: Sinon.SinonStub;
		findOne: Sinon.SinonStub;
	};
	let RoomServiceStub: {
		join: Sinon.SinonStub;
	};
	let MeteorStub: {
		Meteor: {
			Error: Sinon.SinonStub;
		};
	};
	let createDirectMessageStub: Sinon.SinonStub;

	let getRoomByNameOrIdWithOptionToJoin: GetRoomByNameOrIdWithOptionToJoinFn;

	const baseUser: IUser = {
		_id: 'userId',
		username: 'user',
	};

	const makeStubs = () => {
		RoomsStub = {
			findOneByIdOrName: Sinon.stub(),
			findOneDirectRoomContainingAllUserIDs: Sinon.stub(),
			findOneById: Sinon.stub(),
		};

		SubscriptionsStub = {
			findOneByRoomIdAndUserId: Sinon.stub(),
		};

		UsersStub = {
			findOneById: Sinon.stub(),
			findOne: Sinon.stub(),
		};

		RoomServiceStub = {
			join: Sinon.stub().resolves(),
		};

		MeteorStub = {
			Meteor: {
				Error: Sinon.stub().callsFake(function (this: any, code: string) {
					this.error = code;
					this.errorType = 'Meteor.Error';
				} as any),
			},
		};

		createDirectMessageStub = Sinon.stub().resolves({ rid: 'newDirectRoomId' });
	};

	beforeEach(() => {
		makeStubs();

		const mod = mock.noCallThru().load('../../../../../../../meteor/app/lib/server/functions/getRoomByNameOrIdWithOptionToJoin.ts', {
			'@rocket.chat/models': {
				Rooms: RoomsStub,
				Subscriptions: SubscriptionsStub,
				Users: UsersStub,
			},
			'@rocket.chat/core-services': {
				Room: RoomServiceStub,
			},
			'../../../../lib/utils/isObject': {
				isObject(obj: unknown) {
					return obj !== null && typeof obj === 'object';
				},
			},
			'../../../../server/methods/createDirectMessage': {
				createDirectMessage: createDirectMessageStub,
			},
			'meteor/meteor': MeteorStub,
		}) as any;

		getRoomByNameOrIdWithOptionToJoin = mod.getRoomByNameOrIdWithOptionToJoin as GetRoomByNameOrIdWithOptionToJoinFn;
	});

	afterEach(() => {
		Sinon.restore();
	});

	describe('channel / group resolution', () => {
		it('should strip leading # and lookup by id or name', async () => {
			const room: IRoom = { _id: 'room1', t: 'c', name: 'general' };
			RoomsStub.findOneByIdOrName.resolves(room);
			SubscriptionsStub.findOneByRoomIdAndUserId.resolves(null);

			const result = await getRoomByNameOrIdWithOptionToJoin({
				user: baseUser,
				nameOrId: '#general',
				type: undefined,
				tryDirectByUserIdOnly: false,
				joinChannel: false,
				errorOnEmpty: true,
			});

			Sinon.assert.calledOnceWithExactly(RoomsStub.findOneByIdOrName, 'general');
			expect(result).to.equal(room);
		});

		it('should treat name without # as channel/group and call findOneByIdOrName', async () => {
			const room: IRoom = { _id: 'room2', t: 'c', name: 'random' };
			RoomsStub.findOneByIdOrName.resolves(room);
			SubscriptionsStub.findOneByRoomIdAndUserId.resolves(null);

			const result = await getRoomByNameOrIdWithOptionToJoin({
				user: baseUser,
				nameOrId: 'random',
				type: undefined,
				tryDirectByUserIdOnly: false,
				joinChannel: false,
				errorOnEmpty: true,
			});

			Sinon.assert.calledOnceWithExactly(RoomsStub.findOneByIdOrName, 'random');
			expect(result).to.equal(room);
		});

		it('should throw Meteor.Error("invalid-channel") when channel not found and errorOnEmpty=true', async () => {
			RoomsStub.findOneByIdOrName.resolves(null);

			let caught: any;
			try {
				await getRoomByNameOrIdWithOptionToJoin({
					user: baseUser,
					nameOrId: 'nonexistent',
					type: undefined,
					tryDirectByUserIdOnly: false,
					joinChannel: false,
					errorOnEmpty: true,
				});
			} catch (e) {
				caught = e;
			}

			expect(caught).to.be.an('object');
			expect(caught.error).to.equal('invalid-channel');
		});

		it('should return null when channel not found and errorOnEmpty=false', async () => {
			RoomsStub.findOneByIdOrName.resolves(null);

			const result = await getRoomByNameOrIdWithOptionToJoin({
				user: baseUser,
				nameOrId: 'nonexistent',
				type: undefined,
				tryDirectByUserIdOnly: false,
				joinChannel: false,
				errorOnEmpty: false,
			});

			expect(result).to.equal(null);
		});
	});

	describe('type filtering', () => {
		it('should return room when type matches', async () => {
			const room: IRoom = { _id: 'room3', t: 'c', name: 'dev' };
			RoomsStub.findOneByIdOrName.resolves(room);
			SubscriptionsStub.findOneByRoomIdAndUserId.resolves(null);

			const result = await getRoomByNameOrIdWithOptionToJoin({
				user: baseUser,
				nameOrId: 'dev',
				type: 'c',
				tryDirectByUserIdOnly: false,
				joinChannel: false,
				errorOnEmpty: true,
			});

			expect(result).to.equal(room);
		});

		it('should throw Meteor.Error when type does not match and errorOnEmpty=true', async () => {
			const room: IRoom = { _id: 'room4', t: 'p', name: 'private' };
			RoomsStub.findOneByIdOrName.resolves(room);
			SubscriptionsStub.findOneByRoomIdAndUserId.resolves(null);

			let caught: any;
			try {
				await getRoomByNameOrIdWithOptionToJoin({
					user: baseUser,
					nameOrId: 'private',
					type: 'c',
					tryDirectByUserIdOnly: false,
					joinChannel: false,
					errorOnEmpty: true,
				});
			} catch (e) {
				caught = e;
			}

			expect(caught).to.be.an('object');
			expect(caught.error).to.equal('invalid-channel');
		});

		it('should return null when type does not match and errorOnEmpty=false', async () => {
			const room: IRoom = { _id: 'room5', t: 'p', name: 'private' };
			RoomsStub.findOneByIdOrName.resolves(room);
			SubscriptionsStub.findOneByRoomIdAndUserId.resolves(null);

			const result = await getRoomByNameOrIdWithOptionToJoin({
				user: baseUser,
				nameOrId: 'private',
				type: 'c',
				tryDirectByUserIdOnly: false,
				joinChannel: false,
				errorOnEmpty: false,
			});

			expect(result).to.equal(null);
		});
	});

	describe('joining channel behaviour', () => {
		it('should call Room.join when room is channel, joinChannel=true, and user not subscribed', async () => {
			const room: IRoom = { _id: 'room6', t: 'c', name: 'joinable' };
			RoomsStub.findOneByIdOrName.resolves(room);
			SubscriptionsStub.findOneByRoomIdAndUserId.resolves(null);

			const result = await getRoomByNameOrIdWithOptionToJoin({
				user: baseUser,
				nameOrId: 'joinable',
				type: 'c',
				tryDirectByUserIdOnly: false,
				joinChannel: true,
				errorOnEmpty: true,
			});

			Sinon.assert.calledOnceWithExactly(SubscriptionsStub.findOneByRoomIdAndUserId, 'room6', baseUser._id);
			Sinon.assert.calledOnceWithExactly(RoomServiceStub.join, {
				room,
				user: baseUser,
			});
			expect(result).to.equal(room);
		});

		it('should not call Room.join when joinChannel=false', async () => {
			const room: IRoom = { _id: 'room7', t: 'c', name: 'nojoin' };
			RoomsStub.findOneByIdOrName.resolves(room);
			SubscriptionsStub.findOneByRoomIdAndUserId.resolves(null);

			const result = await getRoomByNameOrIdWithOptionToJoin({
				user: baseUser,
				nameOrId: 'nojoin',
				type: 'c',
				tryDirectByUserIdOnly: false,
				joinChannel: false,
				errorOnEmpty: true,
			});

			Sinon.assert.calledOnceWithExactly(SubscriptionsStub.findOneByRoomIdAndUserId, 'room7', baseUser._id);
			Sinon.assert.notCalled(RoomServiceStub.join);
			expect(result).to.equal(room);
		});

		it('should not call Room.join when room type is not channel', async () => {
			const room: IRoom = { _id: 'room8', t: 'p', name: 'private' };
			RoomsStub.findOneByIdOrName.resolves(room);
			SubscriptionsStub.findOneByRoomIdAndUserId.resolves(null);

			const result = await getRoomByNameOrIdWithOptionToJoin({
				user: baseUser,
				nameOrId: 'private',
				type: 'p',
				tryDirectByUserIdOnly: false,
				joinChannel: true,
				errorOnEmpty: true,
			});

			Sinon.assert.calledOnceWithExactly(SubscriptionsStub.findOneByRoomIdAndUserId, 'room8', baseUser._id);
			Sinon.assert.notCalled(RoomServiceStub.join);
			expect(result).to.equal(room);
		});

		it('should not call Room.join when user already subscribed', async () => {
			const room: IRoom = { _id: 'room9', t: 'c', name: 'joined' };
			RoomsStub.findOneByIdOrName.resolves(room);
			SubscriptionsStub.findOneByRoomIdAndUserId.resolves({ _id: 'subId' });

			const result = await getRoomByNameOrIdWithOptionToJoin({
				user: baseUser,
				nameOrId: 'joined',
				type: 'c',
				tryDirectByUserIdOnly: false,
				joinChannel: true,
				errorOnEmpty: true,
			});

			Sinon.assert.calledOnceWithExactly(SubscriptionsStub.findOneByRoomIdAndUserId, 'room9', baseUser._id);
			Sinon.assert.notCalled(RoomServiceStub.join);
			expect(result).to.equal(room);
		});
	});

	describe('direct message resolution by username', () => {
		it('should find direct room with existing roomUser and existing DM room', async () => {
			const otherUser: IUser = { _id: 'otherId', username: 'other' };

			UsersStub.findOne.resolves(otherUser);
			const dmRoom: IRoom = { _id: 'dm1', t: 'd' };
			RoomsStub.findOneDirectRoomContainingAllUserIDs.resolves(dmRoom);

			const result = await getRoomByNameOrIdWithOptionToJoin({
				user: baseUser,
				nameOrId: '@other',
				type: 'd',
				tryDirectByUserIdOnly: false,
				joinChannel: true,
				errorOnEmpty: true,
			});

			Sinon.assert.calledOnceWithExactly(UsersStub.findOne, {
				$or: [{ _id: 'other' }, { username: 'other' }],
			});
			Sinon.assert.calledOnce(RoomsStub.findOneDirectRoomContainingAllUserIDs);
			const callArgs = RoomsStub.findOneDirectRoomContainingAllUserIDs.getCall(0).args[0];
			expect(callArgs).to.be.an('array');
			expect(callArgs.sort()).to.deep.equal(['otherId', 'userId'].sort());
			expect(result).to.equal(dmRoom);
		});

		it('should strip leading @ when resolving DM', async () => {
			const otherUser: IUser = { _id: 'otherId2', username: 'other2' };
			UsersStub.findOne.resolves(otherUser);
			const dmRoom: IRoom = { _id: 'dm2', t: 'd' };
			RoomsStub.findOneDirectRoomContainingAllUserIDs.resolves(dmRoom);

			const result = await getRoomByNameOrIdWithOptionToJoin({
				user: baseUser,
				nameOrId: '@other2',
				type: undefined,
				tryDirectByUserIdOnly: false,
				joinChannel: true,
				errorOnEmpty: true,
			});

			Sinon.assert.calledOnceWithExactly(UsersStub.findOne, {
				$or: [{ _id: 'other2' }, { username: 'other2' }],
			});
			expect(result).to.equal(dmRoom);
		});

		it('should treat nameOrId as DM when type is d even without @', async () => {
			const otherUser: IUser = { _id: 'otherId3', username: 'plain' };
			UsersStub.findOne.resolves(otherUser);
			const dmRoom: IRoom = { _id: 'dm3', t: 'd' };
			RoomsStub.findOneDirectRoomContainingAllUserIDs.resolves(dmRoom);

			const result = await getRoomByNameOrIdWithOptionToJoin({
				user: baseUser,
				nameOrId: 'plain',
				type: 'd',
				tryDirectByUserIdOnly: false,
				joinChannel: true,
				errorOnEmpty: true,
			});

			Sinon.assert.calledOnceWithExactly(UsersStub.findOne, {
				$or: [{ _id: 'plain' }, { username: 'plain' }],
			});
			expect(result).to.equal(dmRoom);
		});
	});

	describe('direct message resolution with tryDirectByUserIdOnly', () => {
		it('should lookup user by id only when tryDirectByUserIdOnly=true', async () => {
			const otherUser: IUser = { _id: 'idOnly', username: 'ignored' };
			UsersStub.findOneById.resolves(otherUser);
			const dmRoom: IRoom = { _id: 'dm4', t: 'd' };
			RoomsStub.findOneDirectRoomContainingAllUserIDs.resolves(dmRoom);

			const result = await getRoomByNameOrIdWithOptionToJoin({
				user: baseUser,
				nameOrId: 'idOnly',
				type: 'd',
				tryDirectByUserIdOnly: true,
				joinChannel: true,
				errorOnEmpty: true,
			});

			Sinon.assert.calledOnceWithExactly(UsersStub.findOneById, 'idOnly');
			Sinon.assert.notCalled(UsersStub.findOne);
			expect(result).to.equal(dmRoom);
		});

		it('should fallback to Rooms.findOneById when roomUser is falsy but room exists by id', async () => {
			UsersStub.findOneById.resolves(null);
			const dmRoom: IRoom = { _id: 'idRoom', t: 'd' };
			RoomsStub.findOneById.resolves(dmRoom);

			const result = await getRoomByNameOrIdWithOptionToJoin({
				user: baseUser,
				nameOrId: 'idRoom',
				type: 'd',
				tryDirectByUserIdOnly: true,
				joinChannel: true,
				errorOnEmpty: true,
			});

			Sinon.assert.calledOnceWithExactly(RoomsStub.findOneById, 'idRoom');
			expect(result).to.equal(dmRoom);
		});
	});

	describe('direct message creation when roomUser exists but room does not', () => {
		it('should throw Meteor.Error when roomUser not found and errorOnEmpty=true', async () => {
			UsersStub.findOne.resolves(null);
			RoomsStub.findOneById.resolves(null);
			RoomsStub.findOneDirectRoomContainingAllUserIDs.resolves(null);

			let caught: any;
			try {
				await getRoomByNameOrIdWithOptionToJoin({
					user: baseUser,
					nameOrId: '@missing',
					type: 'd',
					tryDirectByUserIdOnly: false,
					joinChannel: true,
					errorOnEmpty: true,
				});
			} catch (e) {
				caught = e;
			}

			expect(caught).to.be.an('object');
			expect(caught.error).to.equal('invalid-channel');
			Sinon.assert.notCalled(createDirectMessageStub);
		});

		it('should return null when roomUser not found and errorOnEmpty=false', async () => {
			UsersStub.findOne.resolves(null);
			RoomsStub.findOneById.resolves(null);
			RoomsStub.findOneDirectRoomContainingAllUserIDs.resolves(null);

			const result = await getRoomByNameOrIdWithOptionToJoin({
				user: baseUser,
				nameOrId: '@missing',
				type: 'd',
				tryDirectByUserIdOnly: false,
				joinChannel: true,
				errorOnEmpty: false,
			});

			expect(result).to.equal(null);
			Sinon.assert.notCalled(createDirectMessageStub);
		});

		it('should create a new direct message when roomUser exists and room is not found', async () => {
			const otherUser: IUser = { _id: 'otherCreate', username: 'createMe' };
			UsersStub.findOne.resolves(otherUser);
			RoomsStub.findOneDirectRoomContainingAllUserIDs.resolves(null);
			RoomsStub.findOneById.resolves({ _id: 'newDirectRoomId', t: 'd' });

			const result = await getRoomByNameOrIdWithOptionToJoin({
				user: baseUser,
				nameOrId: '@createMe',
				type: 'd',
				tryDirectByUserIdOnly: false,
				joinChannel: true,
				errorOnEmpty: true,
			});

			Sinon.assert.calledOnceWithExactly(createDirectMessageStub, ['createMe'], baseUser._id);
			Sinon.assert.calledWith(RoomsStub.findOneById, 'newDirectRoomId');
			expect(result).to.deep.equal({ _id: 'newDirectRoomId', t: 'd' });
		});
	});
});
