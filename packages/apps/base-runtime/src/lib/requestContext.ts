import type { RequestObject } from './jsonrpc.js';
import type { Logger } from './logger.js';

export type RequestContext = RequestObject & {
	context: {
		logger: Logger;
		[key: string]: unknown;
	};
};
