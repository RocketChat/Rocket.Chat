import type {
	IMediaCallAnswerContext,
	IMediaCallDevice,
	IMediaCallDevicesContext,
	IMediaCallDialContext,
	IMediaCallDtmfContext,
	IMediaCallEndedContext,
	IMediaCallHangupContext,
	IMediaCallHoldContext,
	IMediaCallMuteContext,
	IMediaCallParticipantJoinedContext,
	IMediaCallStartedContext,
	IMediaCallTransferContext,
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
/**
 * `cti` call control dispatched to the app handling a call. These are fire-and-forget: the app that
 * owns the call acts on it and reports progress back through the write accessor, while apps that do
 * not own the call ignore it.
 */
export type MediaCallControlEvent =
	| { method: AppMethod.EXECUTE_MEDIA_CALL_DIAL; context: IMediaCallDialContext }
	| { method: AppMethod.EXECUTE_MEDIA_CALL_ANSWER; context: IMediaCallAnswerContext }
	| { method: AppMethod.EXECUTE_MEDIA_CALL_HANGUP; context: IMediaCallHangupContext }
	| { method: AppMethod.EXECUTE_MEDIA_CALL_MUTE; context: IMediaCallMuteContext }
	| { method: AppMethod.EXECUTE_MEDIA_CALL_HOLD; context: IMediaCallHoldContext }
	| { method: AppMethod.EXECUTE_MEDIA_CALL_TRANSFER; context: IMediaCallTransferContext }
	| { method: AppMethod.EXECUTE_MEDIA_CALL_DTMF; context: IMediaCallDtmfContext };

/** Query dispatched to every cti-capable app to list a user's devices; the results are aggregated. */
export type MediaCallGetDevicesEvent = { method: AppMethod.EXECUTE_MEDIA_CALL_GET_DEVICES; context: IMediaCallDevicesContext };

export type MediaCallEvent =
	| { method: AppMethod.EXECUTE_PRE_MEDIA_CALL_CREATED; context: IPreMediaCallCreatedContext }
	| { method: AppMethod.EXECUTE_POST_MEDIA_CALL_STARTED; context: IMediaCallStartedContext }
	| { method: AppMethod.EXECUTE_POST_MEDIA_CALL_PARTICIPANT_JOINED; context: IMediaCallParticipantJoinedContext }
	| { method: AppMethod.EXECUTE_POST_MEDIA_CALL_ENDED; context: IMediaCallEndedContext }
	| MediaCallControlEvent
	| MediaCallGetDevicesEvent;

/** A device an app reported, tagged by the host with the id of the app that owns it. */
export type MediaCallDeviceWithApp = IMediaCallDevice & { appId: string };

/**
 * What the pre-media-call-create event resolved to once every app had its say:
 * either the first app to `prevent` the call, or the context as patched by all of
 * them.
 */
export type PreMediaCallCreatedOutcome = HostEventResult<MediaCallCreateEventResult>;
