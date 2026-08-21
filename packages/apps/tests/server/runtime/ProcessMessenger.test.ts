import type { ChildProcess } from 'node:child_process';
import * as assert from 'node:assert';
import { describe, it, mock } from 'node:test';

import * as jsonrpc from 'jsonrpc-lite';

import { newEncoder } from '../../../src/server/runtime/base/codec';
import { ProcessMessenger } from '../../../src/server/runtime/base/ProcessMessenger';

const buildFakeProcess = () =>
	({
		stdin: {
			writable: true,
			write: mock.fn(() => true),
		},
	}) as unknown as ChildProcess;

describe('ProcessMessenger', () => {
	it('reports the encoded byte length of each sent message to the onSend hook', () => {
		const onSend = mock.fn();
		const messenger = new ProcessMessenger(onSend);

		messenger.setReceiver(buildFakeProcess());

		const message = jsonrpc.request('1', 'app:getStatus', []);
		messenger.send(message);

		const expectedBytes = newEncoder().encode(message).byteLength;

		assert.strictEqual(onSend.mock.callCount(), 1);
		assert.deepStrictEqual(onSend.mock.calls[0].arguments, [expectedBytes]);
	});

	it('does not require an onSend hook to send messages', () => {
		const messenger = new ProcessMessenger();
		const fakeProcess = buildFakeProcess();

		messenger.setReceiver(fakeProcess);

		assert.doesNotThrow(() => messenger.send(jsonrpc.request('1', 'app:getStatus', [])));
		assert.strictEqual((fakeProcess.stdin!.write as ReturnType<typeof mock.fn>).mock.callCount(), 1);
	});
});
