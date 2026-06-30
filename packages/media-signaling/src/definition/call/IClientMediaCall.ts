import type { Emitter } from '@rocket.chat/emitter';

import type { CallEvents } from './CallEvents';
import type {
	AnyClientMediaCallParticipant,
	IClientMediaCallLocalParticipant,
	IClientMediaCallRemoteParticipant,
} from './IClientMediaCallParticipant';
import type { CallActorType } from './common';

export type CallService = 'webrtc';

export const callFeatureList = ['audio', 'screen-share', 'transfer', 'hold'] as const;

export type CallFeature = (typeof callFeatureList)[number];

export const callStateList = [
	'none', // trying to call with no idea if it'll reach anyone
	'ringing', // call has been acknoledged by the callee's agent, but no response about them accepting it or not
	'accepted', // call has been accepted and the webrtc offer is being exchanged
	'active', // webrtc connection has been established
	'renegotiating', // a webrtc connection had been established before, but a new one is being negotiated
	'hangup', // call is over
] as const;

export type CallState = (typeof callStateList)[number];

export const callHangupReasonList = [
	'normal', // User explicitly hanged up
	'remote', // The client was told the call is over
	'rejected', // The callee rejected the call
	'unavailable', // The actor is not available
	'transfer', // one of the users requested the other be transferred to someone else
	'not-answered', // max ringing duration was reached with no answer from the other user
	'timeout-local-track', // Timeout waiting for the local audio track
	'timeout-remote-sdp', // Timeout waiting for the remote SDP
	'timeout-local-sdp', // Timeout while generating the local SDP + waiting for ICE Gathering
	'timeout-activation', // Timeout connecting to the negotiated session
	'timeout', // The call state hasn't progressed for too long
	'signaling-error', // Hanging up because of an error during the signal processing
	'service-error', // Hanging up because of an error setting up the service connection
	'media-error', // Hanging up because of an error setting up the media connection
	'input-error', // Something wrong with the audio input track on the client
	'error', // Hanging up because of an unidentified error
	'unknown', // One of the call's signed users reported they don't know this call
	'another-client', // One of the call's users requested a hangup from a different client session than the one where the call is happening
] as const;

export type CallHangupReason = (typeof callHangupReasonList)[number];

export const callAnswerList = [
	'accept', // actor accepts the call
	'reject', // actor rejects the call
	'ack', // agent confirms the actor is reachable
	'unavailable', // agent reports the actor is unavailable
] as const;

export type CallAnswer = (typeof callAnswerList)[number];

export const callNotificationList = [
	'accepted', // notify that the call has been accepted by both actors
	'active', // notify that call activity was confirmed
	'hangup', // notify that the call is over;
	'trying', // notify that the other client is connecting but still need more time
] as const;

export type CallNotification = (typeof callNotificationList)[number];

export const callRejectedReasonList = [
	'invalid-call-id', // the call id can't be used for a new call
	'invalid-contract-id', // this specific contract can't request this call
	'existing-call-id', // the call already exists with a different callee or contract
	'already-requested', // the request is valid, but a call matching its params is already underway
	'unsupported', // no matching supported services between actors
	'unavailable', // the callee is unavailable
	'busy', // the actor who requested the call is supposedly busy
	'invalid-call-params', // something is wrong with the params (eg. no valid route between caller and callee)
	'forbidden', // one of the actors on the call doesn't have permission for it
] as const;

export type CallRejectedReason = (typeof callRejectedReasonList)[number];

export const callFlagList = ['internal', 'create-data-channel'];

export type CallFlag = (typeof callFlagList)[number];

export interface IClientMediaCall {
	callId: string;

	state: CallState;
	ignored: boolean;
	signed: boolean;
	hidden: boolean;
	/* busy = state >= 'accepted' && state < 'hangup' */
	busy: boolean;

	/** The timestamp of the moment the call was marked as active for the first time */
	activeTimestamp?: Date;

	/** if the call was requested by this session, then this will have the ID used to request the call, otherwise it will be the same as callId */
	readonly tempCallId: string;
	/** confirmed indicates if the call exists on the server */
	readonly confirmed: boolean;

	emitter: Emitter<CallEvents>;

	accept(): void;
	reject(): void;
	hangup(): void;
	requestScreenShare(requested: boolean): void;
	setScreenVideoTrack(videoTrack: MediaStreamTrack | null): Promise<void>;
	hasScreenVideoTrack(): boolean;
	canHaveScreenVideoTrack(): boolean;
	transfer(callee: { type: CallActorType; id: string }): void;

	sendDTMF(dtmf: string, duration?: number): void;

	getStats(selector?: MediaStreamTrack | null): Promise<RTCStatsReport | null>;
	isFeatureAvailable(feature: CallFeature): boolean;
	hasFlag(flag: CallFlag): boolean;

	readonly localParticipant: IClientMediaCallLocalParticipant;
	readonly remoteParticipants: IClientMediaCallRemoteParticipant[];
	readonly participants: AnyClientMediaCallParticipant[];
}
