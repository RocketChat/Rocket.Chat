import type { App } from '@rocket.chat/apps-engine/definition/App.ts';
import type { IPreFileUpload } from '@rocket.chat/apps-engine/definition/uploads/IPreFileUpload.ts';
import { assertNotInstanceOf } from 'https://deno.land/std@0.203.0/assert/mod.ts';
import { beforeEach, describe, it } from 'https://deno.land/std@0.203.0/testing/bdd.ts';
import jsonrpc, { JsonRpcError } from 'jsonrpc-lite';

import handleUploadEvents from '../app/handleUploadEvents.ts';
import { AppObjectRegistry } from '../../AppObjectRegistry.ts';

describe('handlers > upload', () => {
	let app: App & IPreFileUpload;

	beforeEach(() => {
		// @TODO extract to a utility that builds an app mock
		app = {
			extendConfiguration: () => {},
			executePreFileUpload: () => Promise.resolve(),
		} as unknown as App;

		AppObjectRegistry.clear();
		AppObjectRegistry.set('app', app);
	});

	it('correctly handles valid parameters', async () => {
		const path = await Deno.makeTempFile();
		const content = 'Temp file for testing';

		await Deno.writeTextFile(path, content);

		const file = {
			name: 'TempFile.txt',
			size: content.length,
			type: 'text/plain',
			rid: 'RandomRoomId',
			userId: 'RandomUserId',
		};

		const result = await handleUploadEvents(jsonrpc.request(1, 'app:executePreFileUpload', [{ file, path }]));

		console.log(result);

		assertNotInstanceOf(result, JsonRpcError, 'result is JsonRpcError');

		await Deno.remove(path).catch(() => console.warn(`Failed to remove temp file at ${path}`));
	});
});
