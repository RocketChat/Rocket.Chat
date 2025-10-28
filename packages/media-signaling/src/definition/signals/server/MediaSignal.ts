import type { ServerMediaSignalNewCall } from './new';
import type { ServerMediaSignalNotification } from './notification';
import type { ServerMediaSignalRejectedCallRequest } from './rejected-call-request';
import type { ServerMediaSignalRemoteSDP } from './remote-sdp';
import type { ServerMediaSignalRequestOffer } from './request-offer';

export type ServerMediaSignal =
	| ServerMediaSignalNewCall
	| ServerMediaSignalRemoteSDP
	| ServerMediaSignalRequestOffer
	| ServerMediaSignalNotification
	| ServerMediaSignalRejectedCallRequest;

export type ServerMediaSignalType = ServerMediaSignal['type'];
