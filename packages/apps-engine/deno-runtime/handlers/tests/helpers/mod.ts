import type { App } from '@rocket.chat/apps-engine/definition/App.ts';

import { Logger } from '../../../lib/logger.ts';
import { RequestDescriptor } from '../../../lib/messenger.ts';
import { RequestContext } from '../../../lib/requestContext.ts';

export function createMockRequest({ method, params }: RequestDescriptor): RequestContext {
	return {
		jsonrpc: '2.0',
		id: 1,
		method,
		params,
		context: {
			logger: new Logger(method),
		},
		serialize: () => '',
	}
}

export function createMockApp(): App {
	return {
		extendConfiguration: () => {},
		getID: () => 'mockApp',
		getLogger: () => ({
			debug: () => {},
			error: () => {},
		}),
	} as unknown as App;
}
