import { beforeEach, describe, it } from 'node:test';

import { ClientSafeError } from '@rocket.chat/core-services';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const user = { _id: 'user-id', username: 'charlie', type: 'user' };
const parent = { _id: 'parent-id', t: 'c' };
const discussion = { _id: 'discussion-id', t: 'p', prid: parent._id, pmid: 'message-id' };
const canAccessRoom = sinon.stub();
const addUserToRoom = sinon.stub();
const findExistingDiscussion = sinon.stub();

const { createDiscussion } = proxyquire.noCallThru().load('./createDiscussion', {
	'@rocket.chat/abac': { AbacContractError: class extends Error {} },
	'@rocket.chat/core-services': { Authorization: { canAccessRoom }, ClientSafeError },
	'@rocket.chat/models': {
		Users: { findOneById: sinon.stub().resolves(user) },
		Rooms: { findOneById: sinon.stub().resolves(parent), findOne: findExistingDiscussion },
		Messages: { findOneById: sinon.stub().resolves({ _id: 'message-id', rid: parent._id, u: user }) },
		Subscriptions: { countByRoomIdAndUserId: sinon.stub().resolves(1) },
	},
	'@rocket.chat/random': {},
	'../../hooks/messages/afterSaveMessage': {},
	'../../lib/authorization/canSendMessage': { canSendMessageAsync: sinon.stub().resolves(parent) },
	'../../lib/authorization/hasPermission': { hasAtLeastOnePermissionAsync: sinon.stub().resolves(true) },
	'../../lib/i18n': {},
	'../../lib/messages/attachMessage': {},
	'../../lib/messages/sendMessage': {},
	'../../lib/rooms/addUserToRoom': { addUserToRoom },
	'../../lib/rooms/createRoom': {},
	'../../lib/rooms/roomCoordinator': {},
	'../../settings': { settings: { get: sinon.stub().returns(true) } },
});

const input = { prid: parent._id, pmid: discussion.pmid, t_name: 'Existing discussion', users: [], encrypted: false };

describe('createDiscussion for an existing discussion', () => {
	beforeEach(() => {
		canAccessRoom.reset();
		addUserToRoom.reset();
		findExistingDiscussion.reset();
		findExistingDiscussion.resolves(discussion);
		findExistingDiscussion.withArgs(parent._id).resolves(parent);
	});

	it('does not add a parent-room member who cannot access the discussion', async () => {
		canAccessRoom.resolves(false);

		await expect(createDiscussion(user._id, input)).to.be.rejectedWith('Not allowed');
		sinon.assert.calledOnceWithExactly(canAccessRoom, discussion, user);
		sinon.assert.notCalled(addUserToRoom);
	});

	it('returns the existing private discussion to an authorized member', async () => {
		canAccessRoom.resolves(true);

		const result = await createDiscussion(user._id, input);

		expect(result).to.deep.equal({ ...discussion, rid: discussion._id });
		sinon.assert.calledOnceWithExactly(addUserToRoom, discussion._id, user);
	});

	it('still joins an accessible public discussion for the same parent message', async () => {
		const publicDiscussion = { ...discussion, t: 'c' };
		findExistingDiscussion.resolves(publicDiscussion);
		canAccessRoom.resolves(true);

		const result = await createDiscussion(user._id, input);

		expect(result).to.deep.equal({ ...publicDiscussion, rid: discussion._id });
		sinon.assert.calledOnceWithExactly(canAccessRoom, publicDiscussion, user);
		sinon.assert.calledOnceWithExactly(addUserToRoom, discussion._id, user);
	});
});
