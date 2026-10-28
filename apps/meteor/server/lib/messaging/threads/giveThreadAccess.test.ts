import { beforeEach, describe, it } from 'node:test';

import { ClientSafeError } from '@rocket.chat/core-services';
import { expect } from 'chai';
import p from 'proxyquire';
import sinon from 'sinon';

const modelsMock = {
	Messages: { findOneById: sinon.stub() },
	Subscriptions: { addUnreadThreadByRoomIdAndUserIds: sinon.stub() },
};
const followMock = sinon.stub();
const canAccessRoomIdAsyncMock = sinon.stub();
const canSeeMessageMock = sinon.stub();
const getMembersWithoutAccessToMessageMock = sinon.stub();
const notifyOnMessageChangeMock = sinon.stub();
const notifyOnSubscriptionChangedByRoomIdAndUserIdsMock = sinon.stub();

const { giveThreadAccess } = p.noCallThru().load('./giveThreadAccess.ts', {
	'@rocket.chat/models': modelsMock,
	'@rocket.chat/core-services': { ClientSafeError },
	'./functions': { follow: followMock },
	'../../authorization/canAccessRoom': { canAccessRoomIdAsync: canAccessRoomIdAsyncMock },
	'../../messages/historyVisibility': {
		canSeeMessage: canSeeMessageMock,
		getMembersWithoutAccessToMessage: getMembersWithoutAccessToMessageMock,
		historyCheckedMessageProjection: {},
	},
	'../../notifyListener': {
		notifyOnMessageChange: notifyOnMessageChangeMock,
		notifyOnSubscriptionChangedByRoomIdAndUserIds: notifyOnSubscriptionChangedByRoomIdAndUserIdsMock,
	},
});

describe('giveThreadAccess', () => {
	const threadRoot = { _id: 'thread', rid: 'room', ts: new Date('2026-09-01T00:00:00Z') };

	beforeEach(() => {
		sinon.resetHistory();
		modelsMock.Messages.findOneById.resolves(threadRoot);
		canAccessRoomIdAsyncMock.resolves(true);
		canSeeMessageMock.resolves(true);
		getMembersWithoutAccessToMessageMock.resolves(new Set(['restricted']));
	});

	it('makes members who can not see the thread follow it and marks it unread for them', async () => {
		const granted = await giveThreadAccess('actor', 'thread', ['restricted', 'already-has-access']);

		expect(granted).to.deep.equal(['restricted']);
		sinon.assert.calledOnceWithExactly(followMock, { tmid: 'thread', uid: 'restricted' });
		sinon.assert.calledOnceWithExactly(modelsMock.Subscriptions.addUnreadThreadByRoomIdAndUserIds, 'room', ['restricted'], 'thread', {
			userMention: true,
		});
		sinon.assert.calledOnceWithExactly(notifyOnMessageChangeMock, { id: 'thread' });
	});

	it('does nothing when every member can already see the thread', async () => {
		getMembersWithoutAccessToMessageMock.resolves(new Set());

		expect(await giveThreadAccess('actor', 'thread', ['member'])).to.deep.equal([]);
		sinon.assert.notCalled(followMock);
	});

	it('refuses actors who can not see the thread themselves', async () => {
		canSeeMessageMock.resolves(false);

		await expect(giveThreadAccess('actor', 'thread', ['restricted'])).to.be.rejectedWith('Not allowed');
		sinon.assert.notCalled(followMock);
	});

	it('refuses actors who can not access the room', async () => {
		canAccessRoomIdAsyncMock.resolves(false);

		await expect(giveThreadAccess('actor', 'thread', ['restricted'])).to.be.rejectedWith('Not allowed');
		sinon.assert.notCalled(followMock);
	});
});
