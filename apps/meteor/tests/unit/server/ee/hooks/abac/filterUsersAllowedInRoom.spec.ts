import type { IRoom } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import p from 'proxyquire';
import sinon from 'sinon';

import type { AbacEvaluableUser } from '../../../../../../server/lib/rooms/filterUsersAllowedInRoom';

const settingsMock = { get: sinon.stub() };
const licenseMock = { hasModule: sinon.stub() };
const abacMock = { filterUsersAllowedInRoom: sinon.stub() };
const getRoomAbacLockContextMock = sinon.stub();
const isRoomAbacLockedMock = sinon.stub();

type Patched = (
	next: (users: AbacEvaluableUser[], room: IRoom) => Promise<AbacEvaluableUser[]>,
	users: AbacEvaluableUser[],
	room: IRoom,
) => Promise<AbacEvaluableUser[]>;

let filterUsers: Patched;

p.noCallThru().load('../../../../../../ee/server/hooks/abac/filterUsersAllowedInRoom.ts', {
	'@rocket.chat/core-services': { Abac: abacMock },
	'@rocket.chat/license': { License: licenseMock },
	'../../../../lib/rooms/isRoomAbacLocked': { isRoomAbacLocked: isRoomAbacLockedMock },
	'../../../../server/lib/authorization/getRoomAbacLockContext': { getRoomAbacLockContext: getRoomAbacLockContextMock },
	'../../../../server/lib/rooms/filterUsersAllowedInRoom': {
		filterUsersAllowedInRoom: {
			patch: (fn: Patched) => {
				filterUsers = fn;
			},
		},
	},
	'../../../../server/settings': { settings: settingsMock },
});

const room = { _id: 'p1', t: 'p', abacAttributes: [{ key: 'dept', values: ['eng'] }] } as IRoom;

const users: AbacEvaluableUser[] = [
	{ _id: 'u1', username: 'user.one' },
	{ _id: 'u2', username: 'user.two' },
];

const lockContext = { enforcementOn: true, requiredAttributeKeys: [] };

const next = async (subjects: AbacEvaluableUser[]): Promise<AbacEvaluableUser[]> => subjects;

const run = (subjects: AbacEvaluableUser[] = users, target: IRoom = room): Promise<AbacEvaluableUser[]> =>
	filterUsers(next, subjects, target);

const idsOf = (subjects: AbacEvaluableUser[]): string[] => subjects.map((subject) => subject._id);

describe('filterUsersAllowedInRoom (ABAC)', () => {
	beforeEach(() => {
		settingsMock.get.reset();
		licenseMock.hasModule.reset();
		abacMock.filterUsersAllowedInRoom.reset();
		getRoomAbacLockContextMock.reset();
		isRoomAbacLockedMock.reset();

		settingsMock.get.withArgs('ABAC_Enabled').returns(true);
		licenseMock.hasModule.withArgs('abac').returns(true);
		getRoomAbacLockContextMock.returns(lockContext);
		isRoomAbacLockedMock.returns(false);
		abacMock.filterUsersAllowedInRoom.callsFake(async (ids: string[]) => ids);
	});

	it('should leave the users untouched when ABAC is disabled', async () => {
		settingsMock.get.withArgs('ABAC_Enabled').returns(false);

		expect(idsOf(await run())).to.deep.equal(['u1', 'u2']);
		expect(abacMock.filterUsersAllowedInRoom.called).to.be.false;
	});

	it('should leave the users untouched without the abac license module', async () => {
		licenseMock.hasModule.withArgs('abac').returns(false);

		expect(idsOf(await run())).to.deep.equal(['u1', 'u2']);
		expect(abacMock.filterUsersAllowedInRoom.called).to.be.false;
	});

	it('should refuse every user for a locked room without asking the PDP', async () => {
		isRoomAbacLockedMock.returns(true);

		expect(await run()).to.deep.equal([]);
		expect(isRoomAbacLockedMock.calledOnceWith(room, lockContext)).to.be.true;
		expect(abacMock.filterUsersAllowedInRoom.called).to.be.false;
	});

	it('should admit every user to an unlocked room without attributes without asking the PDP', async () => {
		expect(idsOf(await run(users, { _id: 'p2', t: 'p' } as IRoom))).to.deep.equal(['u1', 'u2']);
		expect(abacMock.filterUsersAllowedInRoom.called).to.be.false;
	});

	it('should evaluate every user in one call and keep only the ones it allows', async () => {
		abacMock.filterUsersAllowedInRoom.resolves(['u2']);

		expect(idsOf(await run())).to.deep.equal(['u2']);
		expect(abacMock.filterUsersAllowedInRoom.calledOnceWith(['u1', 'u2'], room)).to.be.true;
	});

	it('should refuse a user without a username without sending them to the PDP', async () => {
		expect(idsOf(await run([...users, { _id: 'u3' }]))).to.deep.equal(['u1', 'u2']);
		expect(abacMock.filterUsersAllowedInRoom.firstCall.args[0]).to.deep.equal(['u1', 'u2']);
	});

	it('should not evaluate an empty list', async () => {
		expect(await run([])).to.deep.equal([]);
		expect(getRoomAbacLockContextMock.called).to.be.false;
	});
});
