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
}
