import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import p from 'proxyquire';
import sinon from 'sinon';

const settingsMock = { get: sinon.stub() };
const licenseMock = { hasModule: sinon.stub() };
const abacMock = { checkUsernamesMatchAttributes: sinon.stub() };
const ldapMock = { syncUsersAbacAttributesByIds: sinon.stub() };
const getRoomAbacLockContextMock = sinon.stub();
const loggerMock = { info: sinon.stub(), warn: sinon.stub(), error: sinon.stub(), debug: sinon.stub() };

type Patched = (next: (rooms: IRoom[], user: IUser) => Promise<IRoom[]>, rooms: IRoom[], user: IUser) => Promise<IRoom[]>;

let filterDefaultChannels: Patched;

p.noCallThru().load('../../../../../../ee/server/hooks/abac/filterDefaultChannelsForUser.ts', {
	'@rocket.chat/core-services': { Abac: abacMock, LDAPEnterprise: ldapMock },
	'@rocket.chat/license': { License: licenseMock },
	'@rocket.chat/logger': { Logger: sinon.stub().returns(loggerMock) },
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

const user = { _id: 'u1', username: 'user.one' } as IUser;

const next = async (rooms: IRoom[]): Promise<IRoom[]> => rooms;

const run = (rooms: IRoom[], actor: IUser = user): Promise<IRoom[]> => filterDefaultChannels(next, rooms, actor);

const idsOf = (rooms: IRoom[]): string[] => rooms.map((room) => room._id);

describe('filterDefaultChannelsForUser (ABAC)', () => {
	beforeEach(() => {
		settingsMock.get.reset();
		licenseMock.hasModule.reset();
		abacMock.checkUsernamesMatchAttributes.reset();
		ldapMock.syncUsersAbacAttributesByIds.reset();
		getRoomAbacLockContextMock.reset();
		loggerMock.info.reset();
		loggerMock.error.reset();

		settingsMock.get.withArgs('ABAC_Enabled').returns(true);
		licenseMock.hasModule.withArgs('abac').returns(true);
		getRoomAbacLockContextMock.returns({ enforcementOn: true, requiredAttributeKeys: [] });
		abacMock.checkUsernamesMatchAttributes.resolves();
		ldapMock.syncUsersAbacAttributesByIds.resolves();
	});

	it('should leave the rooms untouched when ABAC is disabled', async () => {
		settingsMock.get.withArgs('ABAC_Enabled').returns(false);

		const rooms = [publicRoom, privateWithoutAttributes, privateWithAttributes];

		expect(idsOf(await run(rooms))).to.deep.equal(['c1', 'p1', 'p2']);
		expect(ldapMock.syncUsersAbacAttributesByIds.called).to.be.false;
	});

	it('should leave the rooms untouched without the abac license module', async () => {
		licenseMock.hasModule.withArgs('abac').returns(false);

		expect(idsOf(await run([publicRoom, privateWithAttributes]))).to.deep.equal(['c1', 'p2']);
	});

	it('should skip the rooms enforcement locks', async () => {
		expect(idsOf(await run([publicRoom, privateWithoutAttributes, privateWithAttributes]))).to.deep.equal(['p2']);
	});

	it('should not sync attributes when no remaining room carries any', async () => {
		expect(idsOf(await run([publicRoom, privateWithoutAttributes]))).to.deep.equal([]);
		expect(ldapMock.syncUsersAbacAttributesByIds.called).to.be.false;
	});

	it('should refresh the attributes once before evaluating', async () => {
		await run([privateWithAttributes]);

		expect(ldapMock.syncUsersAbacAttributesByIds.calledOnceWith(['u1'])).to.be.true;
	});

	it('should keep evaluating when the attribute refresh fails', async () => {
		ldapMock.syncUsersAbacAttributesByIds.rejects(new Error('service-unavailable'));

		expect(idsOf(await run([privateWithAttributes]))).to.deep.equal(['p2']);
		expect(loggerMock.error.calledOnce).to.be.true;
	});

	it('should skip a room whose attributes the user does not carry', async () => {
		abacMock.checkUsernamesMatchAttributes.rejects(new Error('error-abac-user-not-compliant'));

		expect(idsOf(await run([privateWithAttributes]))).to.deep.equal([]);
		expect(loggerMock.info.calledOnce).to.be.true;
	});

	it('should keep a room whose attributes the user carries', async () => {
		expect(idsOf(await run([privateWithAttributes]))).to.deep.equal(['p2']);
		expect(abacMock.checkUsernamesMatchAttributes.calledOnceWith(['user.one'], privateWithAttributes.abacAttributes, privateWithAttributes))
			.to.be.true;
	});

	it('should skip attributed rooms for a user without a username, and not sync', async () => {
		getRoomAbacLockContextMock.returns({ enforcementOn: false, requiredAttributeKeys: [] });

		const rooms = [publicRoom, privateWithAttributes];

		expect(idsOf(await run(rooms, { _id: 'u2' } as IUser))).to.deep.equal(['c1']);
		expect(ldapMock.syncUsersAbacAttributesByIds.called).to.be.false;
	});

	it('should evaluate every room when there are more of them than one slice', async () => {
		const many = Array.from({ length: 12 }, (_, index) => ({ ...privateWithAttributes, _id: `p${index}` }) as IRoom);

		expect(idsOf(await run(many))).to.deep.equal(many.map((room) => room._id));
		expect(abacMock.checkUsernamesMatchAttributes.callCount).to.equal(12);
	});

	it('should still gate attributed rooms when enforcement is off', async () => {
		getRoomAbacLockContextMock.returns({ enforcementOn: false, requiredAttributeKeys: [] });
		abacMock.checkUsernamesMatchAttributes.rejects(new Error('error-abac-user-not-compliant'));

		expect(idsOf(await run([publicRoom, privateWithoutAttributes, privateWithAttributes]))).to.deep.equal(['c1', 'p1']);
	});
});
