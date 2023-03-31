import type { ConnectedPayload, FailedPayload } from './ConnectingPayload';
import type { PingPayload, PongPayload } from './HeartbeatPayloads';
import type { ServerMethodPayloads } from './MethodPayloads';
import type { ServerPublicationPayloads, SubscribePayload, UnsubscribePayload } from './PublishPayloads';

export type IncomingPayload =
	| PingPayload
	| PongPayload
	| ServerPublicationPayloads
	| ServerMethodPayloads
	| ConnectedPayload
	| FailedPayload
	| SubscribePayload
	| UnsubscribePayload;
