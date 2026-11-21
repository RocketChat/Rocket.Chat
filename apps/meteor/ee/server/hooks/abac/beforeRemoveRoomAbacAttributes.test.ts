import { before, beforeEach, describe, it, mock } from 'node:test';

import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import sinon from 'sinon';

type Room = Pick<IRoom, '_id' | 'abacAttributes'>;
type Actor = Pick<IUser, '_id' | 'username' | 'name'>;
type Guard = (prev: (room: Room, actor: Actor) => Promise<void>, room: Room, actor: Actor) => Promise<void>;

const licenseMock = { hasModule: sinon.stub() };
const hasAllPermissionAsyncMock = sinon.stub();
const hasPermissionAsyncMock = sinon.stub();
const getRoomAbacLockContextMock = sinon.stub();

let guard: Guard;

before(async () => {
	const moduleMocks = [
		mock.module('@rocket.chat/license', { exports: { License: licenseMock } }),
		mock.module('../../../../server/hooks/rooms/beforeRemoveRoomAbacAttributes', {
			exports: {
				beforeRemoveRoomAbacAttributes: {
					patch: (fn: Guard) => {
						guard = fn;
					},
				},
			},
		}),
		mock.module('../../../../server/lib/authorization/getRoomAbacLockContext', {
			exports: { getRoomAbacLockContext: getRoomAbacLockContextMock },
		}),
		mock.module('../../../../server/lib/authorization/hasPermission', {
			exports: {
				hasAllPermissionAsync: hasAllPermissionAsyncMock,
				hasPermissionAsync: hasPermissionAsyncMock,
			},
		}),
	];
	await import('./beforeRemoveRoomAbacAttributes');
	moduleMocks.forEach((moduleMock) => moduleMock.restore());
});

const room: Room = { _id: 'rid', abacAttributes: [{ key: 'clearance', values: ['TS'] }] };
const actor: Actor = { _id: 'uid', username: 'owner', name: 'Owner' };

const run = () => guard(async () => undefined, room, actor);

describe('beforeRemoveRoomAbacAttributes (ABAC)', () => {
	beforeEach(() => {
		licenseMock.hasModule.reset();
		hasAllPermissionAsyncMock.reset();
		hasPermissionAsyncMock.reset();
		getRoomAbacLockContextMock.reset();

		licenseMock.hasModule.withArgs('abac').returns(true);
		hasAllPermissionAsyncMock.resolves(false);
		hasPermissionAsyncMock.resolves(true);
		getRoomAbacLockContextMock.returns({ enforcementOn: false, requiredAttributeKeys: [] });
	});

	it('should let a room owner clear the attributes while enforcement is off', async () => {
		await expect(run()).to.be.fulfilled;
	});

	it('should refuse a room owner clearing the attributes while enforcement is on', async () => {
		getRoomAbacLockContextMock.returns({ enforcementOn: true, requiredAttributeKeys: ['clearance'] });

		await expect(run()).to.be.rejectedWith('error-abac-room-attributes-cleared');
	});

	it('should let a room owner clear the attributes while enforcement is on without required attributes', async () => {
		getRoomAbacLockContextMock.returns({ enforcementOn: true, requiredAttributeKeys: [] });

		await expect(run()).to.be.fulfilled;
	});

	it('should let an ABAC admin clear the attributes while enforcement is on', async () => {
		getRoomAbacLockContextMock.returns({ enforcementOn: true, requiredAttributeKeys: ['clearance'] });
		hasAllPermissionAsyncMock.resolves(true);

		await expect(run()).to.be.fulfilled;
	});
});
