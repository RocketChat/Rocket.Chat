import { beforeEach, describe, it } from 'node:test';

import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import p from 'proxyquire';
import sinon from 'sinon';

const settingsMock = { get: sinon.stub() };
const licenseMock = { hasModule: sinon.stub() };
const getRoomAbacLockContextMock = sinon.stub();
const abacMock = { filterRoomsAllowedForUser: sinon.stub() };

type Options = { refreshUserAttributes?: boolean; audit?: boolean };

type Patched = (
	next: (rooms: IRoom[], user: IUser, options?: Options) => Promise<IRoom[]>,
	rooms: IRoom[],
	user: IUser,
	options?: Options,
) => Promise<IRoom[]>;

let filterDefaultChannels: Patched;

p.noCallThru().load('./filterDefaultChannelsForUser.ts', {
	'@rocket.chat/core-services': { Abac: abacMock },
	'@rocket.chat/license': { License: licenseMock },
	'../../../../server/lib/authorization/getRoomAbacLockContext': { getRoomAbacLockContext: getRoomAbacLockContextMock },
	'../../../../server/lib/rooms/filterDefaultChannelsForUser': {
		filterDefaultChannelsForUser: {
			patch: (fn: Patched) => {
				filterDefaultChannels = fn;
			},
		},
	},
	'../../../../server/settings': { settings: settingsMock },
});

const publicRoom = { _id: 'c1', t: 'c' } as IRoom;
const privateWithoutAttributes = { _id: 'p1', t: 'p' } as IRoom;
const privateWithAttributes = { _id: 'p2', t: 'p', abacAttributes: [{ key: 'dept', values: ['eng'] }] } as IRoom;
const otherPrivateWithAttributes = { _id: 'p3', t: 'p', abacAttributes: [{ key: 'dept', values: ['ops'] }] } as IRoom;

const user = { _id: 'u1', username: 'user.one' } as IUser;
const ldapUser = { _id: 'u3', username: 'user.three', ldap: true } as IUser;

const lockContext = { enforcementOn: true, requiredAttributeKeys: [] };
const unenforced = { enforcementOn: false, requiredAttributeKeys: [] };

const next = async (rooms: IRoom[], _user?: IUser, _options?: Options): Promise<IRoom[]> => rooms;

const run = (rooms: IRoom[], actor: IUser = user, options: Options = { refreshUserAttributes: true }): Promise<IRoom[]> =>
	filterDefaultChannels(next, rooms, actor, options);

const idsOf = (rooms: IRoom[]): string[] => rooms.map((room) => room._id);

describe('filterDefaultChannelsForUser (ABAC)', () => {
	beforeEach(() => {
		settingsMock.get.reset();
		licenseMock.hasModule.reset();
		getRoomAbacLockContextMock.reset();
		abacMock.filterRoomsAllowedForUser.reset();

		settingsMock.get.withArgs('ABAC_Enabled').returns(true);
		licenseMock.hasModule.withArgs('abac').returns(true);
		getRoomAbacLockContextMock.returns(lockContext);
		abacMock.filterRoomsAllowedForUser.callsFake(async (_uid: string, rooms: IRoom[]) => idsOf(rooms));
	});

	it('should skip attributed private rooms when ABAC is disabled, without calling the service', async () => {
		settingsMock.get.withArgs('ABAC_Enabled').returns(false);

		const rooms = [publicRoom, privateWithoutAttributes, privateWithAttributes];

		expect(idsOf(await run(rooms))).to.deep.equal(['c1', 'p1']);
		expect(abacMock.filterRoomsAllowedForUser.called).to.be.false;
	});

	it('should skip attributed private rooms without the abac license module, without calling the service', async () => {
		licenseMock.hasModule.withArgs('abac').returns(false);

		expect(idsOf(await run([publicRoom, privateWithAttributes]))).to.deep.equal(['c1']);
		expect(abacMock.filterRoomsAllowedForUser.called).to.be.false;
	});

	it('should skip the rooms enforcement locks, resolving the workspace policy once', async () => {
		expect(idsOf(await run([publicRoom, privateWithoutAttributes, privateWithAttributes]))).to.deep.equal(['p2']);
		expect(getRoomAbacLockContextMock.calledOnce).to.be.true;
	});

	it('should not call the service when no remaining room carries attributes', async () => {
		getRoomAbacLockContextMock.returns(unenforced);

		expect(idsOf(await run([publicRoom, privateWithoutAttributes]))).to.deep.equal(['c1', 'p1']);
		expect(abacMock.filterRoomsAllowedForUser.called).to.be.false;
	});

	it('should ask the service to refresh the attributes of an LDAP user when the caller asks for it', async () => {
		await run([privateWithAttributes], ldapUser);

		expect(abacMock.filterRoomsAllowedForUser.calledOnceWith('u3', [privateWithAttributes])).to.be.true;
		expect(abacMock.filterRoomsAllowedForUser.firstCall.args[2]?.refreshAttributes).to.be.true;
	});

	it('should not refresh the attributes of a user who is not from LDAP, even when the caller asks for it', async () => {
		expect(idsOf(await run([privateWithAttributes]))).to.deep.equal(['p2']);
		expect(abacMock.filterRoomsAllowedForUser.calledOnce).to.be.true;
		expect(abacMock.filterRoomsAllowedForUser.firstCall.args[2]?.refreshAttributes).to.not.be.true;
	});

	it('should evaluate without refreshing the attributes unless the caller asks for it', async () => {
		expect(idsOf(await run([privateWithAttributes], user, {}))).to.deep.equal(['p2']);
		expect(abacMock.filterRoomsAllowedForUser.calledOnce).to.be.true;
		expect(abacMock.filterRoomsAllowedForUser.firstCall.args[2]?.refreshAttributes).to.not.be.true;
	});

	it('should hand the audit option on to the service', async () => {
		await run([privateWithAttributes], user, { audit: false });

		expect(abacMock.filterRoomsAllowedForUser.firstCall.args[2]?.audit).to.equal(false);
	});

	it('should hand the options on to the next filter', async () => {
		const nextSpy = sinon.spy(next);
		const options = { refreshUserAttributes: true };

		await filterDefaultChannels(nextSpy, [privateWithAttributes], user, options);

		expect(nextSpy.calledOnceWith([privateWithAttributes], user, options)).to.be.true;
	});

	it('should skip attributed rooms for a user without a username, without calling the service', async () => {
		getRoomAbacLockContextMock.returns(unenforced);

		const rooms = [privateWithoutAttributes, privateWithAttributes];

		expect(idsOf(await run(rooms, { _id: 'u2' } as IUser))).to.deep.equal(['p1']);
		expect(abacMock.filterRoomsAllowedForUser.called).to.be.false;
	});

	it('should send only the attributed rooms in one call, keeping the plain and allowed ones in input order', async () => {
		getRoomAbacLockContextMock.returns(unenforced);
		abacMock.filterRoomsAllowedForUser.resolves(['p3']);

		const rooms = [privateWithAttributes, privateWithoutAttributes, otherPrivateWithAttributes];

		expect(idsOf(await run(rooms))).to.deep.equal(['p1', 'p3']);
		expect(abacMock.filterRoomsAllowedForUser.calledOnce).to.be.true;
		expect(abacMock.filterRoomsAllowedForUser.firstCall.args[1]).to.deep.equal([privateWithAttributes, otherPrivateWithAttributes]);
	});

	it('should not send the rooms enforcement locks to the PDP', async () => {
		await run([publicRoom, privateWithoutAttributes, privateWithAttributes]);

		expect(abacMock.filterRoomsAllowedForUser.firstCall.args[1]).to.deep.equal([privateWithAttributes]);
	});
});
