import type { IRoom } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import p from 'proxyquire';
import sinon from 'sinon';

import type { RoomAbacLockContext } from '../../../../../../lib/rooms/isRoomAbacLocked';
import type { AbacEvaluableUser } from '../../../../../../server/lib/rooms/filterUsersAllowedInRoom';

const abacMock = { checkUsernamesMatchAttributes: sinon.stub() };
const loggerMock = { info: sinon.stub(), warn: sinon.stub(), error: sinon.stub(), debug: sinon.stub() };
const isRoomAbacLockedMock = sinon.stub();

const { isUserAllowedInRoom, filterInSlices } = p.noCallThru().load('../../../../../../ee/server/lib/abac/isUserAllowedInRoom.ts', {
	'@rocket.chat/core-services': { Abac: abacMock },
	'@rocket.chat/logger': { Logger: sinon.stub().returns(loggerMock) },
	'../../../../lib/rooms/isRoomAbacLocked': { isRoomAbacLocked: isRoomAbacLockedMock },
}) as {
	isUserAllowedInRoom: (user: AbacEvaluableUser, room: IRoom, lockContext: RoomAbacLockContext) => Promise<boolean>;
	filterInSlices: <T>(items: T[], allowed: (item: T) => Promise<boolean>) => Promise<T[]>;
};

const attributes = [{ key: 'dept', values: ['eng'] }];

const plainRoom = { _id: 'p1', t: 'p' } as IRoom;
const attributedRoom = { _id: 'p2', t: 'p', abacAttributes: attributes } as IRoom;

const user: AbacEvaluableUser = { _id: 'u1', username: 'user.one' };

const lockContext: RoomAbacLockContext = { enforcementOn: true, requiredAttributeKeys: [] };

describe('isUserAllowedInRoom (ABAC)', () => {
	beforeEach(() => {
		abacMock.checkUsernamesMatchAttributes.reset();
		isRoomAbacLockedMock.reset();
		loggerMock.info.reset();

		abacMock.checkUsernamesMatchAttributes.resolves();
		isRoomAbacLockedMock.returns(false);
	});

	it('should refuse a locked room without asking the PDP', async () => {
		isRoomAbacLockedMock.returns(true);

		expect(await isUserAllowedInRoom(user, attributedRoom, lockContext)).to.be.false;
		expect(abacMock.checkUsernamesMatchAttributes.called).to.be.false;
	});

	it('should allow an unlocked room carrying no attributes without asking the PDP', async () => {
		expect(await isUserAllowedInRoom(user, plainRoom, lockContext)).to.be.true;
		expect(abacMock.checkUsernamesMatchAttributes.called).to.be.false;
	});

	it('should refuse an attributed room to a user without a username', async () => {
		expect(await isUserAllowedInRoom({ _id: 'u2' }, attributedRoom, lockContext)).to.be.false;
		expect(abacMock.checkUsernamesMatchAttributes.called).to.be.false;
	});

	it('should allow an attributed room the PDP clears', async () => {
		expect(await isUserAllowedInRoom(user, attributedRoom, lockContext)).to.be.true;
		expect(abacMock.checkUsernamesMatchAttributes.calledOnceWith(['user.one'], attributes, attributedRoom)).to.be.true;
	});

	it('should refuse an attributed room the PDP rejects, and log it', async () => {
		abacMock.checkUsernamesMatchAttributes.rejects(new Error('error-abac-user-not-compliant'));

		expect(await isUserAllowedInRoom(user, attributedRoom, lockContext)).to.be.false;
		expect(loggerMock.info.calledOnce).to.be.true;
	});
});

describe('filterInSlices', () => {
	it('should keep only what the predicate allows', async () => {
		const kept = await filterInSlices([1, 2, 3, 4], async (value: number) => value % 2 === 0);

		expect(kept).to.deep.equal([2, 4]);
	});

	it('should evaluate every item when there are more of them than one slice', async () => {
		const items = Array.from({ length: 12 }, (_, index) => index);
		const seen: number[] = [];

		const kept = await filterInSlices(items, async (value: number) => {
			seen.push(value);
			return true;
		});

		expect(kept).to.deep.equal(items);
		expect(seen).to.have.lengthOf(12);
	});
});
