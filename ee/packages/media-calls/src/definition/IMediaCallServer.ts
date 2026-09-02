import type { CallPreventionRecord, IMediaCall, IUser, MediaCallContact } from '@rocket.chat/core-typings';
import type { Emitter } from '@rocket.chat/emitter';
import type { CallFeature, ClientMediaSignal, ClientMediaSignalBody, ServerMediaSignal } from '@rocket.chat/media-signaling';

import type { InternalCallParams, SignalProcessingOptions } from './common';

export type VoipPushNotificationType = 'incoming_call' | 'remoteEnded' | 'answeredElsewhere' | 'declinedElsewhere' | 'unanswered';
export type VoipPushNotificationEventType = 'new' | 'answer' | 'end';

export type MediaCallServerEvents = {
	callUpdated: { callId: string; dtmf?: ClientMediaSignalBody<'dtmf'> };
	/**
	 * The three lifecycle events carry the call as it was when the transition happened, not just
	 * its id: a listener that reads the call again may already see a later transition, and would
	 * then describe the wrong thing.
	 */
	callAccepted: { call: IMediaCall };
	callActivated: { call: IMediaCall };
	callEnded: { call: IMediaCall };
	signalRequest: { toUid: IUser['_id']; signal: ServerMediaSignal };
	historyUpdate: { callId: string };
	pushNotificationRequest: { callId: string; event: VoipPushNotificationEventType };
};

export type PreCallCreatedHookParams = {
	caller: MediaCallContact;
	callee: MediaCallContact;
	createdBy: MediaCallContact;
	features: CallFeature[];
	parentCallId?: string;
	divertedBy?: MediaCallContact;
};

export type PreCallCreatedHookResult =
	| {
			prevented: true;
			/** Recorded in the server logs, not shown to anyone. */
			reason?: string;
			/**
			 * Kept on the call the refusal writes, and read by every surface that reports it later.
			 * A hook that prevents a call always names what refused it and why.
			 */
			preventedBy: CallPreventionRecord;
	  }
	| {
			prevented: false;
			/** Replaces the requested features when present; still subject to the workspace's feature rules. */
			features?: CallFeature[];
	  };

/**
 * Hooks the server may run at points of the call lifecycle that need to be
 * awaited. Injected by the host so that this package doesn't have to know what is
 * on the other side of them - today it's the Apps-Engine.
 */
export type MediaCallHooks = {
	onPreCallCreated?: (params: PreCallCreatedHookParams) => Promise<PreCallCreatedHookResult>;
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

	mobileRinging: boolean;

	permissionCheck: (uid: IUser['_id'], callType: 'internal' | 'external' | 'any') => Promise<boolean>;
	isFeatureAvailableForUser: (uid: IUser['_id'], feature: CallFeature) => boolean;
}

export interface IMediaCallServer {
	emitter: Emitter<MediaCallServerEvents>;

	// functions that trigger events
	sendSignal(toUid: IUser['_id'], signal: ServerMediaSignal): void;
	reportCallUpdate(params: { callId: string; dtmf?: ClientMediaSignalBody<'dtmf'> }): void;
	updateCallHistory(params: { callId: string }): void;
	sendPushNotification(params: { callId: string; event: VoipPushNotificationEventType }): void;

	// functions that are run on events
	receiveSignal(fromUid: IUser['_id'], signal: ClientMediaSignal, options?: SignalProcessingOptions): Promise<void>;
	receiveCallUpdate(params: { callId: string; dtmf?: ClientMediaSignalBody<'dtmf'> }): void;

	// extra functions available to the service
	hangupExpiredCalls(): Promise<void>;
	scheduleExpirationCheck(): void;
	configure(settings: IMediaCallServerSettings): void;
	setHooks(hooks: MediaCallHooks): void;

	runPreCallCreatedHook(params: PreCallCreatedHookParams): Promise<PreCallCreatedHookResult>;

	requestCall(params: InternalCallParams): Promise<void>;

	permissionCheck(uid: IUser['_id'], callType: 'internal' | 'external' | 'any'): Promise<boolean>;
	isFeatureAvailableForUser(uid: IUser['_id'], feature: CallFeature): boolean;
}
