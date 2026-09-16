import type { IRoom, VideoConference } from '@rocket.chat/core-typings';
import { registerModel } from '@rocket.chat/models';
import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const sandbox = sinon.createSandbox();

const canAccessRoomMock = sandbox.stub();
const canReadRoomMock = sandbox.stub();

const roomsModel = { findOneById: sandbox.stub(), findByIds: sandbox.stub() };

registerModel('IRoomsModel', roomsModel as any);

const { Authorization } = proxyquire.noCallThru().load('../../../../../server/services/authorization/service.ts', {
	'./canAccessRoom': { canAccessRoom: canAccessRoomMock },
	'./canReadRoom': { canReadRoom: canReadRoomMock },
	'./canAccessRoomLivechat': {},
	'../../../app/authorization/lib/AuthorizationUtils': {
		AuthorizationUtils: { addRolePermissionWhiteList: sandbox.stub(), isPermissionRestrictedForRoleList: sandbox.stub().returns(false) },
	},
});

type Call = Pick<VideoConference, 'rid' | 'discussionRid' | 'users'>;

const user = { _id: 'user-id', username: 'john.doe', roles: ['user'] };

const room = (_id: IRoom['_id']): Pick<IRoom, '_id' | 't'> => ({ _id, t: 'c' });

const cursorOf = (rooms: unknown[]) => ({ toArray: sandbox.stub().resolves(rooms) });

describe('Authorization service', () => {
	let service: any;

	beforeEach(() => {
		sandbox.reset();
		canAccessRoomMock.resolves(true);
		service = new Authorization();
	});

	describe('canAccessRoomIds', () => {
		it('should return true when every room is accessible', async () => {
			roomsModel.findByIds.returns(cursorOf([room('rid-1'), room('rid-2')]));

			expect(await service.canAccessRoomIds(['rid-1', 'rid-2'], user)).to.be.true;
			expect(canAccessRoomMock.callCount).to.equal(2);
		});

		it('should return false when a single room is not accessible', async () => {
			roomsModel.findByIds.returns(cursorOf([room('rid-1'), room('rid-2')]));
			canAccessRoomMock.withArgs(sinon.match({ _id: 'rid-2' })).resolves(false);

			expect(await service.canAccessRoomIds(['rid-1', 'rid-2'], user)).to.be.false;
		});

		it('should forward the given user to each room check', async () => {
			roomsModel.findByIds.returns(cursorOf([room('rid-1')]));

			await service.canAccessRoomIds(['rid-1'], user);

			expect(canAccessRoomMock.calledOnceWith(sinon.match({ _id: 'rid-1' }), user)).to.be.true;
		});

		it('should deduplicate the given ids before querying', async () => {
			roomsModel.findByIds.returns(cursorOf([room('rid-1')]));

			expect(await service.canAccessRoomIds(['rid-1', 'rid-1', 'rid-1'], user)).to.be.true;
			expect(roomsModel.findByIds.calledOnce).to.be.true;
			expect(roomsModel.findByIds.firstCall.args[0]).to.deep.equal(['rid-1']);
			expect(canAccessRoomMock.callCount).to.equal(1);
		});

		it('should return false when the list is empty', async () => {
			expect(await service.canAccessRoomIds([], user)).to.be.false;
			expect(roomsModel.findByIds.notCalled).to.be.true;
		});

		it('should return false when no user is given', async () => {
			expect(await service.canAccessRoomIds(['rid-1'], undefined)).to.be.false;
			expect(roomsModel.findByIds.notCalled).to.be.true;
		});

		it('should return false when any id does not resolve to a room', async () => {
			roomsModel.findByIds.returns(cursorOf([room('rid-1')]));

			expect(await service.canAccessRoomIds(['rid-1', 'does-not-exist'], user)).to.be.false;
			expect(canAccessRoomMock.notCalled).to.be.true;
		});

		it('should query only the attributes the room access validators need', async () => {
			roomsModel.findByIds.returns(cursorOf([room('rid-1')]));

			await service.canAccessRoomIds(['rid-1'], user);

			expect(roomsModel.findByIds.firstCall.args[1]).to.deep.equal({
				projection: { _id: 1, t: 1, teamId: 1, prid: 1, abacAttributes: 1 },
			});
		});
	});

	describe('canAccessConference', () => {
		const callWith = (memberIds: string[], overrides: Partial<Call> = {}): Call =>
			({
				rid: 'rid-1',
				users: memberIds.map((_id) => ({ _id })),
				...overrides,
			}) as Call;

		beforeEach(() => {
			roomsModel.findOneById.callsFake(async (rid: IRoom['_id']) => room(rid));
			canAccessRoomMock.resolves(false);
		});

		// The regression: someone added to a DM call from outside has no subscription to the DM, so checking the room
		// instead of the membership refused them their own call.
		it('should admit a member who has no access to the call’s room', async () => {
			expect(await service.canAccessConference(callWith(['dm-one', 'dm-two', 'added']), 'added')).to.be.true;
			expect(roomsModel.findOneById.called, 'membership settles it without asking about the room').to.be.false;
		});

		it('should admit someone who can see the room the call started in', async () => {
			canAccessRoomMock.withArgs(sinon.match({ _id: 'rid-1' }), sinon.match({ _id: 'onlooker' })).resolves(true);

			expect(await service.canAccessConference(callWith(['host']), 'onlooker')).to.be.true;
		});

		// A conference's chat can move to a discussion whose members cannot see the parent room, so it is its own way in.
		it('should admit someone who can see the discussion the chat moved to', async () => {
			canAccessRoomMock.withArgs(sinon.match({ _id: 'discussion-1' }), sinon.match({ _id: 'discussion-member' })).resolves(true);

			expect(await service.canAccessConference(callWith(['host'], { discussionRid: 'discussion-1' }), 'discussion-member')).to.be.true;
		});

		it('should refuse a stranger', async () => {
			expect(await service.canAccessConference(callWith(['host']), 'stranger')).to.be.false;
		});

		it('should refuse anyone not signed in', async () => {
			expect(await service.canAccessConference(callWith(['host']), undefined)).to.be.false;
			expect(roomsModel.findOneById.notCalled).to.be.true;
		});
	});
});
