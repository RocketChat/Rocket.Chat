import type { ServerMediaSignalNewCall } from './new.js';
import type { ServerMediaSignalNotification } from './notification.js';
import type { ServerMediaSignalRegistered } from './registered.js';
import type { ServerMediaSignalRejectedCallRequest } from './rejected-call-request.js';
import type { ServerMediaSignalRemoteSDP } from './remote-sdp.js';
import type { ServerMediaSignalRequestOffer } from './request-offer.js';

export type ServerMediaCallSignal =
	| ServerMediaSignalNewCall
	| ServerMediaSignalRemoteSDP
	| ServerMediaSignalRequestOffer
	| ServerMediaSignalNotification
	| ServerMediaSignalRejectedCallRequest;

export type ServerMediaSessionSignal = ServerMediaSignalRegistered;

export type ServerMediaSignal = ServerMediaCallSignal | ServerMediaSessionSignal;

export type ServerMediaSignalType = ServerMediaSignal['type'];
