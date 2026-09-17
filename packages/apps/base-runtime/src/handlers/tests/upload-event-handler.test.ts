import * as assert from 'node:assert';
import { Buffer } from 'node:buffer';
import { randomUUID } from 'node:crypto';
import { writeFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';

import type { App } from '@rocket.chat/apps-engine/definition/App';
import type { IPreFileUpload } from '@rocket.chat/apps-engine/definition/uploads/IPreFileUpload';
import type { IUploadDetails } from '@rocket.chat/apps-engine/definition/uploads/IUploadDetails';
import { JsonRpcError } from 'jsonrpc-lite';

import { createMockRequest } from './helpers/mod';
import { AppObjectRegistry } from '../../AppObjectRegistry';
import handleUploadEvents from '../app/handleUploadEvents';
import { Errors } from '../lib/assertions';

describe('handlers > upload', () => {
	let app: App & IPreFileUpload;
	let tmpFilePath: string;
	let file: IUploadDetails;

	beforeEach(async () => {
		AppObjectRegistry.clear();

		tmpFilePath = join(tmpdir(), `test-upload-${randomUUID()}.txt`);

		app = {
			extendConfiguration: () => {},
			executePreFileUpload: () => Promise.resolve(),
		} as unknown as App & IPreFileUpload;

		AppObjectRegistry.set('app', app);

		const content = 'Temp file for testing';

		await writeFile(tmpFilePath, content, 'utf-8');

		file = {
			name: 'TempFile.txt',
			size: content.length,
			type: 'text/plain',
			rid: 'RandomRoomId',
			userId: 'RandomUserId',
		};
	});

	afterEach(async () => {
		await unlink(tmpFilePath).catch((e: any) => e?.code !== 'ENOENT' && console.warn(`Failed to remove temp file at ${tmpFilePath}`, e));
	});

	it('correctly handles valid parameters', async () => {
		const result = await handleUploadEvents(
			createMockRequest({ method: 'app:executePreFileUpload', params: [{ file, path: tmpFilePath }] }),
		);

		assert.ok(!(result instanceof JsonRpcError), 'result is JsonRpcError');
	});

	it('correctly loads the file contents for IPreFileUpload', async () => {
		const _spy = mock.method(app as any, 'executePreFileUpload');

		const result = await handleUploadEvents(
			createMockRequest({ method: 'app:executePreFileUpload', params: [{ file, path: tmpFilePath }] }),
		);

		assert.ok(!(result instanceof JsonRpcError), 'result is JsonRpcError');
		assert.strictEqual(_spy.mock.calls.length, 1);
		assert.ok((_spy.mock.calls[0].arguments[0] as any)?.content instanceof Buffer, 'Expected content to be a Buffer');

		_spy.mock.restore();
	});

	it('fails when app object is not on registry', async () => {
		AppObjectRegistry.clear();

		const result = await handleUploadEvents(
			createMockRequest({ method: 'app:executePreFileUpload', params: [{ file, path: tmpFilePath }] }),
		);

		assert.ok(result instanceof JsonRpcError, `Expected instance of ${JsonRpcError.name}`);
		assert.deepStrictEqual((result as JsonRpcError).data.code, Errors.DRT_APP_NOT_AVAILABLE);
	});

	it('fails when the app does not implement the IPreFileUpload event handler', async () => {
		delete (app as any).executePreFileUpload;

		const result = await handleUploadEvents(
			createMockRequest({ method: 'app:executePreFileUpload', params: [{ file, path: tmpFilePath }] }),
		);

		assert.ok(result instanceof JsonRpcError, `Expected instance of ${JsonRpcError.name}`);
		assert.deepStrictEqual((result as JsonRpcError).data.code, Errors.DRT_EVENT_HANDLER_FUNCTION_MISSING);
	});

	it('fails when "file" is not a proper IUploadDetails object', async () => {
		const result = await handleUploadEvents(
			createMockRequest({ method: 'app:executePreFileUpload', params: [{ file: { nope: 'bad' }, path: tmpFilePath }] }),
		);

		assert.ok(result instanceof JsonRpcError, `Expected instance of ${JsonRpcError.name}`);
		assert.ok((result as JsonRpcError).data.err.includes('Expected IUploadDetails'));
	});

	it('fails when "path" is not a proper string', async () => {
		const result = await handleUploadEvents(createMockRequest({ method: 'app:executePreFileUpload', params: [{ file, path: {} }] }));

		assert.ok(result instanceof JsonRpcError, `Expected instance of ${JsonRpcError.name}`);
		assert.ok((result as JsonRpcError).data.err.includes('Expected string'));
	});

	it('fails when "path" is not a readable file path', async () => {
		await unlink(tmpFilePath);

		const result = await handleUploadEvents(
			createMockRequest({ method: 'app:executePreFileUpload', params: [{ file, path: tmpFilePath }] }),
		);

		assert.ok(result instanceof JsonRpcError, `Expected instance of ${JsonRpcError.name}`);
		assert.deepStrictEqual((result as JsonRpcError).data.code, 'ENOENT');
	});
});
