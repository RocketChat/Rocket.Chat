import { Buffer } from 'node:buffer';

import type { App } from '@rocket.chat/apps-engine/definition/App.ts';
import { AppsEngineException } from '@rocket.chat/apps-engine/definition/exceptions/AppsEngineException.ts';
import type { IFileUploadContext } from '@rocket.chat/apps-engine/definition/uploads/IFileUploadContext.ts'
import type { IUploadDetails } from '@rocket.chat/apps-engine/definition/uploads/IUploadDetails.ts'
import { toArrayBuffer } from '@std/streams';
import { Defined, JsonRpcError } from 'jsonrpc-lite';

import { AppObjectRegistry } from '../../AppObjectRegistry.ts';
import { assertAppAvailable, assertHandlerFunction, isRecord } from '../lib/assertions.ts';
import { AppAccessorsInstance } from '../../lib/accessors/mod.ts';

export const uploadEvents = ['executePreFileUpload'] as const;

function assertIsUpload(v: unknown): asserts v is IUploadDetails {
	if (isRecord(v) && !!v.rid && (!!v.userId || !!v.visitorToken)) return;

	throw JsonRpcError.invalidParams({ err: `Invalid 'file' parameter. Expected IUploadDetails, got`, value: v });
}

function assertString(v: unknown): asserts v is string {
	if (v && typeof v === 'string') return;

	throw JsonRpcError.invalidParams({ err: `Invalid 'path' parameter. Expected string, got`, value: v });
}

export default async function handleUploadEvents(method: typeof uploadEvents[number], params: unknown): Promise<Defined | JsonRpcError> {
	const [{ file, path }] = params as [{ file?: IUpload, path?: string }];

	const app = AppObjectRegistry.get<App>('app');
	const handlerFunction = app?.[method as keyof App] as unknown;

	try {
		assertAppAvailable(app);
		assertHandlerFunction(handlerFunction);
		assertIsUpload(file);
		assertString(path);

		using tempFile = await Deno.open(path, { read: true, create: false });
		let context: IFileUploadContext;

		switch (method) {
			case 'executePreFileUpload': {
				const fileContents = await toArrayBuffer(tempFile.readable);
				context = { file, content: Buffer.from(fileContents) };
				break;
			}
		}

		return await handlerFunction.call(
			app,
			context,
			AppAccessorsInstance.getReader(),
			AppAccessorsInstance.getHttp(),
			AppAccessorsInstance.getPersistence(),
			AppAccessorsInstance.getModifier(),
		);
	} catch(e) {
		if (e?.name === AppsEngineException.name) {
			return new JsonRpcError(e.message, AppsEngineException.JSONRPC_ERROR_CODE, { name: e.name });
		}

		if (e instanceof JsonRpcError) {
			return e;
		}

		return JsonRpcError.internalError({
			err: e.message,
			...(e.code && { code: e.code }),
		});
	}
}
