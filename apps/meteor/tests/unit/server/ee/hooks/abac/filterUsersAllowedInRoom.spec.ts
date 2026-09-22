import type { IRoom } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import p from 'proxyquire';
import sinon from 'sinon';

import type { AbacEvaluableUser } from '../../../../../../server/lib/rooms/filterUsersAllowedInRoom';

const settingsMock = { get: sinon.stub() };
const licenseMock = { hasModule: sinon.stub() };
const getRoomAbacLockContextMock = sinon.stub();
const isUserAllowedInRoomMock = sinon.stub();

const filterInSlices = async <T>(items: T[], allowed: (item: T) => Promise<boolean>): Promise<T[]> => {
	const kept: T[] = [];

	for await (const item of items) {
		if (await allowed(item)) {
			kept.push(item);
		}
	}

	return kept;
};

type Patched = (
	next: (users: AbacEvaluableUser[], room: IRoom) => Promise<AbacEvaluableUser[]>,
	users: AbacEvaluableUser[],
	room: IRoom,
) => Promise<AbacEvaluableUser[]>;

let filterUsers: Patched;

p.noCallThru().load('../../../../../../ee/server/hooks/abac/filterUsersAllowedInRoom.ts', {
	'@rocket.chat/license': { License: licenseMock },
	'../../../../server/lib/authorization/getRoomAbacLockContext': { getRoomAbacLockContext: getRoomAbacLockContextMock },
	'../../../../server/lib/rooms/filterUsersAllowedInRoom': {
		filterUsersAllowedInRoom: {
			patch: (fn: Patched) => {
				filterUsers = fn;
			},
		},
	},
	'../../../../server/settings': { settings: settingsMock },
	'../../lib/abac/isUserAllowedInRoom': { filterInSlices, isUserAllowedInRoom: isUserAllowedInRoomMock },
});

const room = { _id: 'p1', t: 'p', abacAttributes: [{ key: 'dept', values: ['eng'] }] } as IRoom;

const users: AbacEvaluableUser[] = [
	{ _id: 'u1', username: 'user.one' },
	{ _id: 'u2', username: 'user.two' },
];

const next = async (subjects: AbacEvaluableUser[]): Promise<AbacEvaluableUser[]> => subjects;

const run = (subjects: AbacEvaluableUser[] = users): Promise<AbacEvaluableUser[]> => filterUsers(next, subjects, room);

const idsOf = (subjects: AbacEvaluableUser[]): string[] => subjects.map((subject) => subject._id);

describe('filterUsersAllowedInRoom (ABAC)', () => {
	beforeEach(() => {
		settingsMock.get.reset();
		licenseMock.hasModule.reset();
		getRoomAbacLockContextMock.reset();
		isUserAllowedInRoomMock.reset();

		settingsMock.get.withArgs('ABAC_Enabled').returns(true);
		licenseMock.hasModule.withArgs('abac').returns(true);
		getRoomAbacLockContextMock.returns({ enforcementOn: true, requiredAttributeKeys: [] });
		isUserAllowedInRoomMock.resolves(true);
	});

	it('should leave the users untouched when ABAC is disabled', async () => {
		settingsMock.get.withArgs('ABAC_Enabled').returns(false);

		expect(idsOf(await run())).to.deep.equal(['u1', 'u2']);
		expect(isUserAllowedInRoomMock.called).to.be.false;
	});

	it('should leave the users untouched without the abac license module', async () => {
		licenseMock.hasModule.withArgs('abac').returns(false);

		expect(idsOf(await run())).to.deep.equal(['u1', 'u2']);
		expect(isUserAllowedInRoomMock.called).to.be.false;
	});

	it('should leave out the users the membership rule refuses', async () => {
		isUserAllowedInRoomMock.callsFake(async (user: AbacEvaluableUser) => user._id !== 'u2');

		expect(idsOf(await run())).to.deep.equal(['u1']);
	});

	it('should evaluate every user against the same room', async () => {
		await run();

		expect(isUserAllowedInRoomMock.callCount).to.equal(2);
		expect(isUserAllowedInRoomMock.alwaysCalledWith(sinon.match.any, room)).to.be.true;
	});

	it('should not evaluate an empty list', async () => {
		expect(await run([])).to.deep.equal([]);
		expect(getRoomAbacLockContextMock.called).to.be.false;
	});
});
