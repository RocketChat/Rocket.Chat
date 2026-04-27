import type { ServerMediaSignalNewCall } from './new';
import type { ServerMediaSignalNotification } from './notification';
import type { ServerMediaSignalRegistered } from './registered';
import type { ServerMediaSignalRejectedCallRequest } from './rejected-call-request';
import type { ServerMediaSignalRemoteSDP } from './remote-sdp';
import type { ServerMediaSignalRequestOffer } from './request-offer';

export type ServerMediaCallSignal =
	| ServerMediaSignalNewCall
	| ServerMediaSignalRemoteSDP
	| ServerMediaSignalRequestOffer
	| ServerMediaSignalNotification
	| ServerMediaSignalRejectedCallRequest;

export type ServerMediaSessionSignal = ServerMediaSignalRegistered;

export type ServerMediaSignal = ServerMediaCallSignal | ServerMediaSessionSignal;

export type ServerMediaSignalType = ServerMediaSignal['type'];
