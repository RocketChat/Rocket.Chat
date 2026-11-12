import type { ConnectPayload } from './connectionPayloads.js';
import type { PingPayload, PongPayload } from './heartbeatsPayloads.js';
import type { MethodPayload } from './methodsPayloads.js';
import type { ClientPublicationPayloads } from './publicationPayloads.js';

/**
 * @category outgoing
 */
export type OutgoingPayload = PingPayload | PongPayload | ConnectPayload | ClientPublicationPayloads | MethodPayload;
