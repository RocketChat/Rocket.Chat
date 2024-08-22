import { expect } from 'chai';
import { describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import { createFakeRoom, createFakeSubscription, createFakeUser } from '../../../../../mocks/data';

const subscriptionsStub = {
	findOneByRoomIdAndUserId: sinon.stub(),
	removeByRoomId: sinon.stub(),
	countByRoomId: sinon.stub(),
};

const livechatRoomsStub = {
	findOneById: sinon.stub(),
};

const livechatStub = {
	closeRoom: sinon.stub(),
};

const hasPermissionStub = sinon.stub();

const { closeLivechatRoom } = proxyquire.noCallThru().load('../../../../../../app/lib/server/functions/closeLivechatRoom.ts', {
	'../../../livechat/server/lib/LivechatTyped': {
		Livechat: livechatStub,
	},
	'../../../authorization/server/functions/hasPermission': {
		hasPermissionAsync: hasPermissionStub,
	},
	'@rocket.chat/models': {
		Subscriptions: subscriptionsStub,
		LivechatRooms: livechatRoomsStub,
	},
});

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

	it('should not perform any operation when a non-livechat room is provided', async () => {
		livechatRoomsStub.findOneById.resolves({ ...room, t: 'c' });
		subscriptionsStub.findOneByRoomIdAndUserId.resolves(subscription);
		hasPermissionStub.resolves(true);

		await expect(closeLivechatRoom(user, room._id, {})).to.be.rejectedWith('error-invalid-room');
		expect(livechatStub.closeRoom.notCalled).to.be.true;
		expect(livechatRoomsStub.findOneById.calledOnceWith(room._id)).to.be.true;
		expect(subscriptionsStub.findOneByRoomIdAndUserId.notCalled).to.be.true;
		expect(subscriptionsStub.removeByRoomId.notCalled).to.be.true;
	});

	it('should not perform any operation when a closed room with no subscriptions is provided and the caller is not subscribed to it', async () => {
		livechatRoomsStub.findOneById.resolves({ ...room, open: false });
		subscriptionsStub.removeByRoomId.resolves({ deletedCount: 0 });
		subscriptionsStub.findOneByRoomIdAndUserId.resolves(null);
		hasPermissionStub.resolves(true);

		await expect(closeLivechatRoom(user, room._id, {})).to.be.rejectedWith('error-room-already-closed');
		expect(livechatStub.closeRoom.notCalled).to.be.true;
		expect(livechatRoomsStub.findOneById.calledOnceWith(room._id)).to.be.true;
		expect(subscriptionsStub.findOneByRoomIdAndUserId.notCalled).to.be.true;
		expect(subscriptionsStub.removeByRoomId.calledOnceWith(room._id)).to.be.true;
	});

	it('should remove dangling subscription when a closed room with subscriptions is provided and the caller is not subscribed to it', async () => {
		livechatRoomsStub.findOneById.resolves({ ...room, open: false });
		subscriptionsStub.removeByRoomId.resolves({ deletedCount: 1 });
		subscriptionsStub.findOneByRoomIdAndUserId.resolves(null);
		hasPermissionStub.resolves(true);

		await closeLivechatRoom(user, room._id, {});
		expect(livechatStub.closeRoom.notCalled).to.be.true;
		expect(livechatRoomsStub.findOneById.calledOnceWith(room._id)).to.be.true;
		expect(subscriptionsStub.findOneByRoomIdAndUserId.notCalled).to.be.true;
		expect(subscriptionsStub.removeByRoomId.calledOnceWith(room._id)).to.be.true;
	});

	it('should remove dangling subscription when a closed room is provided but the user is still subscribed to it', async () => {
		livechatRoomsStub.findOneById.resolves({ ...room, open: false });
		subscriptionsStub.findOneByRoomIdAndUserId.resolves(subscription);
		subscriptionsStub.removeByRoomId.resolves({ deletedCount: 1 });
		hasPermissionStub.resolves(true);

		await closeLivechatRoom(user, room._id, {});
		expect(livechatStub.closeRoom.notCalled).to.be.true;
		expect(livechatRoomsStub.findOneById.calledOnceWith(room._id)).to.be.true;
		expect(subscriptionsStub.findOneByRoomIdAndUserId.notCalled).to.be.true;
		expect(subscriptionsStub.removeByRoomId.calledOnceWith(room._id)).to.be.true;
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
});
