import type { MediaCallEvent } from '@rocket.chat/apps';
import {
	isAnsweredCall,
	isKnownMediaCallHangupReason,
	isMissedCall,
	isRejectedCall,
	mediaCallHangupReasonList,
} from '@rocket.chat/apps-engine/definition/mediaCalls';
import type {
	IMediaCallEndedContext,
	IMediaCallParticipantJoinedContext,
	IMediaCallStartedContext,
} from '@rocket.chat/apps-engine/definition/mediaCalls';
import { AppInterface, AppMethod } from '@rocket.chat/apps-engine/definition/metadata';
import type { IMediaCall } from '@rocket.chat/core-typings';
import type { PreCallCreatedHookParams } from '@rocket.chat/media-calls';
import { callHangupReasonList } from '@rocket.chat/media-signaling';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const triggerEvent = sinon.stub();
const AppsMock: { self: { triggerEvent: sinon.SinonStub } | undefined } = { self: { triggerEvent } };
const loggerMock = { warn: sinon.stub(), info: sinon.stub() };
const settingsMock = { get: sinon.stub().returns('en') };

/**
 * Enough of i18next to answer the two lookups the host makes: the workspace's own key, and an
 * app key that always misses and falls through to the wording passed as `defaultValue`.
 */
const i18nMock = {
	t: (key: string, options: { defaultValue?: string; replace?: Record<string, string | number> }) => {
		const wording = key === 'Prevented_by_app' ? 'Prevented by app: {{appName}}' : (options.defaultValue ?? key);

		return wording.replace(/\{\{(\w+)\}\}/g, (match: string, name: string) => String(options.replace?.[name] ?? match));
	},
};

const { notifyAppsOfMediaCallStarted, notifyAppsOfMediaCallParticipantJoined, notifyAppsOfMediaCallEnded, runPreMediaCallCreatedAppHook } =
	proxyquire.noCallThru().load('../../../../../server/services/media-call/appEvents', {
		'@rocket.chat/apps': { Apps: AppsMock, AppEvents: AppInterface },
		'./logger': { logger: loggerMock },
		'../../lib/i18n': { i18n: i18nMock },
		'../../settings': { settings: settingsMock },
	});

/**
 * Contacts as they are stored: every one of them carries a `contractId`, which is
 * the credential that must never reach an app.
 */
function makeCall(overrides: Partial<IMediaCall> = {}): IMediaCall {
	return {
		_id: 'call-id',
		service: 'webrtc',
		kind: 'direct',
		state: 'hangup',
		createdBy: { type: 'user', id: 'caller-id', username: 'caller', contractId: 'created-by-contract' },
		createdAt: new Date('2026-01-01T10:00:00.000Z'),
		caller: {
			type: 'user',
			id: 'caller-id',
			username: 'caller',
			displayName: 'The Caller',
			sipExtension: '1001',
			contractId: 'caller-contract',
		},
		callee: { type: 'user', id: 'callee-id', username: 'callee', contractId: 'callee-contract' },
		ended: true,
		endedAt: new Date('2026-01-01T10:01:00.000Z'),
		expiresAt: new Date('2026-01-01T11:00:00.000Z'),
		uids: ['caller-id', 'callee-id'],
		features: ['audio'],
		...overrides,
	} as IMediaCall;
}

function hookParams(overrides: Partial<PreCallCreatedHookParams> = {}): PreCallCreatedHookParams {
	return {
		caller: { type: 'user', id: 'caller-id', username: 'caller', contractId: 'caller-contract' },
		callee: { type: 'user', id: 'callee-id', username: 'callee', contractId: 'callee-contract' },
		createdBy: { type: 'user', id: 'caller-id', username: 'caller', contractId: 'created-by-contract' },
		features: ['audio'],
		...overrides,
	} as PreCallCreatedHookParams;
}

/** The single event handed to the Apps-Engine, asserting it travelled under `IMediaCallHandler`. */
function dispatchedEvent(): MediaCallEvent {
	expect(triggerEvent.callCount).to.equal(1);

	const [interfaceName, event] = triggerEvent.firstCall.args;
	expect(interfaceName).to.equal(AppInterface.IMediaCallHandler);

	return event;
}

describe('media call app events', () => {
	beforeEach(() => {
		triggerEvent.reset();
		triggerEvent.resolves(undefined);
		loggerMock.warn.reset();
		loggerMock.info.reset();
		AppsMock.self = { triggerEvent };
	});

	afterEach(() => sinon.restore());

	describe('contact mapping', () => {
		it('never lets a contractId reach an app', async () => {
			await notifyAppsOfMediaCallEnded(makeCall({ activatedAt: new Date('2026-01-01T10:00:05.000Z') }));

			const { context } = dispatchedEvent() as { context: { call: Record<string, any> } };

			expect(context.call.caller).to.not.have.property('contractId');
			expect(context.call.callee).to.not.have.property('contractId');
			expect(context.call.createdBy).to.not.have.property('contractId');
		});

		it('never lets a contractId reach an app through the pre-create context', async () => {
			await runPreMediaCallCreatedAppHook(hookParams());

			const { context } = dispatchedEvent() as { context: Record<string, any> };

			expect(context.caller).to.not.have.property('contractId');
			expect(context.callee).to.not.have.property('contractId');
			expect(context.createdBy).to.not.have.property('contractId');
		});

		it('copies every allowed contact field over', async () => {
			await notifyAppsOfMediaCallEnded(makeCall());

			const { context } = dispatchedEvent() as { context: { call: Record<string, any> } };

			expect(context.call.caller).to.deep.equal({
				type: 'user',
				id: 'caller-id',
				username: 'caller',
				displayName: 'The Caller',
				sipExtension: '1001',
			});
		});

		it('maps the contact that diverted the call, and omits it when the call was not diverted', async () => {
			await notifyAppsOfMediaCallEnded(
				makeCall({
					divertedBy: { type: 'sip', id: '1005', displayName: 'Front Desk', sipExtension: '1005', contractId: 'diverted-by-contract' },
				}),
			);

			const { context } = dispatchedEvent() as { context: { call: Record<string, any> } };

			// A diversion is not a transfer, so the call carries no parentCallId alongside it
			expect(context.call.divertedBy).to.deep.equal({ type: 'sip', id: '1005', displayName: 'Front Desk', sipExtension: '1005' });
			expect(context.call).to.not.have.property('parentCallId');

			triggerEvent.resetHistory();
			await notifyAppsOfMediaCallEnded(makeCall());

			expect((dispatchedEvent().context as { call: Record<string, any> }).call).to.not.have.property('divertedBy');
		});

		it('omits the optional contact fields that are not set rather than sending them as undefined', async () => {
			await notifyAppsOfMediaCallEnded(makeCall({ callee: { type: 'sip', id: 'callee-id', contractId: 'callee-contract' } }));

			const { context } = dispatchedEvent() as { context: { call: Record<string, any> } };

			expect(Object.keys(context.call.callee)).to.deep.equal(['type', 'id']);
		});
	});

	describe('notifyAppsOfMediaCallStarted', () => {
		it('dispatches the started event with the moment media started flowing', async () => {
			const activatedAt = new Date('2026-01-01T10:00:05.000Z');
			await notifyAppsOfMediaCallStarted(makeCall({ state: 'active', ended: false, activatedAt }));

			const event = dispatchedEvent();

			expect(event.method).to.equal(AppMethod.EXECUTE_POST_MEDIA_CALL_STARTED);
			expect(event.context).to.have.nested.property('call.id', 'call-id');
			expect((event.context as IMediaCallStartedContext).call.activatedAt).to.deep.equal(activatedAt);
			// The call carries the timestamp, so the event has nothing to add next to it
			expect(Object.keys(event.context)).to.deep.equal(['call']);
		});

		it('warns and dispatches nothing when the call has no activation timestamp', async () => {
			await notifyAppsOfMediaCallStarted(makeCall({ activatedAt: undefined }));

			expect(triggerEvent.callCount).to.equal(0);
			expect(loggerMock.warn.firstCall.firstArg).to.include({ callId: 'call-id', field: 'activatedAt' });
		});
	});

	describe('notifyAppsOfMediaCallParticipantJoined', () => {
		it('dispatches a call whose callee is the side that joined', async () => {
			const acceptedAt = new Date('2026-01-01T10:00:03.000Z');
			await notifyAppsOfMediaCallParticipantJoined(makeCall({ state: 'accepted', ended: false, acceptedAt }));

			const event = dispatchedEvent();

			expect(event.method).to.equal(AppMethod.EXECUTE_POST_MEDIA_CALL_PARTICIPANT_JOINED);

			// Calls are strictly two-party, so the side that joined is always the callee
			const { call } = event.context as IMediaCallParticipantJoinedContext;
			expect(call.callee).to.deep.equal({ type: 'user', id: 'callee-id', username: 'callee' });
			expect(call.acceptedAt).to.deep.equal(acceptedAt);
			expect(Object.keys(event.context)).to.deep.equal(['call']);
		});

		it('warns and dispatches nothing when the call has no acceptance timestamp', async () => {
			await notifyAppsOfMediaCallParticipantJoined(makeCall({ acceptedAt: undefined }));

			expect(triggerEvent.callCount).to.equal(0);
			expect(loggerMock.warn.firstCall.firstArg).to.include({ callId: 'call-id', field: 'acceptedAt' });
		});
	});

	describe('notifyAppsOfMediaCallEnded', () => {
		it('dispatches who ended the call and why when both are known', async () => {
			const endedAt = new Date('2026-01-01T10:01:00.000Z');
			await notifyAppsOfMediaCallEnded(
				makeCall({
					endedAt,
					endedBy: { type: 'user', id: 'callee-id', contractId: 'callee-contract' },
					hangupReason: 'not-answered',
				}),
			);

			const event = dispatchedEvent();

			expect(event.method).to.equal(AppMethod.EXECUTE_POST_MEDIA_CALL_ENDED);

			const context = event.context as Record<string, any>;
			expect(context.call.endedAt).to.deep.equal(endedAt);
			// Actors are mapped down to type and id alone, so no contractId travels here either
			expect(context.call.endedBy).to.deep.equal({ type: 'user', id: 'callee-id' });
			expect(context.call.hangupReason).to.equal('not-answered');
			// Only durationMs sits next to the call, because the call does not carry it
			expect(Object.keys(context).sort()).to.deep.equal(['call', 'durationMs']);
		});

		it('omits endedBy and hangupReason when the call recorded neither', async () => {
			await notifyAppsOfMediaCallEnded(makeCall({ endedAt: new Date('2026-01-01T10:01:00.000Z') }));

			const context = dispatchedEvent().context as Record<string, any>;

			expect(context.call).to.not.have.property('endedBy');
			expect(context.call).to.not.have.property('hangupReason');
		});

		it('reports a server actor as the one that ended the call', async () => {
			await notifyAppsOfMediaCallEnded(makeCall({ endedBy: { type: 'server', id: 'server' }, hangupReason: 'expired' }));

			expect((dispatchedEvent().context as Record<string, any>).call.endedBy).to.deep.equal({ type: 'server', id: 'server' });
		});

		it('warns and dispatches nothing when the call has no end timestamp', async () => {
			await notifyAppsOfMediaCallEnded(makeCall({ endedAt: undefined }));

			expect(triggerEvent.callCount).to.equal(0);
			expect(loggerMock.warn.firstCall.firstArg).to.include({ callId: 'call-id', field: 'endedAt' });
		});

		describe('durationMs', () => {
			async function durationOf(overrides: Partial<IMediaCall>): Promise<number> {
				await notifyAppsOfMediaCallEnded(makeCall(overrides));

				return (dispatchedEvent().context as { durationMs: number }).durationMs;
			}

			it('is zero for a call that never became active', async () => {
				expect(await durationOf({ activatedAt: undefined, endedAt: new Date('2026-01-01T10:01:00.000Z') })).to.equal(0);
			});

			it('is the time between activation and the end of the call', async () => {
				const duration = await durationOf({
					activatedAt: new Date('2026-01-01T10:00:05.000Z'),
					endedAt: new Date('2026-01-01T10:01:05.000Z'),
				});

				expect(duration).to.equal(60_000);
			});

			it('is clamped to zero when the call ended before it was activated', async () => {
				const duration = await durationOf({
					activatedAt: new Date('2026-01-01T10:01:05.000Z'),
					endedAt: new Date('2026-01-01T10:00:05.000Z'),
				});

				expect(duration).to.equal(0);
			});
		});
	});

	/**
	 * The two contact types are the whole of the origin, so the same three cases have
	 * to come out the same way on the pre context and on the persisted call - an app
	 * that keys on one and then the other must not see them disagree.
	 */
	describe('call origin', () => {
		const user1 = { type: 'user', id: 'caller-id', username: 'caller', contractId: 'caller-contract' } as const;
		const user2 = { type: 'user', id: 'callee-id', username: 'callee', contractId: 'callee-contract' } as const;
		const extension = { type: 'sip', id: '1002', sipExtension: '1002', contractId: 'sip-contract' } as const;

		const cases = [
			{ origin: 'internal', caller: user1, callee: user2, description: 'a call that never leaves the workspace' },
			{ origin: 'sip-outbound', caller: user1, callee: extension, description: 'a call placed out through the PBX' },
			{ origin: 'sip-inbound', caller: extension, callee: user2, description: 'a call that arrived from the PBX' },
		] as const;

		cases.forEach(({ origin, caller, callee, description }) => {
			it(`reports ${description} as ${origin} on the pre-create context`, async () => {
				await runPreMediaCallCreatedAppHook(hookParams({ caller, callee }));

				expect((dispatchedEvent().context as Record<string, any>).origin).to.equal(origin);
			});

			it(`reports ${description} as ${origin} on the call the post events carry`, async () => {
				await notifyAppsOfMediaCallEnded(makeCall({ caller, callee }));

				const { context } = dispatchedEvent() as { context: { call: Record<string, any> } };

				expect(context.call.origin).to.equal(origin);
			});
		});

		it('reads the origin off the contacts rather than off the service the call is carried by', async () => {
			await notifyAppsOfMediaCallEnded(makeCall({ caller: extension, callee: user2 }));

			const { context } = dispatchedEvent() as { context: { call: Record<string, any> } };

			// `service` stays `'webrtc'` on a SIP leg too, which is why the origin is not named after it
			expect(context.call.service).to.equal('webrtc');
			expect(context.call.origin).to.equal('sip-inbound');
		});
	});

	describe('post event guards', () => {
		it('dispatches nothing when the Apps-Engine is not running', async () => {
			AppsMock.self = undefined;

			await notifyAppsOfMediaCallStarted(makeCall({ activatedAt: new Date('2026-01-01T10:00:05.000Z') }));
			await notifyAppsOfMediaCallParticipantJoined(makeCall({ acceptedAt: new Date('2026-01-01T10:00:03.000Z') }));
			await notifyAppsOfMediaCallEnded(makeCall());

			expect(triggerEvent.callCount).to.equal(0);
			expect(loggerMock.warn.callCount).to.equal(0);
		});
	});

	describe('runPreMediaCallCreatedAppHook', () => {
		it('lets the call through without consulting any app when the Apps-Engine is not running', async () => {
			AppsMock.self = undefined;

			expect(await runPreMediaCallCreatedAppHook(hookParams())).to.deep.equal({ prevented: false });
			expect(triggerEvent.callCount).to.equal(0);
		});

		it('dispatches the pre-create event with a copy of the requested features', async () => {
			const params = hookParams({ features: ['audio', 'hold'] });

			await runPreMediaCallCreatedAppHook(params);

			const event = dispatchedEvent();

			expect(event.method).to.equal(AppMethod.EXECUTE_PRE_MEDIA_CALL_CREATED);

			const { features } = event.context as { features: string[] };
			expect(features).to.deep.equal(['audio', 'hold']);
			// Apps must not be handed the array the caller still holds
			expect(features).to.not.equal(params.features);
		});

		it('carries the parent call id of a transfer, and omits it otherwise', async () => {
			await runPreMediaCallCreatedAppHook(hookParams({ parentCallId: 'parent-call-id' }));
			expect(dispatchedEvent().context).to.have.property('parentCallId', 'parent-call-id');

			triggerEvent.resetHistory();

			await runPreMediaCallCreatedAppHook(hookParams());
			expect(dispatchedEvent().context).to.not.have.property('parentCallId');
		});

		it('carries the contact that diverted the call, and omits it otherwise', async () => {
			await runPreMediaCallCreatedAppHook(
				hookParams({ divertedBy: { type: 'sip', id: '1005', displayName: 'Front Desk', contractId: 'diverted-by-contract' } }),
			);

			// The diverting party is a contact like any other: its contract stays behind
			expect((dispatchedEvent().context as Record<string, any>).divertedBy).to.deep.equal({
				type: 'sip',
				id: '1005',
				displayName: 'Front Desk',
			});

			triggerEvent.resetHistory();

			await runPreMediaCallCreatedAppHook(hookParams());
			expect(dispatchedEvent().context).to.not.have.property('divertedBy');
		});

		it('lets the call through when no app answered the event', async () => {
			triggerEvent.resolves(undefined);

			expect(await runPreMediaCallCreatedAppHook(hookParams())).to.deep.equal({ prevented: false });
		});

		it('fails the call rather than letting it through when the event itself fails', async () => {
			const failure = new Error('the app subprocess is gone');
			triggerEvent.rejects(failure);

			// The hook is a policy decision: an outcome nobody could produce must not read as `pass`
			const error = await runPreMediaCallCreatedAppHook(hookParams()).then(
				() => undefined,
				(error: unknown) => error,
			);

			expect(error).to.equal(failure);
		});

		it('reports the reason an app prevented the call', async () => {
			triggerEvent.resolves({
				type: 'prevent',
				meta: { app: { id: 'blocking-app', name: 'Blocking App', i18nNamespace: 'app-blocking-app' } },
				reason: 'callee is on a do-not-disturb list',
			});

			expect(await runPreMediaCallCreatedAppHook(hookParams())).to.deep.equal({
				prevented: true,
				reason: 'callee is on a do-not-disturb list',
				preventedBy: { appId: 'blocking-app', appName: 'Blocking App', text: 'callee is on a do-not-disturb list' },
			});
			expect(loggerMock.info.callCount).to.equal(1);
			expect(loggerMock.info.firstCall.firstArg).to.have.property('appId', 'blocking-app');
		});

		it('keeps an explanation that fits the bound exactly as the app wrote it', async () => {
			triggerEvent.resolves({
				type: 'prevent',
				meta: { app: { id: 'blocking-app', name: 'Blocking App', i18nNamespace: 'app-blocking-app' } },
				reason: 'x'.repeat(500),
			});

			const result = await runPreMediaCallCreatedAppHook(hookParams());

			expect(result.preventedBy.text).to.equal('x'.repeat(500));
		});

		it('caps what an app said, and marks where it cut', async () => {
			triggerEvent.resolves({
				type: 'prevent',
				meta: { app: { id: 'blocking-app', name: 'Blocking App', i18nNamespace: 'app-blocking-app' } },
				reason: 'x'.repeat(1500),
			});

			const result = await runPreMediaCallCreatedAppHook(hookParams());

			// The record goes to the database, so it can't grow without a bound - and the marker is what
			// stops a reader from seeing the sentence stop dead
			expect(result.preventedBy.text).to.have.lengthOf(1000);
			expect(result.preventedBy.text.endsWith('\u2026')).to.be.true;
		});

		it('keeps the i18n key and its args, in the namespace the apps platform reported', async () => {
			triggerEvent.resolves({
				type: 'prevent',
				meta: {
					app: {
						id: 'blocking-app',
						name: 'Blocking App',
						i18nNamespace: 'app-blocking-app',
						translations: { 'en': '{{username}} does not take calls', 'pt-BR': '{{username}} nao atende chamadas' },
					},
				},
				i18n: { key: 'callee_is_dnd', args: { username: 'callee' } },
			});

			expect(await runPreMediaCallCreatedAppHook(hookParams())).to.deep.equal({
				prevented: true,
				reason: 'callee_is_dnd',
				preventedBy: {
					appId: 'blocking-app',
					appName: 'Blocking App',
					i18n: { key: 'callee_is_dnd', ns: 'app-blocking-app', args: { username: 'callee' } },
					text: 'callee does not take calls',
				},
			});
		});

		it('snapshots the app wording in the language the workspace runs in', async () => {
			settingsMock.get.returns('pt-BR');
			triggerEvent.resolves({
				type: 'prevent',
				meta: {
					app: {
						id: 'blocking-app',
						name: 'Blocking App',
						i18nNamespace: 'app-blocking-app',
						translations: { 'en': 'no calls', 'pt-BR': 'sem chamadas' },
					},
				},
				i18n: { key: 'callee_is_dnd' },
			});

			const result = await runPreMediaCallCreatedAppHook(hookParams());

			expect(result.preventedBy.text).to.equal('sem chamadas');
			settingsMock.get.returns('en');
		});

		it('answers for an app that named a key it ships no translation for', async () => {
			triggerEvent.resolves({
				type: 'prevent',
				meta: { app: { id: 'blocking-app', name: 'Blocking App', i18nNamespace: 'app-blocking-app' } },
				i18n: { key: 'callee_is_dnd' },
			});

			const result = await runPreMediaCallCreatedAppHook(hookParams());

			// A raw key must never be what a reader is left with
			expect(result.preventedBy.text).to.equal('Prevented by app: Blocking App');
			expect(loggerMock.warn.callCount).to.equal(1);
		});

		it('keeps the requested features when every app passed', async () => {
			triggerEvent.resolves({ type: 'pass' });

			expect(await runPreMediaCallCreatedAppHook(hookParams({ features: ['audio', 'hold'] }))).to.deep.equal({
				prevented: false,
				features: ['audio', 'hold'],
			});
		});

		it('returns the features an app patched in', async () => {
			triggerEvent.resolves({
				type: 'patch',
				patch: { ...hookParams(), features: ['audio', 'hold'] },
			});

			expect(await runPreMediaCallCreatedAppHook(hookParams())).to.deep.equal({ prevented: false, features: ['audio', 'hold'] });
		});

		it('drops the features an app asked for that the workspace does not know about', async () => {
			triggerEvent.resolves({
				type: 'patch',
				patch: { ...hookParams(), features: ['audio', 'teleportation', 'hold'] },
			});

			expect(await runPreMediaCallCreatedAppHook(hookParams())).to.deep.equal({ prevented: false, features: ['audio', 'hold'] });
		});

		it('keeps the requested features when a patch names none', async () => {
			const { features, ...patch } = hookParams();
			triggerEvent.resolves({ type: 'patch', patch });

			expect(await runPreMediaCallCreatedAppHook(hookParams({ features: ['audio', 'hold'] }))).to.deep.equal({
				prevented: false,
				features: ['audio', 'hold'],
			});
		});
	});
});

describe('media call hangup reasons', () => {
	/** The server writes these through `hangupByServer`; the internal client list has no entry for them. */
	const serverWrittenReasons = ['expired'];

	/**
	 * PR #41964 stopped Rocket.Chat from writing these, but stored call history still holds
	 * them, so the SDK keeps documenting them for an app that reads older calls.
	 */
	const legacyReasonsOnlyInStoredHistory = ['sip-refer-failed'];

	/**
	 * The Apps-Engine ships the app-facing SDK on its own, so it cannot import the
	 * internal list and keeps a copy. Nothing but this test stops the copy rotting.
	 * The check is an exact equality, so a value ADDED to or REMOVED FROM the internal
	 * list breaks this test instead of drifting silently.
	 */
	it('documents exactly the internal list, the server-written codes and the legacy ones', () => {
		expect([...mediaCallHangupReasonList].sort()).to.deep.equal(
			[...callHangupReasonList, ...serverWrittenReasons, ...legacyReasonsOnlyInStoredHistory].sort(),
		);
	});

	it('recognises the codes only the server writes', () => {
		expect(isKnownMediaCallHangupReason('expired')).to.be.true;
		expect(isKnownMediaCallHangupReason('sip-refer-failed')).to.be.true;
		expect(isKnownMediaCallHangupReason('sip-error-486')).to.be.true;
	});

	it('rejects a reason it does not document, and an absent one', () => {
		expect(isKnownMediaCallHangupReason('teleportation-failure')).to.be.false;
		expect(isKnownMediaCallHangupReason(undefined)).to.be.false;
	});
});

describe('media call outcome helpers', () => {
	function endedContext(overrides: Partial<IMediaCallEndedContext['call']> = {}): IMediaCallEndedContext {
		return {
			call: { ...(makeAppCall() as IMediaCallEndedContext['call']), ...overrides },
			durationMs: 0,
		};
	}

	function makeAppCall() {
		return {
			id: 'call-id',
			service: 'webrtc',
			kind: 'direct',
			state: 'hangup',
			createdBy: { type: 'user', id: 'caller-id' },
			createdAt: new Date('2026-01-01T00:00:00Z'),
			caller: { type: 'user', id: 'caller-id' },
			callee: { type: 'user', id: 'callee-id' },
			features: ['audio'],
			uids: ['caller-id', 'callee-id'],
			ended: true,
			endedAt: new Date('2026-01-01T00:01:00Z'),
		};
	}

	it('reads a call the callee accepted as answered, whatever ended it', () => {
		const context = endedContext({ acceptedAt: new Date('2026-01-01T00:00:10Z'), hangupReason: 'media-error' });

		expect(isAnsweredCall(context)).to.be.true;
		expect(isMissedCall(context)).to.be.false;
		expect(isRejectedCall(context)).to.be.false;
	});

	it('reads a decline as rejected, not as missed', () => {
		const context = endedContext({ hangupReason: 'rejected' });

		expect(isRejectedCall(context)).to.be.true;
		expect(isMissedCall(context)).to.be.false;
		expect(isAnsweredCall(context)).to.be.false;
	});

	it('reads an unanswered call as missed whether the caller timed out or the server expired it', () => {
		for (const hangupReason of ['not-answered', 'expired', 'unavailable', 'sip-error-408', undefined]) {
			const context = endedContext({ hangupReason });

			expect(isMissedCall(context), `hangupReason: ${hangupReason}`).to.be.true;
			expect(isAnsweredCall(context), `hangupReason: ${hangupReason}`).to.be.false;
		}
	});

	it('puts every ended call in exactly one of the three outcomes', () => {
		for (const hangupReason of [...mediaCallHangupReasonList, 'something-new-and-unknown']) {
			for (const acceptedAt of [undefined, new Date('2026-01-01T00:00:10Z')]) {
				const context = endedContext({ acceptedAt, hangupReason });
				const matched = [isAnsweredCall(context), isRejectedCall(context), isMissedCall(context)].filter(Boolean);

				expect(matched, `hangupReason: ${hangupReason}, acceptedAt: ${acceptedAt}`).to.have.lengthOf(1);
			}
		}
	});
});
