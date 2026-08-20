import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import proxyquire from 'proxyquire';
import Sinon from 'sinon';

const RoomsStub = {
	findByTypeAndNameOrId: Sinon.stub(),
	findOneDirectRoomContainingAllUserIDs: Sinon.stub(),
};

const UsersStub = {
	findOneById: Sinon.stub(),
	findUsersByUsernames: Sinon.stub(),
};

const { findDirectRoomByIdentifier } = proxyquire.noCallThru().load('../../../../../server/lib/rooms/findDirectRoomByIdentifier.ts', {
	'@rocket.chat/models': { Rooms: RoomsStub, Users: UsersStub },
});

const cursorOf = (docs: unknown[]) => ({ toArray: async () => docs });

describe('findDirectRoomByIdentifier', () => {
	beforeEach(() => {
		RoomsStub.findByTypeAndNameOrId.reset();
		RoomsStub.findOneDirectRoomContainingAllUserIDs.reset();
		UsersStub.findOneById.reset();
		UsersStub.findUsersByUsernames.reset();

		RoomsStub.findByTypeAndNameOrId.resolves(null);
		UsersStub.findOneById.resolves({ _id: 'me', username: 'me' });
	});

	it('should return the room when the identifier is a room id', async () => {
		const room = { _id: 'rid1', t: 'd' };
		RoomsStub.findByTypeAndNameOrId.resolves(room);

		expect(await findDirectRoomByIdentifier('rid1', 'me')).to.equal(room);
		expect(UsersStub.findUsersByUsernames.called).to.be.false;
	});

	it('should resolve a two-person DM by the other username, over sorted uids', async () => {
		const room = { _id: 'rid1', t: 'd' };
		UsersStub.findUsersByUsernames.returns(cursorOf([{ _id: 'zeta' }, { _id: 'alpha' }]));
		RoomsStub.findOneDirectRoomContainingAllUserIDs.resolves(room);

		expect(await findDirectRoomByIdentifier('alice', 'me')).to.equal(room);
		expect(RoomsStub.findOneDirectRoomContainingAllUserIDs.calledWith(['alpha', 'zeta'])).to.be.true;
	});

	it('should include the caller in the member set exactly once for a self-DM', async () => {
		UsersStub.findUsersByUsernames.returns(cursorOf([{ _id: 'me' }]));
		RoomsStub.findOneDirectRoomContainingAllUserIDs.resolves({ _id: 'self', t: 'd' });

		await findDirectRoomByIdentifier('me', 'me');

		expect(UsersStub.findUsersByUsernames.firstCall.args[0]).to.deep.equal(['me']);
		expect(RoomsStub.findOneDirectRoomContainingAllUserIDs.calledWith(['me'])).to.be.true;
	});

	it('should resolve a group DM from a comma-separated identifier', async () => {
		UsersStub.findUsersByUsernames.returns(cursorOf([{ _id: 'me' }, { _id: 'a' }, { _id: 'b' }]));
		RoomsStub.findOneDirectRoomContainingAllUserIDs.resolves({ _id: 'group', t: 'd' });

		await findDirectRoomByIdentifier('a,b', 'me');

		expect(UsersStub.findUsersByUsernames.firstCall.args[0]).to.deep.equal(['me', 'a', 'b']);
		expect(RoomsStub.findOneDirectRoomContainingAllUserIDs.calledWith(['a', 'b', 'me'])).to.be.true;
	});

	it('should not look the identifier up as a room id when it is a username list', async () => {
		UsersStub.findUsersByUsernames.returns(cursorOf([{ _id: 'me' }, { _id: 'a' }, { _id: 'b' }]));
		RoomsStub.findOneDirectRoomContainingAllUserIDs.resolves({ _id: 'group', t: 'd' });

		await findDirectRoomByIdentifier('a,b', 'me');

		expect(RoomsStub.findByTypeAndNameOrId.called).to.be.false;
	});

	it('should trim whitespace around each username in the list', async () => {
		UsersStub.findUsersByUsernames.returns(cursorOf([{ _id: 'me' }, { _id: 'a' }, { _id: 'b' }]));
		RoomsStub.findOneDirectRoomContainingAllUserIDs.resolves({ _id: 'group', t: 'd' });

		await findDirectRoomByIdentifier('a, b', 'me');

		expect(UsersStub.findUsersByUsernames.firstCall.args[0]).to.deep.equal(['me', 'a', 'b']);
	});

	it('should return null when any username does not resolve to a user', async () => {
		UsersStub.findUsersByUsernames.returns(cursorOf([{ _id: 'me' }]));

		expect(await findDirectRoomByIdentifier('ghost', 'me')).to.be.null;
		expect(RoomsStub.findOneDirectRoomContainingAllUserIDs.called).to.be.false;
	});

	it('should return null when no direct room contains that member set', async () => {
		UsersStub.findUsersByUsernames.returns(cursorOf([{ _id: 'me' }, { _id: 'alice' }]));
		RoomsStub.findOneDirectRoomContainingAllUserIDs.resolves(null);

		expect(await findDirectRoomByIdentifier('alice', 'me')).to.be.null;
	});

	it('should return null when the caller has no username', async () => {
		UsersStub.findOneById.resolves({ _id: 'me' });

		expect(await findDirectRoomByIdentifier('alice', 'me')).to.be.null;
	});
});
