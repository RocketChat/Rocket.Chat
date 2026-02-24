import { expect } from 'chai';
import sinon from 'sinon';

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
	let streamer: TestStreamer;
	let streamerNameSeed = 0;

	beforeEach(() => {
		streamer = new TestStreamer(`streamer-test-${streamerNameSeed++}`);
	});

	afterEach(() => {
		sinon.restore();
		delete StreamerCentral.instances[streamer.name];
	});

	it('waits for async permission checks before resolving', async () => {
		const sub = makeSubscription('conn-1');

		const isEmitAllowed = sinon.stub(streamer, 'isEmitAllowed').resolves(true);

		const sendPromise = streamer.sendToManySubscriptions(new Set([sub.entry]), undefined, 'event', [], 'test-msg');

		expect(sub.send.called).to.equal(false);

		await sendPromise;

		expect(isEmitAllowed.calledOnceWithExactly(sub.entry.subscription, 'event')).to.equal(true);
		expect(sub.send.calledOnceWithExactly('test-msg')).to.equal(true);
	});

	it('skips origin subscription and sends only to allowed subscriptions', async () => {
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

	it('continues dispatching to other subscribers when a permission check rejects', async () => {
		const failingSub = makeSubscription('failing');
		const successSub = makeSubscription('success');
		const error = new Error('boom');

		const isEmitAllowed = sinon.stub(streamer, 'isEmitAllowed');
		isEmitAllowed.onFirstCall().rejects(error);
		isEmitAllowed.onSecondCall().resolves(true);

		await streamer.sendToManySubscriptions(new Set([failingSub.entry, successSub.entry]), undefined, 'event-name', [], 'test-msg');

		expect(isEmitAllowed.calledTwice).to.equal(true);
		expect(isEmitAllowed.firstCall.calledWithExactly(failingSub.entry.subscription, 'event-name')).to.equal(true);
		expect(isEmitAllowed.secondCall.calledWithExactly(successSub.entry.subscription, 'event-name')).to.equal(true);
		expect(failingSub.send.called).to.equal(false);
		expect(successSub.send.calledOnceWithExactly('test-msg')).to.equal(true);
	});
});
