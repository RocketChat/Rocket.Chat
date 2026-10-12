import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

type Room = { _id: string; uids?: string[] };
type User = { _id: string; username: string; name: string };
type Sub = { '_id': string; 'u._id'?: string; 'u': { _id: string } };

const asyncIterable = <T>(items: T[]) => ({
	async *[Symbol.asyncIterator]() {
		for (const item of items) {
			yield item;
		}
	},
	async forEach(fn: (item: T) => void) {
		items.forEach(fn);
	},
});

const stubs = {
	countGroupDMsByUids: sinon.stub(),
	findGroupDMsByUids: sinon.stub(),
	findByIds: sinon.stub(),
	findByRoomId: sinon.stub(),
	updateNameAndFnameById: sinon.stub(),
	notifyOnSubscriptionChangedByRoomId: sinon.stub(),
};

const { updateGroupDMsName } = proxyquire.noCallThru().load('../../../../../server/lib/rooms/updateGroupDMsName', {
	'@rocket.chat/core-typings': {
		isNotUndefined: <T>(value: T | undefined): value is T => value !== undefined,
	},
	'@rocket.chat/models': {
		Rooms: {
			countGroupDMsByUids: stubs.countGroupDMsByUids,
			findGroupDMsByUids: stubs.findGroupDMsByUids,
		},
		Subscriptions: {
			findByRoomId: stubs.findByRoomId,
			updateNameAndFnameById: stubs.updateNameAndFnameById,
		},
		Users: {
			findByIds: stubs.findByIds,
		},
	},
	'../notifyListener': {
		notifyOnSubscriptionChangedByRoomId: stubs.notifyOnSubscriptionChangedByRoomId,
	},
});

const alice: User = { _id: 'alice', username: 'alice', name: 'Alice' };
const bob: User = { _id: 'bob', username: 'bob', name: 'Bob' };
const carol: User = { _id: 'carol', username: 'carol', name: 'Carol' };

const setup = (rooms: Room[], users: User[], subsByRoom: Record<string, Sub[]>) => {
	stubs.countGroupDMsByUids.resolves(rooms.length);
	stubs.findGroupDMsByUids.callsFake(() => asyncIterable(rooms));
	stubs.findByIds.returns({ toArray: async () => users });
	stubs.findByRoomId.callsFake((rid: string) => asyncIterable(subsByRoom[rid] || []));
	stubs.updateNameAndFnameById.resolves({ modifiedCount: 1 });
};

const sub = (_id: string, uid: string): Sub => ({ _id, u: { _id: uid } });

describe('updateGroupDMsName', () => {
	beforeEach(() => {
		Object.values(stubs).forEach((stub) => stub.reset());
	});

	it('should update the names of all subscriptions of a group DM', async () => {
		setup([{ _id: 'room1', uids: ['alice', 'bob', 'carol'] }], [bob, carol], {
			room1: [sub('s-alice', 'alice'), sub('s-bob', 'bob'), sub('s-carol', 'carol')],
		});

		await updateGroupDMsName(alice);

		expect(stubs.updateNameAndFnameById.callCount).to.equal(3);
		expect(stubs.updateNameAndFnameById.calledWith('s-bob', 'alice,carol', 'Alice, Carol')).to.be.true;
	});

	it('should skip group DMs that resolve to two members or fewer (e.g. after a member was deleted)', async () => {
		// carol was deleted: she is no longer in uids, but the room is still selected as a group DM
		setup([{ _id: 'room1', uids: ['alice', 'bob'] }], [bob], {
			room1: [sub('s-alice', 'alice'), sub('s-bob', 'bob')],
		});

		await updateGroupDMsName(alice);

		expect(stubs.updateNameAndFnameById.called).to.be.false;
	});

	it('should skip group DMs whose members cannot be resolved anymore', async () => {
		// carol is still in uids but no longer exists in the users collection
		setup([{ _id: 'room1', uids: ['alice', 'bob', 'carol'] }], [bob], {
			room1: [sub('s-alice', 'alice'), sub('s-bob', 'bob')],
		});

		await updateGroupDMsName(alice);

		expect(stubs.updateNameAndFnameById.called).to.be.false;
	});
});
