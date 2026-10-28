import { afterEach, beforeEach, describe, it } from 'node:test';

import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const notificationQueueModelStub = {
	findNextInQueueOrExpired: sinon.stub(),
	clearScheduleByUserId: sinon.stub(),
	removeById: sinon.stub(),
	unsetSendingById: sinon.stub(),
	setErrorById: sinon.stub(),
};
const pushNotificationStub = { send: sinon.stub() };

const { Notification } = proxyquire.noCallThru().load('./NotificationQueue', {
	'@rocket.chat/models': { NotificationQueue: notificationQueueModelStub, Users: {} },
	'@rocket.chat/tracing': { tracerSpan: (_name: string, _options: unknown, fn: () => unknown) => fn() },
	'meteor/meteor': { Meteor: { startup: sinon.stub() } },
	'../../logger/system': { SystemLogger: { error: sinon.stub() } },
	'../message/email': { sendEmailFromData: sinon.stub() },
	'../push-config': { PushNotification: pushNotificationStub },
});

const queueItem = (id: string) => ({ _id: id, uid: 'user1', rid: 'room1', mid: 'msg1', items: [{ type: 'push', data: {} }] });

describe('NotificationQueue worker', () => {
	beforeEach(() => {
		Notification.maxBatchSize = 2;
		notificationQueueModelStub.clearScheduleByUserId.resolves({ modifiedCount: 0 });
		notificationQueueModelStub.removeById.resolves();
		pushNotificationStub.send.resolves();
	});

	afterEach(() => {
		Notification.stopWorker();
		Object.values(notificationQueueModelStub).forEach((stub) => stub.reset());
		pushNotificationStub.send.reset();
	});

	it('reports the queue as empty once there is nothing left to send', async () => {
		notificationQueueModelStub.findNextInQueueOrExpired.onFirstCall().resolves(queueItem('n1')).resolves(null);

		expect(await Notification.worker()).to.be.true;
		expect(pushNotificationStub.send.calledOnce).to.be.true;
	});

	it('reports the queue as not empty when the batch limit stops it', async () => {
		notificationQueueModelStub.findNextInQueueOrExpired.resolves(queueItem('n1'));

		expect(await Notification.worker()).to.be.false;
		expect(pushNotificationStub.send.callCount).to.equal(3);
	});

	it('starts the next batch right away when the batch limit was reached, and waits when the queue is empty', async () => {
		const clock = sinon.useFakeTimers();
		const executeWorkerLaterSpy = sinon.spy(Notification, 'executeWorkerLater');
		try {
			notificationQueueModelStub.findNextInQueueOrExpired.resolves(null);
			[0, 1, 2].forEach((call) => notificationQueueModelStub.findNextInQueueOrExpired.onCall(call).resolves(queueItem(`n${call}`)));

			Notification.initWorker();
			await clock.tickAsync(Notification.cyclePause);
			await clock.tickAsync(1);

			expect(executeWorkerLaterSpy.args).to.deep.equal([[], [0], [Notification.cyclePause]]);
			expect(pushNotificationStub.send.callCount).to.equal(3);
		} finally {
			clock.restore();
		}
	});
});
