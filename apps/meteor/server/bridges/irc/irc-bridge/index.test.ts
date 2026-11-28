import { afterEach, beforeEach, describe, it } from 'node:test';

import { expect } from 'chai';
import p from 'proxyquire';
import sinon from 'sinon';

const sandbox = sinon.createSandbox();

const findOneByIdMock = sandbox.stub();
const callbacksRemoveMock = sandbox.stub();
const disconnectMock = sandbox.stub();

class FakeServer {
	on = sandbox.stub();

	register = sandbox.stub();

	disconnect = disconnectMock;
}

class FakeLogger {
	info = sandbox.stub();

	section() {
		return { info: sandbox.stub() };
	}
}

const { default: Bridge } = p.noCallThru().load('./index', {
	'@rocket.chat/logger': { Logger: FakeLogger },
	'@rocket.chat/models': { Settings: { findOneById: findOneByIdMock } },
	'./localHandlers': {},
	'./peerHandlers': {},
	'../../../../lib/utils/highOrderFunctions': { withThrottling: () => () => () => undefined },
	'../../../lib/callbacks': { callbacks: { add: sandbox.stub(), remove: callbacksRemoveMock, priority: { LOW: 1 } } },
	'../../../lib/callbacks/afterLeaveRoomCallback': { afterLeaveRoomCallback: { add: sandbox.stub(), remove: sandbox.stub() } },
	'../../../lib/callbacks/afterLogoutCleanUpCallback': { afterLogoutCleanUpCallback: { add: sandbox.stub(), remove: sandbox.stub() } },
	'../../../lib/notifyListener': { notifyOnSettingChangedById: sandbox.stub() },
	'../../../settings/lib/auditedSettingUpdates': { updateAuditedBySystem: sandbox.stub() },
	'../servers': { RFC2813: FakeServer },
});

const createBridge = (initTime: Date) => {
	const bridge = new Bridge({ server: { protocol: 'RFC2813' } });
	bridge.initTime = initTime;
	return bridge;
};

describe('IRC Bridge', () => {
	beforeEach(() => {
		sandbox.resetHistory();
	});

	describe('init', () => {
		it('should not connect once removed during the last ping lookup', async () => {
			const bridge = createBridge(new Date());
			const { server } = bridge;
			findOneByIdMock.reset();
			findOneByIdMock.withArgs('IRC_Bridge_Last_Ping').callsFake(async () => {
				bridge.remove();
				return null;
			});

			await bridge.init();

			expect(server.register.called).to.be.false;
		});
	});

	describe('runQueue', () => {
		// A bridge that keeps running reschedules runQueue forever; fake timers keep that from holding the test process open.
		let clock: sinon.SinonFakeTimers;

		beforeEach(() => {
			clock = sinon.useFakeTimers({ toFake: ['setTimeout'] });
		});

		afterEach(() => {
			clock.restore();
		});

		it('should disconnect and remove itself when the connection was reset after it started', async () => {
			const bridge = createBridge(new Date('2026-01-01T00:00:00Z'));
			findOneByIdMock.withArgs('IRC_Bridge_Reset_Time').resolves({ _id: 'IRC_Bridge_Reset_Time', value: new Date('2026-01-01T00:01:00Z') });

			await bridge.runQueue();

			expect(disconnectMock.calledOnce).to.be.true;
			expect(bridge.server).to.be.null;
			expect(callbacksRemoveMock.calledWith('afterSaveMessage', 'irc-on-save-message')).to.be.true;
		});

		it('should keep processing the queue when the reset lookup fails', async () => {
			const bridge = createBridge(new Date());
			findOneByIdMock.reset();
			const lookup = findOneByIdMock.withArgs('IRC_Bridge_Reset_Time');
			lookup.resolves(null);
			lookup.onFirstCall().rejects(new Error('lookup failed'));

			await bridge.runQueue();
			await clock.tickAsync(bridge.queueTimeout);

			expect(lookup.calledTwice).to.be.true;
		});

		it('should not process a queued command once removed during the reset lookup', async () => {
			const bridge = createBridge(new Date());
			findOneByIdMock.reset();
			findOneByIdMock.withArgs('IRC_Bridge_Reset_Time').callsFake(async () => {
				bridge.remove();
				return null;
			});
			bridge.onMessageReceived('peer', 'PING');

			await bridge.runQueue();

			expect(bridge.queue.isEmpty()).to.be.false;
		});
	});

	describe('stop and remove', () => {
		// The bridge may already have removed itself after a reset when startIrcBridge stops it.
		it('should be safe to call again once the bridge was removed', () => {
			const bridge = createBridge(new Date());

			bridge.stop();
			bridge.remove();
			sandbox.resetHistory();

			expect(() => {
				bridge.stop();
				bridge.remove();
			}).not.to.throw();
			expect(disconnectMock.called).to.be.false;
			expect(callbacksRemoveMock.called).to.be.false;
		});
	});
});
