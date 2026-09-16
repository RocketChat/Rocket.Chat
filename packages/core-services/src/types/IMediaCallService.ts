import type { IMediaCall, IUser, MediaCallContact } from '@rocket.chat/core-typings';
import type { ClientMediaSignal, ServerMediaCallSignal, ClientMediaSignalAnswer } from '@rocket.chat/media-signaling';

export interface IMediaCallService {
	answerCall(uid: IUser['_id'], params: Omit<ClientMediaSignalAnswer, 'type'>): Promise<IMediaCall>;
	processSignal(fromUid: IUser['_id'], signal: ClientMediaSignal): Promise<void>;
	processSerializedSignal(fromUid: IUser['_id'], signal: string): Promise<void>;
	hangupExpiredCalls(): Promise<void>;
	getUserStateSignals(uid: IUser['_id'], contractId: string): Promise<ServerMediaCallSignal[]>;
	escalateCall(uid: IUser['_id'], params: { callId: string }): Promise<string>;
	hangupAutoEscalatedCall(call: IMediaCall, uid: IUser['_id']): Promise<void>;
	flagAsRemotelyEscalatedByCallId(callId: string): Promise<void>;

	// cti (app-controlled device calls)
	getUserMediaDevices(uid: IUser['_id']): Promise<{ id: string; name: string; appId: string }[]>;
	// app -> host intake
	createIncomingCtiCall(params: { userId: IUser['_id']; from: MediaCallContact; device?: string; features?: string[] }): Promise<void>;
	reportCtiCallRinging(callId: string): Promise<void>;
	reportCtiCallAnswered(callId: string, features?: string[]): Promise<void>;
	reportCtiCallActive(callId: string): Promise<void>;
	reportCtiCallEnded(callId: string, reason?: string): Promise<void>;
	reportCtiCallState(
		callId: string,
		state: { muted?: boolean; held?: boolean; remoteMuted?: boolean; remoteHeld?: boolean },
	): Promise<void>;
}
