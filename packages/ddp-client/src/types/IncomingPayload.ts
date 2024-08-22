import type { ConnectedPayload, FailedPayload } from './connectionPayloads';
import type { PingPayload, PongPayload } from './heartbeatsPayloads';
import type { ServerMethodPayloads } from './methodsPayloads';
import type { ServerPublicationPayloads } from './publicationPayloads';

/**
 * @category incoming
 */
export type IncomingPayload =
	| PingPayload
	| PongPayload
	| ServerPublicationPayloads
	| ServerMethodPayloads
	| ConnectedPayload
	| FailedPayload;
