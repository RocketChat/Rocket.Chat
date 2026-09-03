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

// Contacts carry a per-session signing token, which is a credential and shouldn't go to apps
function toAppContact(contact: MediaCallContact): IAppsMediaCallContact {
	return {
		type: contact.type,
		id: contact.id,
		...(contact.username && { username: contact.username }),
		...(contact.displayName && { displayName: contact.displayName }),
		...(contact.sipExtension && { sipExtension: contact.sipExtension }),
	};
}

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

export async function notifyAppsOfMediaCallStarted(call: IMediaCall): Promise<void> {
	if (!Apps.self) {
		return;
	}

	const activeCall = toAppActiveMediaCall(call);
	if (!activeCall) {
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

const MAX_PREVENTION_LENGTH = 1000;

// Keeps the words inside the budget and marks where they were cut
function capText(text: string): string {
	return text.length <= MAX_PREVENTION_LENGTH ? text : `${text.slice(0, MAX_PREVENTION_LENGTH - 1)}\u2026`;
}

function getWorkspaceLanguage(): string {
	return settings.get<string>('Language') || 'en';
}

/** The workspace's own sentence, for an app that prevented a call and left nothing readable behind. */
function preventedByAppText(appName: string): string {
	return i18n.t('Prevented_by_app', { lng: getWorkspaceLanguage(), replace: { appName }, interpolation: { escapeValue: false } });
}

/**
 * Resolves an app's translation key to plain text, so the text survives the app's uninstall.
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

	return capText(text);
}

/**
 * Turns what an app said about a call it prevented into the record kept on the call.
 */
function toPreventionRecord(outcome: Extract<PreMediaCallCreatedOutcome, { type: 'prevent' }>): CallPreventionRecord {
	const { app } = outcome.meta;
	const who = { appId: app.id, appName: app.name };

	if ('i18n' in outcome) {
		const { key, args } = outcome.i18n;

		return {
			...who,
			i18n: { ...outcome.i18n, ns: app.i18nNamespace },
			text: resolveFallbackText(app, key, args),
		};
	}

	return { ...who, text: capText(outcome.reason) };
}

/**
 * Runs the pre-media-call-created event and translates its outcome back into
 * something the media call server understands. Apps may block the call or change
 * the features it was requested with
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

	// Drop potentially unknown features the app might have added
	const features = outcome.type === 'patch' && outcome.patch.features ? outcome.patch.features.filter(isCallFeature) : params.features;

	return { prevented: false, features };
}
