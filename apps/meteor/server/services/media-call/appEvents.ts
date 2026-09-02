import { AppEvents, Apps } from '@rocket.chat/apps';
import type { EventResultMeta, MediaCallEvent, PreMediaCallCreatedOutcome } from '@rocket.chat/apps';
import type {
	IAcceptedMediaCall as IAppsAcceptedMediaCall,
	IActiveMediaCall as IAppsActiveMediaCall,
	IEndedMediaCall as IAppsEndedMediaCall,
	IMediaCall as IAppsMediaCall,
	IMediaCallActor as IAppsMediaCallActor,
	IMediaCallContact as IAppsMediaCallContact,
	IPreMediaCallCreatedContext,
	MediaCallOrigin,
} from '@rocket.chat/apps-engine/definition/mediaCalls';
import { AppMethod } from '@rocket.chat/apps-engine/definition/metadata';
import type { CallPreventionRecord, IMediaCall, MediaCallActor, MediaCallContact, ServerActor } from '@rocket.chat/core-typings';
import type { PreCallCreatedHookParams, PreCallCreatedHookResult } from '@rocket.chat/media-calls';
import { callFeatureList, type CallFeature } from '@rocket.chat/media-signaling';

import { logger } from './logger';
import { i18n } from '../../lib/i18n';
import { settings } from '../../settings';

/**
 * Maps media calls onto the shapes apps see and dispatches the media-call
 * lifecycle events to the Apps-Engine.
 *
 * Every event travels under the single `IMediaCallHandler` interface; the
 * `method` on the envelope is what tells the listener manager which of the
 * handler's optional methods to call.
 */

/** Contacts carry a per-session signing token, which is a credential: only these fields may reach an app. */
function toAppContact(contact: MediaCallContact): IAppsMediaCallContact {
	return {
		type: contact.type,
		id: contact.id,
		...(contact.username && { username: contact.username }),
		...(contact.displayName && { displayName: contact.displayName }),
		...(contact.sipExtension && { sipExtension: contact.sipExtension }),
	};
}

/**
 * The two contacts are the origin: a sip caller means the call arrived from the
 * PBX, a sip callee means it was placed out through it, and neither means it never
 * leaves the workspace. Both contacts are final before any event is built, so
 * apps do not have to reimplement the routing rules to tell the cases apart.
 *
 * A sip/sip pair cannot occur: an external callee requires a user caller, and an
 * inbound INVITE requires a user callee.
 */
function getCallOrigin(caller: MediaCallContact, callee: MediaCallContact): MediaCallOrigin {
	if (caller.type === 'sip') {
		return 'sip-inbound';
	}

	if (callee.type === 'sip') {
		return 'sip-outbound';
	}

	return 'internal';
}

function toAppActor(actor: MediaCallActor | ServerActor): IAppsMediaCallActor {
	return {
		type: actor.type,
		id: actor.id,
	};
}

function toAppMediaCall(call: IMediaCall): IAppsMediaCall {
	return {
		id: call._id,
		service: call.service,
		kind: call.kind,
		state: call.state,
		origin: getCallOrigin(call.caller, call.callee),
		createdBy: toAppContact(call.createdBy),
		createdAt: call.createdAt,
		caller: toAppContact(call.caller),
		callee: toAppContact(call.callee),
		features: call.features,
		uids: call.uids,
		ended: call.ended,
		...(call.endedAt && { endedAt: call.endedAt }),
		...(call.endedBy && { endedBy: toAppActor(call.endedBy) }),
		...(call.hangupReason && { hangupReason: call.hangupReason }),
		...(call.acceptedAt && { acceptedAt: call.acceptedAt }),
		...(call.activatedAt && { activatedAt: call.activatedAt }),
		...(call.parentCallId && { parentCallId: call.parentCallId }),
		...(call.divertedBy && { divertedBy: toAppContact(call.divertedBy) }),
	};
}

/**
 * Each post event promises the apps one timestamp on the call it carries. The
 * event is dispatched after the write that sets it, so the timestamp is there.
 * A call that arrives without it cannot keep the promise, and an app that acts on
 * a made-up time is worse off than an app that never hears about the call, so the
 * event is dropped instead.
 */
function getEventTimestamp(call: IMediaCall, field: 'activatedAt' | 'acceptedAt' | 'endedAt'): Date | undefined {
	if (!call[field]) {
		logger.warn({ msg: 'Skipped a media call event for a call that carries no timestamp for it', callId: call._id, field });
	}

	return call[field];
}

function toAppActiveMediaCall(call: IMediaCall): IAppsActiveMediaCall | undefined {
	const activatedAt = getEventTimestamp(call, 'activatedAt');

	return activatedAt && { ...toAppMediaCall(call), activatedAt };
}

function toAppAcceptedMediaCall(call: IMediaCall): IAppsAcceptedMediaCall | undefined {
	const acceptedAt = getEventTimestamp(call, 'acceptedAt');

	return acceptedAt && { ...toAppMediaCall(call), acceptedAt };
}

function toAppEndedMediaCall(call: IMediaCall): IAppsEndedMediaCall | undefined {
	const endedAt = getEventTimestamp(call, 'endedAt');

	return endedAt && { ...toAppMediaCall(call), ended: true, endedAt };
}

/** `0` for a call that never became active, and never negative. */
function getCallDurationInMs(activatedAt: Date | undefined, endedAt: Date): number {
	if (!activatedAt) {
		return 0;
	}

	return Math.max(0, endedAt.valueOf() - activatedAt.valueOf());
}

function isCallFeature(feature: string): feature is CallFeature {
	return (callFeatureList as readonly string[]).includes(feature);
}

async function triggerMediaCallEvent(event: MediaCallEvent): Promise<unknown> {
	return Apps.self?.triggerEvent(AppEvents.IMediaCallHandler, event);
}

/**
 * Every post event is reported from the call as it was when the event happened. The call is never
 * read again on the way here: by then it may already have moved on, and an app that is told about
 * an accepted call has to be told about the call that was accepted. A workspace with no apps
 * skips the work.
 */
export async function notifyAppsOfMediaCallStarted(call: IMediaCall): Promise<void> {
	if (!Apps.self) {
		return;
	}

	const activeCall = toAppActiveMediaCall(call);
	if (!activeCall) {
		// `getEventTimestamp` already logged what the call is missing
		return;
	}

	await triggerMediaCallEvent({ method: AppMethod.EXECUTE_POST_MEDIA_CALL_STARTED, context: { call: activeCall } });
}

export async function notifyAppsOfMediaCallParticipantJoined(call: IMediaCall): Promise<void> {
	if (!Apps.self) {
		return;
	}

	// Calls are strictly two-party, so the side that joins is always `call.callee`
	const acceptedCall = toAppAcceptedMediaCall(call);
	if (!acceptedCall) {
		return;
	}

	await triggerMediaCallEvent({ method: AppMethod.EXECUTE_POST_MEDIA_CALL_PARTICIPANT_JOINED, context: { call: acceptedCall } });
}

export async function notifyAppsOfMediaCallEnded(call: IMediaCall): Promise<void> {
	if (!Apps.self) {
		return;
	}

	const endedCall = toAppEndedMediaCall(call);
	if (!endedCall) {
		return;
	}

	await triggerMediaCallEvent({
		method: AppMethod.EXECUTE_POST_MEDIA_CALL_ENDED,
		context: {
			call: endedCall,
			durationMs: getCallDurationInMs(call.activatedAt, endedCall.endedAt),
		},
	});
}

/**
 * The stored copy of an app's explanation is the only copy once the app is gone, so it can't be
 * allowed to be arbitrarily long.
 */
const MAX_PREVENTION_TEXT_LENGTH = 200;

function getWorkspaceLanguage(): string {
	return settings.get<string>('Language') || 'en';
}

/** The workspace's own sentence, for an app that prevented a call and left nothing readable behind. */
function preventedByAppText(appName: string): string {
	return i18n.t('Prevented_by_app', { lng: getWorkspaceLanguage(), replace: { appName }, interpolation: { escapeValue: false } });
}

/**
 * What a reader sees once the app is uninstalled and takes its i18n namespace with it: the app's
 * own wording for the key it named, in the language the workspace runs in, ready to read on its
 * own. An app that ships no translation for that key has nothing to snapshot, so the workspace
 * answers for it - a raw key is never what a reader is left with.
 *
 * The lookup always misses: an app's namespace is never registered on the server, so `t` falls
 * through to the wording and interpolates that instead. Escaping stays off to match the client,
 * which renders through React and turns it off too - otherwise an `&` in an argument would read
 * differently before and after the app is uninstalled.
 *
 * Plural suffixes are not consulted, so an explanation whose wording changes with a number reads
 * in the form the app shipped under the bare key.
 */
function resolveFallbackText(app: EventResultMeta['app'], key: string, args?: Record<string, string | number>): string {
	const lng = getWorkspaceLanguage();
	const wording = app.translations?.[lng] ?? app.translations?.en;

	if (!wording) {
		logger.warn({ msg: 'An app prevented a media call with a key it ships no translation for', appId: app.id, key });
	}

	const text = wording
		? i18n.t(key, {
				lng,
				ns: app.i18nNamespace,
				defaultValue: wording,
				// `replace` keeps the app's argument names from colliding with i18next's own options
				replace: args ?? {},
				interpolation: { escapeValue: false },
			})
		: preventedByAppText(app.name);

	return text.slice(0, MAX_PREVENTION_TEXT_LENGTH);
}

/**
 * Turns what an app said about a call it prevented into the record kept on the call.
 *
 * An app that names a key gets the key stored, so that a reader sees the explanation in their own
 * language for as long as the app is installed, and a snapshot stored beside it for after that.
 */
function toPreventionRecord(outcome: Extract<PreMediaCallCreatedOutcome, { type: 'prevent' }>): CallPreventionRecord {
	const { app } = outcome.meta;
	const who = { appId: app.id, appName: app.name };

	if ('i18n' in outcome) {
		const { key, args } = outcome.i18n;

		return {
			...who,
			key,
			ns: app.i18nNamespace,
			...(args && { args }),
			text: resolveFallbackText(app, key, args),
		};
	}

	return { ...who, text: outcome.reason.slice(0, MAX_PREVENTION_TEXT_LENGTH) };
}

/**
 * Runs the pre-media-call-created event and translates its outcome back into
 * something the media call server understands. Apps may block the call or change
 * the features it was requested with; anything else they try to patch is dropped
 * by the listener manager.
 */
export async function runPreMediaCallCreatedAppHook(params: PreCallCreatedHookParams): Promise<PreCallCreatedHookResult> {
	if (!Apps.self) {
		return { prevented: false };
	}

	const context: IPreMediaCallCreatedContext = {
		caller: toAppContact(params.caller),
		callee: toAppContact(params.callee),
		createdBy: toAppContact(params.createdBy),
		features: [...params.features],
		origin: getCallOrigin(params.caller, params.callee),
		...(params.parentCallId && { parentCallId: params.parentCallId }),
		...(params.divertedBy && { divertedBy: toAppContact(params.divertedBy) }),
	};

	const outcome = (await triggerMediaCallEvent({
		method: AppMethod.EXECUTE_PRE_MEDIA_CALL_CREATED,
		context,
	})) as PreMediaCallCreatedOutcome | undefined;

	if (!outcome) {
		return { prevented: false };
	}

	if (outcome.type === 'prevent') {
		const reason = 'reason' in outcome ? outcome.reason : undefined;
		const i18nKey = 'i18n' in outcome ? outcome.i18n.key : undefined;

		logger.info({
			msg: 'An app prevented a media call from being created',
			appId: outcome.meta.app.id,
			reason: reason || i18nKey,
		});

		return {
			prevented: true,
			reason: reason || i18nKey,
			preventedBy: toPreventionRecord(outcome),
		};
	}

	// Apps are free to ask for features that don't exist; only the known ones move on
	const features = outcome.type === 'patch' && outcome.patch.features ? outcome.patch.features.filter(isCallFeature) : params.features;

	return { prevented: false, features };
}
