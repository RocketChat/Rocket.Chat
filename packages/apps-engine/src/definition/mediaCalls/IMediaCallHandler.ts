import type {
	IMediaCallAnswerContext,
	IMediaCallDevicesContext,
	IMediaCallDialContext,
	IMediaCallDtmfContext,
	IMediaCallHangupContext,
	IMediaCallHoldContext,
	IMediaCallMuteContext,
	IMediaCallTransferContext,
} from './IMediaCallControlContext';
import type { IMediaCallDevice } from './IMediaCallDevice';
import type { IMediaCallEndedContext } from './IMediaCallEndedContext';
import type { IMediaCallParticipantJoinedContext } from './IMediaCallParticipantJoinedContext';
import type { IMediaCallStartedContext } from './IMediaCallStartedContext';
import type { IPreMediaCallCreatedContext } from './IPreMediaCallCreatedContext';
import type { MediaCallCreateEventResult } from './MediaCallEventResult';
import type { IHttp, IModify, IPersistence, IRead } from '../accessors';
import { AppMethod } from '../metadata';

/**
 * The media-call lifecycle events.
 *
 * Implementing the interface subscribes the app to media calls;
 * implementing a given method subscribes it to that event, so
 * an app that only cares about calls ending implements only
 * `executePostMediaCallEnded`.
 *
 * Media calls are the 1:1 direct audio/video calls, not video conferences, and
 * they are strictly two-party — see `IMediaCallParticipantJoinedContext` for how
 * that shapes the join event.
 */
export interface IMediaCallHandler {
	/**
	 * Called before a media call is created.
	 *
	 * A slow handler delays the call from ringing.
	 *
	 * May `pass`, `patch` the call's requested features, or
	 * `prevent` the call from being created at all.
	 */
	[AppMethod.EXECUTE_PRE_MEDIA_CALL_CREATED]?(
		context: IPreMediaCallCreatedContext,
		read: IRead,
		http: IHttp,
		persistence: IPersistence,
		modify: IModify,
	): Promise<MediaCallCreateEventResult>;

	/** Called once media is flowing on a call. */
	[AppMethod.EXECUTE_POST_MEDIA_CALL_STARTED]?(
		context: IMediaCallStartedContext,
		read: IRead,
		http: IHttp,
		persistence: IPersistence,
		modify: IModify,
	): Promise<void>;

	/** Called when the callee accepts a call. */
	[AppMethod.EXECUTE_POST_MEDIA_CALL_PARTICIPANT_JOINED]?(
		context: IMediaCallParticipantJoinedContext,
		read: IRead,
		http: IHttp,
		persistence: IPersistence,
		modify: IModify,
	): Promise<void>;

	/** Called once a call has ended, for any reason. */
	[AppMethod.EXECUTE_POST_MEDIA_CALL_ENDED]?(
		context: IMediaCallEndedContext,
		read: IRead,
		http: IHttp,
		persistence: IPersistence,
		modify: IModify,
	): Promise<void>;

	/**
	 * `cti` call control (apps that handle calls on external devices/gateways).
	 *
	 * Implementing any of these opts the app into handling `cti` calls: Rocket.Chat lists the app's
	 * devices in the call device picker and dispatches control to the app that owns each call. An app
	 * reports call progress back through the media-call write accessor, it does not return it here.
	 */

	/** Lists the devices the given user can place/receive cti calls on. */
	[AppMethod.EXECUTE_MEDIA_CALL_GET_DEVICES]?(
		context: IMediaCallDevicesContext,
		read: IRead,
		http: IHttp,
		persistence: IPersistence,
		modify: IModify,
	): Promise<IMediaCallDevice[]>;

	/** Originate an outbound call on the chosen device. */
	[AppMethod.EXECUTE_MEDIA_CALL_DIAL]?(
		context: IMediaCallDialContext,
		read: IRead,
		http: IHttp,
		persistence: IPersistence,
		modify: IModify,
	): Promise<void>;

	/** Answer an inbound call on the device. */
	[AppMethod.EXECUTE_MEDIA_CALL_ANSWER]?(
		context: IMediaCallAnswerContext,
		read: IRead,
		http: IHttp,
		persistence: IPersistence,
		modify: IModify,
	): Promise<void>;

	[AppMethod.EXECUTE_MEDIA_CALL_HANGUP]?(
		context: IMediaCallHangupContext,
		read: IRead,
		http: IHttp,
		persistence: IPersistence,
		modify: IModify,
	): Promise<void>;

	[AppMethod.EXECUTE_MEDIA_CALL_MUTE]?(
		context: IMediaCallMuteContext,
		read: IRead,
		http: IHttp,
		persistence: IPersistence,
		modify: IModify,
	): Promise<void>;

	[AppMethod.EXECUTE_MEDIA_CALL_HOLD]?(
		context: IMediaCallHoldContext,
		read: IRead,
		http: IHttp,
		persistence: IPersistence,
		modify: IModify,
	): Promise<void>;

	[AppMethod.EXECUTE_MEDIA_CALL_TRANSFER]?(
		context: IMediaCallTransferContext,
		read: IRead,
		http: IHttp,
		persistence: IPersistence,
		modify: IModify,
	): Promise<void>;

	[AppMethod.EXECUTE_MEDIA_CALL_DTMF]?(
		context: IMediaCallDtmfContext,
		read: IRead,
		http: IHttp,
		persistence: IPersistence,
		modify: IModify,
	): Promise<void>;
}
