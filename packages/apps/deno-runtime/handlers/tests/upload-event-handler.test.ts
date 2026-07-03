// deno-lint-ignore-file no-explicit-any
import { Buffer } from 'node:buffer';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { App } from '@rocket.chat/apps-engine/definition/App';
import type { IPreFileUpload } from '@rocket.chat/apps-engine/definition/uploads/IPreFileUpload';
import type { IUploadDetails } from '@rocket.chat/apps-engine/definition/uploads/IUploadDetails';
import { assertInstanceOf, assertNotInstanceOf, assertEquals, assertStringIncludes } from 'https://deno.land/std@0.203.0/assert/mod.ts';
import { afterEach, beforeEach, describe, it } from 'https://deno.land/std@0.203.0/testing/bdd.ts';
import { assertSpyCalls, spy } from 'https://deno.land/std@0.203.0/testing/mock.ts';
import { JsonRpcError } from 'jsonrpc-lite';

import { createMockRequest } from './helpers/mod';
import handleUploadEvents from '../app/handleUploadEvents';
import { Errors } from '../lib/assertions';
import { AppObjectRegistry } from '../../AppObjectRegistry';

describe('handlers > upload', () => {
	let app: App & IPreFileUpload;
	let tempDir: string;
	let path: string;
	let file: IUploadDetails;

	beforeEach(async () => {
		AppObjectRegistry.clear();

		tempDir = await mkdtemp(join(tmpdir(), 'rc-apps-upload-'));
		path = join(tempDir, 'tempfile');

		app = {
			extendConfiguration: () => {},
			executePreFileUpload: () => Promise.resolve(),
		} as unknown as App;

		AppObjectRegistry.set('app', app);

		const content = 'Temp file for testing';

		await writeFile(path, content);

		file = {
			name: 'TempFile.txt',
			size: content.length,
			type: 'text/plain',
			rid: 'RandomRoomId',
			userId: 'RandomUserId',
		};
	});

	afterEach(async () => {
		await rm(tempDir, { recursive: true, force: true }).catch((e) => console.warn(`Failed to remove temp dir at ${tempDir}`, e));
	});

	it('correctly handles valid parameters', async () => {
		const result = await handleUploadEvents(createMockRequest({ method: 'app:executePreFileUpload', params: [{ file, path }] }));

		assertNotInstanceOf(result, JsonRpcError, 'result is JsonRpcError');
	});

	it('correctly loads the file contents for IPreFileUpload', async () => {
		const _spy = spy(app as any, 'executePreFileUpload');

		const result = await handleUploadEvents(createMockRequest({ method: 'app:executePreFileUpload', params: [{ file, path }] }));

		assertNotInstanceOf(result, JsonRpcError, 'result is JsonRpcError');
		assertSpyCalls(_spy, 1);
		assertInstanceOf((_spy.calls[0].args[0] as any)?.content, Buffer);
	});

	it('fails when app object is not on registry', async () => {
		AppObjectRegistry.clear();

		const result = await handleUploadEvents(createMockRequest({ method: 'app:executePreFileUpload', params: [{ file, path }] }));

		assertInstanceOf(result, JsonRpcError);
		assertEquals(result.data.code, Errors.DRT_APP_NOT_AVAILABLE);
	});

	it('fails when the app does not implement the IPreFileUpload event handler', async () => {
		delete (app as any)['executePreFileUpload'];

		const result = await handleUploadEvents(createMockRequest({ method: 'app:executePreFileUpload', params: [{ file, path }] }));

		assertInstanceOf(result, JsonRpcError);
		assertEquals(result.data.code, Errors.DRT_EVENT_HANDLER_FUNCTION_MISSING);
	});

	it('fails when "file" is not a proper IUploadDetails object', async () => {
		const result = await handleUploadEvents(createMockRequest({ method: 'app:executePreFileUpload', params: [{ file: { nope: "bad" }, path }] }));

		assertInstanceOf(result, JsonRpcError);
		assertStringIncludes(result.data.err, 'Expected IUploadDetails');
	});

	it('fails when "path" is not a proper string', async () => {
		const result = await handleUploadEvents(createMockRequest({ method: 'app:executePreFileUpload', params: [{ file, path: {} }] }));

		assertInstanceOf(result, JsonRpcError);
		assertStringIncludes(result.data.err, 'Expected string');
	});

	it('fails when "path" is not a readable file path', async () => {
		await rm(path);

		const result = await handleUploadEvents(createMockRequest({ method: 'app:executePreFileUpload', params: [{ file, path }] }));

		assertInstanceOf(result, JsonRpcError);
		assertEquals(result.data.code, "ENOENT");
	});
});
