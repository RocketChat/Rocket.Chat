import type { ConnectedPayload, FailedPayload } from './connectionPayloads.js';
import type { PingPayload, PongPayload } from './heartbeatsPayloads.js';
import type { ServerMethodPayloads } from './methodsPayloads.js';
import type { ServerPublicationPayloads } from './publicationPayloads.js';

/**
 * @category incoming
 */
export type IncomingPayload =
	PingPayload | PongPayload | ServerPublicationPayloads | ServerMethodPayloads | ConnectedPayload | FailedPayload;
