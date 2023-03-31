import type { ConnectPayload } from './ConnectingPayload';
import type { PingPayload, PongPayload } from './HeartbeatPayloads';
import type { MethodPayload } from './MethodPayloads';
import type { ClientPublicationPayloads } from './PublishPayloads';

export type OutgoingPayload = PingPayload | PongPayload | ConnectPayload | ClientPublicationPayloads | MethodPayload;
