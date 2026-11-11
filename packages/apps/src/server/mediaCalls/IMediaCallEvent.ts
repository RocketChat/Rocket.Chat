import type {
	IMediaCallEndedContext,
	IMediaCallParticipantJoinedContext,
	IMediaCallStartedContext,
	IPreMediaCallCreatedContext,
	MediaCallCreateEventResult,
} from '@rocket.chat/apps-engine/definition/mediaCalls';
import type { AppMethod } from '@rocket.chat/apps-engine/definition/metadata';

import type { HostEventResult } from '../eventResult';

/**
 * Envelope used to dispatch a media-call event to the apps that implement
 * `IMediaCallHandler`.
 *
 * Every media-call event travels under a single `AppInterface` member, as UIKit
 * interactions do, because `IMediaCallHandler` is one interface with one optional
 * method per event: the interface is the subscription and `method` selects which
 * of its methods to call. Apps never see this envelope — the listener manager
 * hands the handler its `context` alone.
 */
export type MediaCallEvent =
	| { method: AppMethod.EXECUTE_PRE_MEDIA_CALL_CREATED; context: IPreMediaCallCreatedContext }
	| { method: AppMethod.EXECUTE_POST_MEDIA_CALL_STARTED; context: IMediaCallStartedContext }
	| { method: AppMethod.EXECUTE_POST_MEDIA_CALL_PARTICIPANT_JOINED; context: IMediaCallParticipantJoinedContext }
	| { method: AppMethod.EXECUTE_POST_MEDIA_CALL_ENDED; context: IMediaCallEndedContext };

/**
 * What the pre-media-call-create event resolved to once every app had its say:
 * either the first app to `prevent` the call, or the context as patched by all of
 * them.
 */
export type PreMediaCallCreatedOutcome = HostEventResult<MediaCallCreateEventResult>;
