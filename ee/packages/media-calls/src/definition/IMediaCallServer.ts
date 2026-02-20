import type { IUser } from '@rocket.chat/core-typings';
import type { Emitter } from '@rocket.chat/emitter';
import type { ClientMediaSignal, ClientMediaSignalBody, ServerMediaSignal } from '@rocket.chat/media-signaling';

import type { InternalCallParams } from './common';

export type MediaCallServerEvents = {
	callUpdated: { callId: string; dtmf?: ClientMediaSignalBody<'dtmf'> };
	signalRequest: { toUid: IUser['_id']; signal: ServerMediaSignal };
	historyUpdate: { callId: string };
};

export interface IMediaCallServerSettings {
	internalCalls: {
		requireExtensions: boolean;
		routeExternally: 'never' | 'preferably' | 'always';
	};

	sip: {
		enabled: boolean;
		drachtio: {
			host: string;
			port: number;
			secret: string;
		};
		sipServer: {
			host: string;
			port: number;
		};
	};

	permissionCheck: (uid: IUser['_id'], callType: 'internal' | 'external' | 'any') => Promise<boolean>;
}

export interface IMediaCallServer {
	emitter: Emitter<MediaCallServerEvents>;

	// functions that trigger events
	sendSignal(toUid: IUser['_id'], signal: ServerMediaSignal): void;
	reportCallUpdate(params: { callId: string; dtmf?: ClientMediaSignalBody<'dtmf'> }): void;
	updateCallHistory(params: { callId: string }): void;

	// functions that are run on events
	receiveSignal(fromUid: IUser['_id'], signal: ClientMediaSignal): void;
	receiveCallUpdate(params: { callId: string; dtmf?: ClientMediaSignalBody<'dtmf'> }): void;

	// extra functions available to the service
	hangupExpiredCalls(): Promise<void>;
	scheduleExpirationCheck(): void;
	configure(settings: IMediaCallServerSettings): void;

	requestCall(params: InternalCallParams): Promise<void>;

	permissionCheck(uid: IUser['_id'], callType: 'internal' | 'external' | 'any'): Promise<boolean>;
}
