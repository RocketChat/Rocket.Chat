import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import type { IMessage } from '@rocket.chat/apps-engine/definition/messages';
import { z } from 'zod';

import { notification, request, shaped, type } from '../../../protocol/src/rpc/contract';

describe('request', () => {
	it('declares a request with its input schema', () => {
		const input = z.strictObject({ messageId: z.string() });
		const procedure = request({ input, output: type<void>() });

		assert.strictEqual(procedure.kind, 'request');
		assert.strictEqual(procedure.input, input);
	});

	it('rejects an input that strips unknown keys', () => {
		assert.throws(() => request({ input: z.object({ messageId: z.string() }), output: type<void>() }), TypeError);
	});

	it('rejects an input that keeps unknown keys', () => {
		assert.throws(() => request({ input: z.looseObject({ messageId: z.string() }) as never, output: type<void>() }), TypeError);
	});

	it('rejects an input that is not an object', () => {
		assert.throws(() => request({ input: z.string() as never, output: type<void>() }), TypeError);
	});
});

describe('notification', () => {
	it('declares a notification with its input schema', () => {
		const input = z.strictObject({ entries: z.array(z.string()) });
		const procedure = notification({ input });

		assert.strictEqual(procedure.kind, 'notification');
		assert.strictEqual(procedure.input, input);
	});

	it('rejects an input that strips unknown keys', () => {
		assert.throws(() => notification({ input: z.object({}) }), TypeError);
	});
});

describe('shaped', () => {
	const MessageInput = shaped<IMessage>()({ room: z.looseObject({ id: z.string() }) });

	it('keeps the fields it does not list, by reference', () => {
		const createdAt = new Date();
		const result = MessageInput.safeParse({ room: { id: 'GENERAL', slugifiedName: 'general' }, text: 'hi', createdAt });

		assert.ok(result.success);
		assert.deepStrictEqual(result.data.room, { id: 'GENERAL', slugifiedName: 'general' });
		assert.strictEqual(result.data.text, 'hi');
		assert.strictEqual(result.data.createdAt, createdAt);
	});

	it('rejects a listed field of the wrong type', () => {
		assert.strictEqual(MessageInput.safeParse({ room: { id: 42 } }).success, false);
	});

	it('rejects a missing listed field', () => {
		assert.strictEqual(MessageInput.safeParse({ text: 'hi' }).success, false);
	});
});
