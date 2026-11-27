import { before, beforeEach, describe, it, mock } from 'node:test';

import { expect } from 'chai';
import sinon from 'sinon';

const canAccessRoomIdAsync = sinon.stub();
const hasPermissionAsync = sinon.stub();

let canManageConferenceRoom: typeof import('./canManageConferenceRoom').canManageConferenceRoom;

describe('canManageConferenceRoom', () => {
	const user = { _id: 'user1', roles: ['user'] };

	before(async () => {
		mock.module('../authorization/canAccessRoom', { exports: { canAccessRoomIdAsync } });
		mock.module('../authorization/hasPermission', { exports: { hasPermissionAsync } });
		({ canManageConferenceRoom } = await import('./canManageConferenceRoom'));
	});

	beforeEach(() => {
		canAccessRoomIdAsync.reset();
		hasPermissionAsync.reset();
		canAccessRoomIdAsync.resolves(true);
		hasPermissionAsync.resolves(true);
	});

	it('lets someone who sees the room and manages its calls manage its links', async () => {
		expect(await canManageConferenceRoom(user, 'room1')).to.be.true;
		expect(canAccessRoomIdAsync.calledOnceWith('room1', 'user1')).to.be.true;
		expect(hasPermissionAsync.calledOnceWith(user, 'call-management', 'room1')).to.be.true;
	});

	// Every user holds call-management by default, so the permission alone would let anyone holding a link id
	// rename or delete the links of a private room they are not in.
	it('refuses someone who cannot see the room, whatever their permissions', async () => {
		canAccessRoomIdAsync.resolves(false);

		expect(await canManageConferenceRoom(user, 'room1')).to.be.false;
	});

	it('refuses a member without call-management scoped to the room', async () => {
		hasPermissionAsync.resolves(false);

		expect(await canManageConferenceRoom(user, 'room1')).to.be.false;
	});
});
