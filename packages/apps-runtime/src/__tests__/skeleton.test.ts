/**
 * Slice-1 acceptance test (decision 0005 §6). Drives a *real* worker thread over the real JSON-RPC
 * protocol: this is the internal runtime integration harness, NOT the tenet-1 app-author test kit
 * (that is in-process in-memory doubles, a later iteration).
 *
 * Done = brand-checked `defineApp`; `.tgz` → `node:vm` eval; over JSON-RPC: registration manifest
 * on `load`, a `prevent` round-trips on `dispatch`, and a handler throw fail-closes.
 */
import assert from 'node:assert/strict';
import { after, test } from 'node:test';

import { AppWorker, RpcError, RpcErrorCode } from '../index';
import { makeAppTgz } from './make-tgz';

const SPAM_BLOCKER = `
const { defineApp } = require('@rocket.chat/apps-sdk');
module.exports.default = defineApp((app, ctx) => {
  ctx.logger.info('fixture: spam-blocker setup');
  app.on('message:send:pre', (event) => {
    if (event.message.text.includes('spam')) return event.prevent({ i18n: 'spam_blocked' });
    if (event.message.text.includes('redact')) return event.patch({ text: '[redacted]' });
    return event.continue;
  });
});
`;

const THROWER = `
const { defineApp } = require('@rocket.chat/apps-sdk');
module.exports.default = defineApp((app) => {
  app.on('message:send:pre', () => { throw new Error('boom'); });
});
`;

const NOT_AN_APP = `module.exports.default = 42;`;

const workers: AppWorker[] = [];

async function bootedWorker(bundle: string): Promise<AppWorker> {
	const packagePath = await makeAppTgz(bundle);
	const worker = new AppWorker({ packagePath });
	workers.push(worker);
	return worker;
}

const msg = (text: string) => ({ message: { id: 'm1', rid: 'r1', text } });

after(async () => {
	await Promise.all(workers.map((w) => w.terminate()));
});

test('load returns the registration manifest', async () => {
	const worker = await bootedWorker(SPAM_BLOCKER);
	const { registrations } = await worker.load();
	assert.deepEqual(registrations, [{ event: 'message:send:pre' }]);
});

test('dispatch round-trips a prevent decision', async () => {
	const worker = await bootedWorker(SPAM_BLOCKER);
	await worker.load();
	const decision = await worker.dispatch('message:send:pre', msg('buy cheap spam now'));
	assert.equal(decision.kind, 'prevent');
	assert.deepEqual(decision.kind === 'prevent' ? decision.reason : null, { i18n: 'spam_blocked' });
});

test('dispatch round-trips continue (unchanged)', async () => {
	const worker = await bootedWorker(SPAM_BLOCKER);
	await worker.load();
	const decision = await worker.dispatch('message:send:pre', msg('hello team'));
	assert.equal(decision.kind, 'continue');
});

test('dispatch round-trips a patch with the partial', async () => {
	const worker = await bootedWorker(SPAM_BLOCKER);
	await worker.load();
	const decision = await worker.dispatch('message:send:pre', msg('please redact this'));
	assert.equal(decision.kind, 'patch');
	assert.deepEqual(decision.kind === 'patch' ? decision.patch : null, { text: '[redacted]' });
});

test('a handler throw fails closed (error response)', async () => {
	const worker = await bootedWorker(THROWER);
	await worker.load();
	await assert.rejects(
		() => worker.dispatch('message:send:pre', msg('anything')),
		(err: unknown) => err instanceof RpcError && err.code === RpcErrorCode.HandlerThrew,
	);
});

test('dispatchPre maps a handler throw to an implicit veto', async () => {
	const worker = await bootedWorker(THROWER);
	await worker.load();
	const decision = await worker.dispatchPre('message:send:pre', msg('anything'));
	assert.equal(decision.kind, 'prevent');
});

test('a non-defineApp default export is rejected at load', async () => {
	const worker = await bootedWorker(NOT_AN_APP);
	await assert.rejects(
		() => worker.load(),
		(err: unknown) => err instanceof RpcError && err.code === RpcErrorCode.BrandInvalid,
	);
});
