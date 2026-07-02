import { expect } from 'chai';
import { describe, it, beforeEach, vi } from 'vitest';

import { createFakeRoom, createFakeSubscription, createFakeUser } from '../../../../../mocks/data';

// `sinon` is sourced from the hoisted block (the same instance the stubs were created with) so that
// `sinon.match(...)` produces matchers the stubs' `calledOnceWith` can recognize.
const { sinon, subscriptionsStub, livechatRoomsStub, livechatStub, hasPermissionStub } = vi.hoisted(() => {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const sinon = require('sinon');
	return {
		sinon,
		subscriptionsStub: {
			findOneByRoomIdAndUserId: sinon.stub(),
			removeByRoomId: sinon.stub(),
			countByRoomId: sinon.stub(),
		},
		livechatRoomsStub: {
			findOneById: sinon.stub(),
		},
		livechatStub: {
			closeRoom: sinon.stub(),
		},
		hasPermissionStub: sinon.stub(),
	};
});

vi.mock('../../../../../../app/livechat/server/lib/closeRoom', () => livechatStub);
vi.mock('../../../../../../app/authorization/server/functions/hasPermission', () => ({
	hasPermissionAsync: hasPermissionStub,
}));
vi.mock('@rocket.chat/models', () => ({
	Subscriptions: subscriptionsStub,
	LivechatRooms: livechatRoomsStub,
}));

const { closeLivechatRoom } = await import('../../../../../../app/lib/server/functions/closeLivechatRoom');

describe('closeLivechatRoom', () => {
	const user = createFakeUser();
	const room = createFakeRoom({ t: 'l', open: true });
	const subscription = createFakeSubscription({ rid: room._id, u: { username: user.username, _id: user._id } });

	beforeEach(() => {
		subscriptionsStub.findOneByRoomIdAndUserId.reset();
		subscriptionsStub.removeByRoomId.reset();
		subscriptionsStub.countByRoomId.reset();
		livechatRoomsStub.findOneById.reset();
		livechatStub.closeRoom.reset();
		hasPermissionStub.reset();
	});

	it('should not perform any operation when an invalid room id is provided', async () => {
		livechatRoomsStub.findOneById.resolves(null);
		hasPermissionStub.resolves(true);

		await expect(closeLivechatRoom(user, room._id, {})).to.be.rejectedWith('error-invalid-room');
		expect(livechatStub.closeRoom.notCalled).to.be.true;
		expect(livechatRoomsStub.findOneById.calledOnceWith(room._id)).to.be.true;
		expect(subscriptionsStub.findOneByRoomIdAndUserId.notCalled).to.be.true;
		expect(subscriptionsStub.removeByRoomId.notCalled).to.be.true;
	});

	it('should not perform any operation when the caller is not subscribed to an open room and does not have the permission to close others rooms', async () => {
		livechatRoomsStub.findOneById.resolves(room);
		subscriptionsStub.findOneByRoomIdAndUserId.resolves(null);
		hasPermissionStub.resolves(false);

		await expect(closeLivechatRoom(user, room._id, {})).to.be.rejectedWith('error-not-authorized');
		expect(livechatStub.closeRoom.notCalled).to.be.true;
		expect(livechatRoomsStub.findOneById.calledOnceWith(room._id)).to.be.true;
		expect(subscriptionsStub.findOneByRoomIdAndUserId.calledOnceWith(room._id, user._id)).to.be.true;
		expect(subscriptionsStub.removeByRoomId.notCalled).to.be.true;
	});

	it('should close the room when the caller is not subscribed to it but has the permission to close others rooms', async () => {
		livechatRoomsStub.findOneById.resolves(room);
		subscriptionsStub.findOneByRoomIdAndUserId.resolves(null);
		hasPermissionStub.resolves(true);

		await closeLivechatRoom(user, room._id, {});
		expect(livechatStub.closeRoom.calledOnceWith(sinon.match({ room, user }))).to.be.true;
		expect(livechatRoomsStub.findOneById.calledOnceWith(room._id)).to.be.true;
		expect(subscriptionsStub.findOneByRoomIdAndUserId.calledOnceWith(room._id, user._id)).to.be.true;
		expect(subscriptionsStub.removeByRoomId.notCalled).to.be.true;
	});

	it('should close the room when the caller is subscribed to it and does not have the permission to close others rooms', async () => {
		livechatRoomsStub.findOneById.resolves(room);
		subscriptionsStub.findOneByRoomIdAndUserId.resolves(subscription);
		hasPermissionStub.resolves(false);

		await closeLivechatRoom(user, room._id, {});
		expect(livechatStub.closeRoom.calledOnceWith(sinon.match({ room, user }))).to.be.true;
		expect(livechatRoomsStub.findOneById.calledOnceWith(room._id)).to.be.true;
		expect(subscriptionsStub.findOneByRoomIdAndUserId.calledOnceWith(room._id, user._id)).to.be.true;
		expect(subscriptionsStub.removeByRoomId.notCalled).to.be.true;
	});

	it('should call Livechat.closeRoom directly when forceClose is true even if room is in invalid state', async () => {
		// Here we're using `open: false` as a way to simulate an invalid state. This should not happen in production. A room like this is effectively a "bad egg"
		livechatRoomsStub.findOneById.resolves({ ...room, open: false });
		subscriptionsStub.findOneByRoomIdAndUserId.resolves(subscription);
		hasPermissionStub.resolves(true);

		await closeLivechatRoom(user, room._id, { forceClose: true });

		expect(
			livechatStub.closeRoom.calledOnceWith(
				sinon.match({ room: { ...room, open: false }, user, options: sinon.match({ clientAction: true }), forceClose: true }),
			),
		).to.be.true;
		expect(livechatRoomsStub.findOneById.calledOnceWith(room._id)).to.be.true;
		expect(subscriptionsStub.findOneByRoomIdAndUserId.calledOnceWith(room._id, user._id)).to.be.true;
	});

	it('should throw an error if forceClose is false and room is already closed', async () => {
		livechatRoomsStub.findOneById.resolves({ ...room, open: false });
		subscriptionsStub.findOneByRoomIdAndUserId.resolves(subscription);
		hasPermissionStub.resolves(true);

		await expect(closeLivechatRoom(user, room._id, { forceClose: false })).to.be.rejectedWith('error-room-already-closed');
		expect(livechatStub.closeRoom.notCalled).to.be.true;
		expect(livechatRoomsStub.findOneById.calledOnceWith(room._id)).to.be.true;
		expect(subscriptionsStub.findOneByRoomIdAndUserId.calledOnceWith(room._id, user._id)).to.be.true;
	});
});
