import type { RequestObject } from './jsonrpc';
import type { Logger } from './logger';

export type RequestContext = RequestObject & {
	context: {
		logger: Logger;
		[key: string]: unknown;
	};
};
