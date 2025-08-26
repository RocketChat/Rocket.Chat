import type { IUser } from '@rocket.chat/core-typings';
import type { Emitter } from '@rocket.chat/emitter';
import type { ClientMediaSignal, ServerMediaSignal } from '@rocket.chat/media-signaling';

export type MediaCallServerEvents = {
	callUpdated: string;
	signalRequest: { toUid: IUser['_id']; signal: ServerMediaSignal };
};

export interface IMediaCallServer {
	emitter: Emitter<MediaCallServerEvents>;

	// functions that trigger events
	sendSignal(toUid: IUser['_id'], signal: ServerMediaSignal): void;
	reportCallUpdate(callId: string): void;

	// functions that are run on events
	receiveSignal(fromUid: IUser['_id'], signal: ClientMediaSignal): void;
	receiveCallUpdate(callId: string): void;

	// extra functions available to the service
	hangupExpiredCalls(): Promise<void>;
	scheduleExpirationCheck(): void;
}
