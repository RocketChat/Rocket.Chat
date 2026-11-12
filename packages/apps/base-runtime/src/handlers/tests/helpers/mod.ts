import type { App } from '@rocket.chat/apps-engine/definition/App.js';

import { Logger } from '../../../lib/logger.js';
import type { RequestDescriptor } from '../../../lib/messenger.js';
import type { RequestContext } from '../../../lib/requestContext.js';

export function createMockRequest({ method, params }: RequestDescriptor): RequestContext {
	return {
		jsonrpc: '2.0' as const,
		id: 1,
		method,
		params,
		context: {
			logger: new Logger(method),
		},
	};
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
