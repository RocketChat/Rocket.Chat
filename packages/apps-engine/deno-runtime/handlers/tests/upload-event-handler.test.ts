// deno-lint-ignore-file no-explicit-any
import { Buffer } from 'node:buffer';

import type { App } from '@rocket.chat/apps-engine/definition/App.ts';
import type { IPreFileUpload } from '@rocket.chat/apps-engine/definition/uploads/IPreFileUpload.ts';
import type { IUploadDetails } from '@rocket.chat/apps-engine/definition/uploads/IUploadDetails.ts';
import { assertInstanceOf, assertNotInstanceOf, assertEquals, assertStringIncludes } from 'https://deno.land/std@0.203.0/assert/mod.ts';
import { afterEach, beforeEach, describe, it } from 'https://deno.land/std@0.203.0/testing/bdd.ts';
import { assertSpyCalls, spy } from 'https://deno.land/std@0.203.0/testing/mock.ts';
import { JsonRpcError } from 'jsonrpc-lite';

import { createMockRequest } from './helpers/mod.ts';
import handleUploadEvents from '../app/handleUploadEvents.ts';
import { Errors } from '../lib/assertions.ts';
import { AppObjectRegistry } from '../../AppObjectRegistry.ts';

describe('handlers > upload', () => {
	let app: App & IPreFileUpload;
	let path: string;
	let file: IUploadDetails;

	beforeEach(async () => {
		AppObjectRegistry.clear();

		path = await Deno.makeTempFile();

		app = {
			extendConfiguration: () => {},
			executePreFileUpload: () => Promise.resolve(),
		} as unknown as App;

		AppObjectRegistry.set('app', app);

		const content = 'Temp file for testing';

		await Deno.writeTextFile(path, content);

		file = {
			name: 'TempFile.txt',
			size: content.length,
			type: 'text/plain',
			rid: 'RandomRoomId',
			userId: 'RandomUserId',
		};
	});

	afterEach(async () => {
		await Deno.remove(path).catch((e) => e?.code !== 'ENOENT' && console.warn(`Failed to remove temp file at ${path}`, e));
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
		await Deno.remove(path);

		const result = await handleUploadEvents(createMockRequest({ method: 'app:executePreFileUpload', params: [{ file, path }] }));

		assertInstanceOf(result, JsonRpcError);
		assertEquals(result.data.code, "ENOENT");
	});
});
