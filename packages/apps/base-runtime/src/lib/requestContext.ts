import type { RequestObject } from 'jsonrpc-lite';

import type { Logger } from './logger';

export type RequestContext = RequestObject & {
	context: {
		logger: Logger;
		[key: string]: unknown;
	};
};
