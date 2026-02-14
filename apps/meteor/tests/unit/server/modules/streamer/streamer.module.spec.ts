import { expect } from 'chai';
import sinon from 'sinon';

import { SystemLogger } from '../../../../../server/lib/logger/system';
import { Streamer, StreamerCentral } from '../../../../../server/modules/streamer/streamer.module';

class TestStreamer extends Streamer<any> {
	registerPublication(): void {
		// no-op for unit test subclass
	}

	registerMethod(): void {
		// no-op for unit test subclass
	}

	changedPayload(): string {
		return 'payload';
	}
}

type TestSubscription = {
	entry: any;
	connection: Record<string, unknown>;
	send: sinon.SinonSpy;
};

const makeSubscription = (connectionId: string): TestSubscription => {
	const send = sinon.spy();
	const connection = { id: connectionId };

	return {
		connection,
		send,
		entry: {
			eventName: 'event',
			subscription: {
				connection,
				_session: {
					socket: { send },
				},
			},
		},
	};
};

describe('Streamer.sendToManySubscriptions', () => {
	const createdStreamers: string[] = [];

	const createStreamer = (): TestStreamer => {
		const name = `streamer-test-${Date.now()}-${Math.random()}`;
		createdStreamers.push(name);
		return new TestStreamer(name);
	};

	afterEach(() => {
		sinon.restore();
		for (const name of createdStreamers.splice(0)) {
			delete StreamerCentral.instances[name];
		}
	});

	it('waits for async permission checks before resolving', async () => {
		const streamer = createStreamer();
		const sub = makeSubscription('conn-1');

		let release!: (value: boolean) => void;
		const gate = new Promise<boolean>((resolve) => {
			release = resolve;
		});

		sinon.stub(streamer, 'isEmitAllowed').returns(gate as any);

		const sendPromise = streamer.sendToManySubscriptions(new Set([sub.entry]), undefined, 'event', [], 'test-msg');

		await Promise.resolve();
		expect(sub.send.called).to.equal(false);

		release(true);
		await sendPromise;

		expect(sub.send.calledOnceWithExactly('test-msg')).to.equal(true);
	});

	it('skips origin subscription and sends only to allowed subscriptions', async () => {
		const streamer = createStreamer();

		const originSub = makeSubscription('origin');
		const allowedSub = makeSubscription('allowed');
		const deniedSub = makeSubscription('denied');

		const isEmitAllowed = sinon.stub(streamer, 'isEmitAllowed');
		isEmitAllowed.onFirstCall().resolves(true);
		isEmitAllowed.onSecondCall().resolves(false);

		await streamer.sendToManySubscriptions(
			new Set([originSub.entry, allowedSub.entry, deniedSub.entry]),
			originSub.connection as any,
			'event',
			[],
			'test-msg',
		);

		expect(originSub.send.called).to.equal(false);
		expect(allowedSub.send.calledOnceWithExactly('test-msg')).to.equal(true);
		expect(deniedSub.send.called).to.equal(false);
	});

	it('logs rejected subscription dispatches and continues with other subscribers', async () => {
		const streamer = createStreamer();

		const failingSub = makeSubscription('failing');
		const successSub = makeSubscription('success');
		const error = new Error('boom');

		const isEmitAllowed = sinon.stub(streamer, 'isEmitAllowed');
		isEmitAllowed.onFirstCall().rejects(error);
		isEmitAllowed.onSecondCall().resolves(true);

		const loggerSpy = sinon.stub(SystemLogger, 'error');

		await streamer.sendToManySubscriptions(new Set([failingSub.entry, successSub.entry]), undefined, 'event-name', [], 'test-msg');

		expect(failingSub.send.called).to.equal(false);
		expect(successSub.send.calledOnceWithExactly('test-msg')).to.equal(true);
		expect(loggerSpy.calledOnce).to.equal(true);
		expect(loggerSpy.firstCall.args[0]).to.deep.include({
			msg: 'Error while delivering streamer event',
			eventName: 'event-name',
			streamName: streamer.name,
		});
		expect((loggerSpy.firstCall.args[0] as { err: unknown }).err).to.equal(error);
	});
});
