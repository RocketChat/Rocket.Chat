import { RequestObject } from 'jsonrpc-lite';

import { Logger } from './logger';

export type RequestContext = RequestObject & {
	context: {
		logger: Logger;
		[key: string]: unknown;
	}
};
