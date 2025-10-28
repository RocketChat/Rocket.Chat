import { expect } from 'chai';
import { describe, it, afterEach } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

type FetchResponse = {
	status: number;
	text: () => Promise<string>;
};

const mkResponse = (status: number, text = ''): FetchResponse => ({
	status,
	text: async () => text,
});

const MODULE_PATH = '../../../../../../app/livechat/server/lib/webhooks';

function buildSubject(options?: {
	fetchSequence?: Array<{ status: number; text?: string }>;
	fetchOnce?: { status: number; text?: string };
	settings?: Partial<Record<'Livechat_http_timeout' | 'Livechat_secret_token' | 'Livechat_webhookUrl', any>>;
}) {
	const defaults = {
		Livechat_http_timeout: 1000,
		Livechat_secret_token: 'super-secret',
		Livechat_webhookUrl: 'https://example.test/hook',
	};

	const settingsValues = { ...defaults, ...(options?.settings ?? {}) };

	const settings = {
		get: sinon.stub().callsFake((key: string) => settingsValues[key as keyof typeof settingsValues]),
	};

	const fetchStub = sinon.stub();
	if (options?.fetchSequence && options.fetchSequence.length) {
		options.fetchSequence.forEach((spec, i) => {
			fetchStub.onCall(i).resolves(mkResponse(spec.status, spec.text));
		});
	} else if (options?.fetchOnce) {
		fetchStub.resolves(mkResponse(options.fetchOnce.status, options.fetchOnce.text));
	} else {
		fetchStub.resolves(mkResponse(200, 'ok'));
	}

	const logger = {
		debug: sinon.spy(),
		error: sinon.spy(),
	};

	const metrics = {
		totalLivechatWebhooksSuccess: { inc: sinon.spy() },
		totalLivechatWebhooksFailures: { inc: sinon.spy() },
	};

	const { sendRequest } = proxyquire.noCallThru().load(MODULE_PATH, {
		'@rocket.chat/server-fetch': { serverFetch: fetchStub },
		'./logger': { webhooksLogger: logger },
		'../../../metrics/server': { metrics },
		'../../../settings/server': { settings },
	});

	return {
		sendRequest,
		stubs: { fetchStub, logger, metrics, settings },
		values: settingsValues,
	};
}

describe('livechat/server/lib/webhooks sendRequest', () => {
	let clock: sinon.SinonFakeTimers;

	afterEach(() => {
		sinon.restore();
		if (clock) {
			clock.restore();
		}
	});

	it('sends a POST request with correct options and resolves on 200', async () => {
		const postData = { type: 'TestEvent', a: 1 };
		const secret = 'my-secret';
		const timeout = 2500;
		const webhookUrl = 'https://example.com/webhook';

		const { sendRequest, stubs, values } = buildSubject({
			fetchOnce: { status: 200, text: 'OK' },
			settings: {
				Livechat_secret_token: secret,
				Livechat_http_timeout: timeout,
				Livechat_webhookUrl: webhookUrl,
			},
		});

		const cb = sinon.spy(async () => {
			/* noop */
		});

		const result = await sendRequest(postData, 5, cb);

		// fetch was called with correct URL and options
		expect(stubs.fetchStub.calledOnce).to.be.true;
		const [calledUrl, calledOpts] = stubs.fetchStub.getCall(0).args;
		expect(calledUrl).to.equal(values.Livechat_webhookUrl);
		expect(calledOpts).to.deep.include({
			method: 'POST',
			body: postData,
			timeout: values.Livechat_http_timeout,
		});
		expect(calledOpts.headers).to.have.property('X-RocketChat-Livechat-Token', secret);

		// success metrics and callback
		expect(stubs.metrics.totalLivechatWebhooksSuccess.inc.calledOnce).to.be.true;
		expect(stubs.metrics.totalLivechatWebhooksFailures.inc.notCalled).to.be.true;
		expect(cb.calledOnce).to.be.true;

		// result is the fetch response
		expect(result).to.be.ok;
		expect(result!.status).to.equal(200);

		// debug logging invoked at least once
		expect(stubs.logger.debug.called).to.be.true;
		expect(stubs.logger.error.notCalled).to.be.true;
	});

	it('omits X-RocketChat-Livechat-Token header when secret token is falsy', async () => {
		const { sendRequest, stubs } = buildSubject({
			fetchOnce: { status: 200, text: 'OK' },
			settings: {
				Livechat_secret_token: '',
			},
		});

		await sendRequest({ type: 'NoSecret' });

		const [, calledOpts] = stubs.fetchStub.getCall(0).args;
		expect(calledOpts.headers).to.not.have.property('X-RocketChat-Livechat-Token');
	});

	it('logs and does not retry on non-retryable status (e.g., 400)', async () => {
		const { sendRequest, stubs } = buildSubject({
			fetchOnce: { status: 400, text: 'Bad Request' },
		});

		const cb = sinon.spy(async () => {
			/* noop */
		});

		const result = await sendRequest({ type: 'NonRetryable' }, 5, cb);

		// Does not throw; returns undefined
		expect(result).to.be.undefined;

		// fetch called only once, no retry
		expect(stubs.fetchStub.calledOnce).to.be.true;

		// failure metric incremented
		expect(stubs.metrics.totalLivechatWebhooksFailures.inc.calledOnce).to.be.true;
		expect(stubs.metrics.totalLivechatWebhooksSuccess.inc.notCalled).to.be.true;

		// callback not called on failure
		expect(cb.notCalled).to.be.true;

		// error log with status and response
		expect(stubs.logger.error.called).to.be.true;
		const logArg = stubs.logger.error.getCall(0).args[0];
		expect(logArg).to.include.keys(['msg', 'status', 'response']);
		expect(logArg.status).to.equal(400);
		expect(logArg.response).to.equal('Bad Request');
	});

	it('retries once on retryable status (e.g., 500) and succeeds on next attempt', async () => {
		clock = sinon.useFakeTimers();

		const timeout = 1500;
		const retryAfter = timeout * 4;

		const { sendRequest, stubs } = buildSubject({
			fetchSequence: [
				{ status: 500, text: 'Server Error' },
				{ status: 200, text: 'OK' },
			],
			settings: { Livechat_http_timeout: timeout },
		});

		const cb = sinon.spy(async () => {
			/* noop */
		});

		// Call initial request; it will schedule a retry
		await sendRequest({ type: 'RetryableOnce' }, 5, cb);
		expect(stubs.fetchStub.callCount).to.equal(1);
		expect(stubs.metrics.totalLivechatWebhooksFailures.inc.calledOnce).to.be.true;

		// Advance clock to trigger the retry
		// use tickAsync to ensure promise microtasks inside the timer are flushed
		await clock.tickAsync(retryAfter);

		// After retry, we should have a success
		expect(stubs.fetchStub.callCount).to.equal(2);
		expect(stubs.metrics.totalLivechatWebhooksSuccess.inc.calledOnce).to.be.true;

		// callback called once for the successful attempt
		expect(cb.calledOnce).to.be.true;

		// no terminal error log
		const errorMsgs = stubs.logger.error.getCalls().map((c: sinon.SinonSpyCall) => c.args[0]?.msg);
		expect(errorMsgs.some((m: string) => typeof m === 'string' && m.includes('Max attempts'))).to.be.false;
	});

	it('stops after max attempts and logs final error for repeated retryable failures', async () => {
		clock = sinon.useFakeTimers();

		const timeout = 500;
		const retryAfter = timeout * 4;

		// Prepare 5 retryable failures (equal to attempts)
		const failures = Array.from({ length: 5 }, () => ({ status: 500, text: 'Upstream down' }));
		const { sendRequest, stubs } = buildSubject({
			fetchSequence: failures,
			settings: { Livechat_http_timeout: timeout },
		});

		const postData = { type: 'AlwaysFail' };

		// Fire the initial call
		await sendRequest(postData, 5);

		// Process the 4 scheduled retries
		for (let i = 0; i < 4; i++) {
			// eslint-disable-next-line no-await-in-loop
			await clock.tickAsync(retryAfter);
		}

		// fetch was attempted 5 times total
		expect(stubs.fetchStub.callCount).to.equal(5);

		// failure metric incremented for each failed attempt
		expect(stubs.metrics.totalLivechatWebhooksFailures.inc.callCount).to.equal(5);
		expect(stubs.metrics.totalLivechatWebhooksSuccess.inc.notCalled).to.be.true;

		// terminal error logged when max attempts reached
		expect(stubs.logger.error.called).to.be.true;
		const msgs = stubs.logger.error.getCalls().map((c: sinon.SinonSpyCall) => c.args[0]?.msg);
		expect(msgs.some((m: string) => typeof m === 'string' && m.includes('Max attempts'))).to.be.true;
	});

	it('passes the Response to the callback on success', async () => {
		const responseText = 'Great Success';
		const { sendRequest, stubs } = buildSubject({
			fetchOnce: { status: 200, text: responseText },
		});

		const cb = sinon.spy(async (res: FetchResponse) => {
			const txt = await res.text();
			expect(txt).to.equal(responseText);
		});

		await sendRequest({ type: 'CbTest' }, 5, cb);

		expect(cb.calledOnce).to.be.true;
		expect(stubs.metrics.totalLivechatWebhooksSuccess.inc.calledOnce).to.be.true;
	});

	it('uses default attempts=5 and schedules retry with delay = timeout*4', async () => {
		clock = sinon.useFakeTimers();

		const timeout = 1234;
		const retryAfter = timeout * 4;

		const { sendRequest, stubs } = buildSubject({
			fetchSequence: [
				{ status: 500, text: 'fail' },
				{ status: 200, text: 'ok' },
			],
			settings: { Livechat_http_timeout: timeout },
		});

		await sendRequest({ type: 'DelayCheck' });

		// Before advancing time, only first attempt should have been made
		expect(stubs.fetchStub.callCount).to.equal(1);

		// Advance just shy of the retryAfter - no retry should happen
		await clock.tickAsync(retryAfter - 1);
		expect(stubs.fetchStub.callCount).to.equal(1);

		// Advance the remaining 1ms - retry should fire
		await clock.tickAsync(1);
		expect(stubs.fetchStub.callCount).to.equal(2);
	});
});
