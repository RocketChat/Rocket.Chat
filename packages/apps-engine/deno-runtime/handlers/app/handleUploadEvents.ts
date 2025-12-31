import { Buffer } from 'node:buffer';
import { Defined, JsonRpcError } from 'jsonrpc-lite';
import type { App } from '@rocket.chat/apps-engine/definition/App.ts';
import type { IUpload } from '@rocket.chat/apps-engine/definition/uploads/IUpload.ts'
import type { IFileUploadContext, IFileUploadStreamContext } from '@rocket.chat/apps-engine/definition/uploads/IFileUploadContext.ts'
import { toArrayBuffer } from '@std/streams';

import { AppObjectRegistry } from '../../AppObjectRegistry.ts';
import { assertAppAvailable, assertHandlerFunction } from '../lib/assertions.ts';
import { AppAccessorsInstance } from '../../lib/accessors/mod.ts';

export const uploadEvents = ['executePreFileUpload', 'executePreFileUploadStream'] as const;
type a = `${typeof uploadEvents[number]}`;

function assertIsUpload(v: unknown): asserts v is IUpload {
	const { id } = (v || {}) as { id: string };

	if (v && typeof v === 'object' && id && typeof id === 'string') return;

	throw JsonRpcError.invalidParams({ err: `Invalid 'file' parameter. Expected IUploadDetails, got ${v}` });
}

function assertString(v: unknown): asserts v is string {
	if (v && typeof v === 'string') return;

	throw JsonRpcError.invalidParams({ err: `Invalid 'path' parameter. Expected string, got ${v}` });
}

export default async function handleUploadEvents(method: typeof uploadEvents[number], params: unknown): Promise<Defined | JsonRpcError> {
	const [fileDetails, tempPath] = params as [IUpload?, string?];

	const app = AppObjectRegistry.get<App>('app');
	const handlerFunction = app?.[method as keyof App] as unknown;

	try {
		assertAppAvailable(app);
		assertHandlerFunction(handlerFunction);
		assertIsUpload(fileDetails);
		assertString(tempPath);

		using tempFile = await Deno.open(tempPath, { read: true, create: false });
		let context: IFileUploadContext | IFileUploadStreamContext;

		switch (method) {
			case 'executePreFileUpload': {
				const fileContents = await toArrayBuffer(tempFile.readable);
				context = { file: fileDetails, content: Buffer.from(fileContents) };
				break;
			}
			case 'executePreFileUploadStream':
				context = { file: fileDetails, stream: tempFile.readable };
				break;
		}

		return handlerFunction.call(
			app,
			context,
			AppAccessorsInstance.getReader(),
			AppAccessorsInstance.getHttp(),
			AppAccessorsInstance.getPersistence(),
			AppAccessorsInstance.getModifier(),
		);
	} catch(e) {
		if (e instanceof JsonRpcError) {
			return e;
		}

		return JsonRpcError.internalError({
			err: e.message,
			...(e.code && { code: e.code }),
		});
	}
}
