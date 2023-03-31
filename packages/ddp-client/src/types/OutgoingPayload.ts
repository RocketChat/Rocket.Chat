import type { ConnectPayload } from './connectionPayloads';
import type { PingPayload, PongPayload } from './heartbeatsPayloads';
import type { MethodPayload } from './methodsPayloads';
import type { ClientPublicationPayloads } from './publicationPayloads';

/**
 * @category outgoing
 */
export type OutgoingPayload = PingPayload | PongPayload | ConnectPayload | ClientPublicationPayloads | MethodPayload;
