import type { IOutboundMessageProviders } from '@rocket.chat/apps-engine/definition/outboundCommunication/IOutboundCommsProvider.ts';
import { JsonRpcError, Defined, RequestObject } from 'jsonrpc-lite';

import { AppObjectRegistry } from '../AppObjectRegistry.ts';
import { AppAccessorsInstance } from '../lib/accessors/mod.ts';
import { Logger } from '../lib/logger.ts';

export default async function outboundMessageHandler(request: RequestObject): Promise<JsonRpcError | Defined> {
	const { method: call, params } = request;
	const [, providerName, methodName] = call.split(':');

	const provider = AppObjectRegistry.get<IOutboundMessageProviders>(`outboundCommunication:${providerName}`);
	if (!provider) {
		return new JsonRpcError('error-invalid-provider', -32000);
	}
	const method = provider[methodName as keyof IOutboundMessageProviders];
	const logger = AppObjectRegistry.get<Logger>('logger');
	const args = (params as Array<unknown>) ?? [];

	try {
		logger?.debug(`Executing ${methodName} on outbound communication provider...`);

		// deno-lint-ignore ban-types
		return await (method as Function).apply(provider, [
			...args,
			AppAccessorsInstance.getReader(),
			AppAccessorsInstance.getModifier(),
			AppAccessorsInstance.getHttp(),
			AppAccessorsInstance.getPersistence(),
		]);
	} catch (e) {
		return new JsonRpcError(e.message, -32000);
	}
}
