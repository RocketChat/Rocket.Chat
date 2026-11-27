import { before, beforeEach, describe, it, mock } from 'node:test';

import { expect } from 'chai';
import sinon from 'sinon';

const hasPermissionAsync = sinon.stub();
const canSendMessageAsync = sinon.stub();

let getConferenceStartRefusal: typeof import('./getConferenceStartRefusal').getConferenceStartRefusal;

describe('getConferenceStartRefusal', () => {
	const user = { _id: 'user1', username: 'user.one', type: 'user', roles: ['user'] };

	before(async () => {
		mock.module('../authorization/hasPermission', { exports: { hasPermissionAsync } });
		mock.module('../authorization/canSendMessage', { exports: { canSendMessageAsync } });
		({ getConferenceStartRefusal } = await import('./getConferenceStartRefusal'));
	});

	beforeEach(() => {
		hasPermissionAsync.reset();
		canSendMessageAsync.reset();
		hasPermissionAsync.resolves(true);
		canSendMessageAsync.resolves();
	});

	it('lets someone who manages the room calls and may post there start', async () => {
		expect(await getConferenceStartRefusal(user, 'room1')).to.be.undefined;
		expect(hasPermissionAsync.calledOnceWith(user, 'call-management', 'room1')).to.be.true;
		expect(canSendMessageAsync.firstCall.args).to.deep.equal(['room1', { uid: 'user1', username: 'user.one', type: 'user' }]);
	});

	it('refuses without call-management scoped to the room', async () => {
		hasPermissionAsync.resolves(false);

		expect(await getConferenceStartRefusal(user, 'room1')).to.equal('User does not have the permissions required for this action');
		expect(canSendMessageAsync.called).to.be.false;
	});

	// The call message is posted in the room, so a start is refused where the user may not post.
	it('refuses where the user may not post', async () => {
		canSendMessageAsync.rejects(new Error('room_is_archived'));

		expect(await getConferenceStartRefusal(user, 'room1')).to.equal('User cannot send messages in this room');
	});
});
