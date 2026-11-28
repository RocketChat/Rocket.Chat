import type { RequestObject } from '@rocket.chat/apps/protocol/dist/framing/jsonrpc';

import type { Logger } from './logger';

export type RequestContext = RequestObject & {
	context: {
		logger: Logger;
		[key: string]: unknown;
	};
};
