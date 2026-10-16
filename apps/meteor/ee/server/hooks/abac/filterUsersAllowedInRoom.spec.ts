import type { IRoom } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import p from 'proxyquire';
import sinon from 'sinon';

import type { AbacEvaluableUser } from '../../../../server/lib/rooms/filterUsersAllowedInRoom';

const settingsMock = { get: sinon.stub() };
const licenseMock = { hasModule: sinon.stub() };
const abacMock = { filterUsersAllowedInRoom: sinon.stub(), evaluateUsersAllowedInRoom: sinon.stub() };
const getRoomAbacLockContextMock = sinon.stub();

type Options = { audit?: boolean };

type Patched = (
	next: (users: AbacEvaluableUser[], room: IRoom, options?: Options) => Promise<AbacEvaluableUser[]>,
	users: AbacEvaluableUser[],
	room: IRoom,
	options?: Options,
) => Promise<AbacEvaluableUser[]>;

let filterUsers: Patched;
let filterUsersOrThrow: Patched;

p.noCallThru().load('./filterUsersAllowedInRoom.ts', {
	'@rocket.chat/core-services': { Abac: abacMock },
	'@rocket.chat/license': { License: licenseMock },
	'../../../../server/lib/authorization/getRoomAbacLockContext': { getRoomAbacLockContext: getRoomAbacLockContextMock },
	'../../../../server/lib/rooms/filterUsersAllowedInRoom': {
		filterUsersAllowedInRoom: {
			patch: (fn: Patched) => {
				filterUsers = fn;
			},
		},
		filterUsersAllowedInRoomOrThrow: {
			patch: (fn: Patched) => {
				filterUsersOrThrow = fn;
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
const unenforced = { enforcementOn: false, requiredAttributeKeys: [] };

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

		settingsMock.get.withArgs('ABAC_Enabled').returns(true);
		licenseMock.hasModule.withArgs('abac').returns(true);
		getRoomAbacLockContextMock.returns(lockContext);
		abacMock.filterUsersAllowedInRoom.callsFake(async (ids: string[]) => ids);
	});

	it('should refuse every user for an attributed private room when ABAC is disabled, without asking the PDP', async () => {
		settingsMock.get.withArgs('ABAC_Enabled').returns(false);

		expect(await run()).to.deep.equal([]);
		expect(abacMock.filterUsersAllowedInRoom.called).to.be.false;
	});

	it('should refuse every user for an attributed private room without the abac license module, without asking the PDP', async () => {
		licenseMock.hasModule.withArgs('abac').returns(false);

		expect(await run()).to.deep.equal([]);
		expect(abacMock.filterUsersAllowedInRoom.called).to.be.false;
	});

	it('should admit every user to a room without attributes when ABAC is disabled', async () => {
		settingsMock.get.withArgs('ABAC_Enabled').returns(false);

		expect(idsOf(await run(users, { _id: 'p2', t: 'p' } as IRoom))).to.deep.equal(['u1', 'u2']);
		expect(getRoomAbacLockContextMock.called).to.be.false;
	});

	it('should refuse every user for a locked room without asking the PDP', async () => {
		expect(await run(users, { _id: 'p3', t: 'p' } as IRoom)).to.deep.equal([]);
		expect(abacMock.filterUsersAllowedInRoom.called).to.be.false;
	});

	it('should admit every user to a room without attributes when enforcement is off, without asking the PDP', async () => {
		getRoomAbacLockContextMock.returns(unenforced);

		expect(idsOf(await run(users, { _id: 'p2', t: 'p' } as IRoom))).to.deep.equal(['u1', 'u2']);
		expect(abacMock.filterUsersAllowedInRoom.called).to.be.false;
	});

	it('should evaluate every user in one call and keep only the ones it allows', async () => {
		abacMock.filterUsersAllowedInRoom.resolves(['u2']);

		expect(idsOf(await run())).to.deep.equal(['u2']);
		expect(abacMock.filterUsersAllowedInRoom.calledOnceWith(['u1', 'u2'], room)).to.be.true;
	});

	it('should hand the audit option on to the service', async () => {
		await filterUsers(next, users, room, { audit: false });

		expect(abacMock.filterUsersAllowedInRoom.firstCall.args[2]).to.deep.equal({ audit: false });
	});

	it('should not evaluate an empty list', async () => {
		expect(await run([])).to.deep.equal([]);
		expect(getRoomAbacLockContextMock.called).to.be.false;
	});
});

describe('filterUsersAllowedInRoomOrThrow (ABAC)', () => {
	const runOrThrow = (subjects: AbacEvaluableUser[] = users, target: IRoom = room): Promise<AbacEvaluableUser[]> =>
		filterUsersOrThrow(next, subjects, target);

	beforeEach(() => {
		settingsMock.get.reset();
		licenseMock.hasModule.reset();
		abacMock.evaluateUsersAllowedInRoom.reset();
		getRoomAbacLockContextMock.reset();

		settingsMock.get.withArgs('ABAC_Enabled').returns(true);
		licenseMock.hasModule.withArgs('abac').returns(true);
		getRoomAbacLockContextMock.returns(lockContext);
		abacMock.evaluateUsersAllowedInRoom.callsFake(async (ids: string[]) => ({ allowed: true, userIds: ids }));
	});

	it('should leave the users untouched when ABAC is disabled', async () => {
		settingsMock.get.withArgs('ABAC_Enabled').returns(false);

		expect(idsOf(await runOrThrow())).to.deep.equal(['u1', 'u2']);
		expect(abacMock.evaluateUsersAllowedInRoom.called).to.be.false;
	});

	it('should refuse a locked room with error-abac-room-locked without asking the PDP', async () => {
		await expect(runOrThrow(users, { _id: 'p3', t: 'p' } as IRoom)).to.be.rejectedWith('error-abac-room-locked');
		expect(abacMock.evaluateUsersAllowedInRoom.called).to.be.false;
	});

	it('should admit every user to a room without attributes when enforcement is off, without asking the PDP', async () => {
		getRoomAbacLockContextMock.returns(unenforced);

		expect(idsOf(await runOrThrow(users, { _id: 'p2', t: 'p' } as IRoom))).to.deep.equal(['u1', 'u2']);
		expect(abacMock.evaluateUsersAllowedInRoom.called).to.be.false;
	});

	it('should keep only the users the PDP allows, refusing a user without a username', async () => {
		abacMock.evaluateUsersAllowedInRoom.resolves({ allowed: true, userIds: ['u2'] });

		expect(idsOf(await runOrThrow([...users, { _id: 'u3' }]))).to.deep.equal(['u2']);
		expect(abacMock.evaluateUsersAllowedInRoom.calledOnceWith(['u1', 'u2'], room, { audit: false })).to.be.true;
	});

	it('should refuse with error-abac-decision-unavailable when the PDP gives no decision', async () => {
		abacMock.evaluateUsersAllowedInRoom.resolves({ allowed: false, reason: 'unavailable', code: 'error-pdp-unavailable' });

		const error = await runOrThrow().catch((err) => err);
		expect(error).to.include({ error: 'error-abac-decision-unavailable' });
		expect(error.details).to.deep.equal({ cause: 'error-pdp-unavailable' });
	});
});
