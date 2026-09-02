import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import { EVENT_RESULT_KIND, EventResult } from '@rocket.chat/apps-engine/definition/eventResult';
import type {
	IMediaCall,
	IMediaCallEndedContext,
	IMediaCallParticipantJoinedContext,
	IMediaCallStartedContext,
	IPreMediaCallCreatedContext,
} from '@rocket.chat/apps-engine/definition/mediaCalls';
import { AppInterface, AppMethod } from '@rocket.chat/apps-engine/definition/metadata';

import type { AppManager } from '../../../src/server/AppManager';
import type { ProxiedApp } from '../../../src/server/ProxiedApp';
import { AppListenerManager } from '../../../src/server/managers';
import type { MediaCallEvent, PreMediaCallCreatedOutcome } from '../../../src/server/mediaCalls';
import { JSONRPC_METHOD_NOT_FOUND } from '../../../src/server/runtime/base/BaseRuntimeSubprocessController';
import type { IAppStorageItem } from '../../../src/server/storage';

type AppMethodHandlers = Record<string, (...args: any[]) => unknown>;

/**
 * Every method of `IMediaCallHandler` is optional, and an app that doesn't
 * implement one answers the way the runtime does: a method-not-found error.
 */
function mockApp(id: string, handlers: AppMethodHandlers, languageContent: { [language: string]: object } = {}): ProxiedApp {
	return {
		getID() {
			return id;
		},
		getName() {
			return `${id} app`;
		},
		getStorageItem() {
			return { languageContent } as IAppStorageItem;
		},
		getImplementationList() {
			return { [AppInterface.IMediaCallHandler]: true } as { [inte: string]: boolean };
		},
		async call(method: string, ...args: unknown[]) {
			if (!(method in handlers)) {
				throw Object.assign(new Error(`Method not found: ${method}`), { code: JSONRPC_METHOD_NOT_FOUND });
			}

			return handlers[method](...args);
		},
	} as unknown as ProxiedApp;
}

function managerFor(apps: ProxiedApp[]): AppManager {
	return {
		getOneById(appId: string) {
			return apps.find((app) => app.getID() === appId);
		},
	} as AppManager;
}

function listenerManagerFor(apps: ProxiedApp[]): AppListenerManager {
	const listenerManager = new AppListenerManager(managerFor(apps));

	apps.forEach((app) => listenerManager.registerListeners(app));

	return listenerManager;
}

const context: IPreMediaCallCreatedContext = {
	caller: { type: 'user', id: 'caller-id', username: 'caller' },
	callee: { type: 'user', id: 'callee-id', username: 'callee' },
	createdBy: { type: 'user', id: 'caller-id', username: 'caller' },
	features: ['audio'],
	origin: 'internal',
};

async function runPreCallCreated(apps: ProxiedApp[]): Promise<PreMediaCallCreatedOutcome> {
	const outcome = await listenerManagerFor(apps).executeListener(AppInterface.IMediaCallHandler, {
		method: AppMethod.EXECUTE_PRE_MEDIA_CALL_CREATED,
		context,
	});

	return outcome as PreMediaCallCreatedOutcome;
}

/** The `default:` and unsupported-patch branches only report themselves through `console.warn`. */
async function capturingWarnings<T>(fn: () => Promise<T>): Promise<{ result: T; warnings: string[] }> {
	const warnings: string[] = [];
	const original = console.warn;
	console.warn = (message: string) => void warnings.push(message);

	try {
		const result = await fn();

		return { result, warnings };
	} finally {
		console.warn = original;
	}
}

describe('AppListenerManager media call events', () => {
	describe('pre media call created', () => {
		it('reports a pass, carrying nothing of its own, when every app passes', async () => {
			const outcome = await runPreCallCreated([
				mockApp('passing', { [AppMethod.EXECUTE_PRE_MEDIA_CALL_CREATED]: () => EventResult.pass() }),
			]);

			// A pass changed nothing, so it names no patch and no app: the host already holds the context
			assert.deepStrictEqual(outcome, { type: 'pass' });
		});

		it('skips apps that only implement the post events', async () => {
			const outcome = await runPreCallCreated([mockApp('post-only', { [AppMethod.EXECUTE_POST_MEDIA_CALL_ENDED]: () => undefined })]);

			assert.deepStrictEqual(outcome, { type: 'pass' });
		});

		it('reports the app that prevented the call and stops consulting the others', async () => {
			const consulted: string[] = [];
			const outcome = await runPreCallCreated([
				mockApp('preventing', {
					[AppMethod.EXECUTE_PRE_MEDIA_CALL_CREATED]: () => {
						consulted.push('preventing');
						return EventResult.prevent({ reason: 'callee is on a do-not-disturb list' });
					},
				}),
				mockApp('later', {
					[AppMethod.EXECUTE_PRE_MEDIA_CALL_CREATED]: () => {
						consulted.push('later');
						return EventResult.pass();
					},
				}),
			]);

			assert.deepStrictEqual(outcome, {
				type: 'prevent',
				meta: { app: { id: 'preventing', name: 'preventing app', i18nNamespace: 'app-preventing' } },
				reason: 'callee is on a do-not-disturb list',
			});
			assert.deepStrictEqual(consulted, ['preventing']);
		});

		it('carries an i18n prevention reason', async () => {
			const outcome = await runPreCallCreated([
				mockApp('preventing', {
					[AppMethod.EXECUTE_PRE_MEDIA_CALL_CREATED]: () => EventResult.prevent({ i18n: { key: 'callee_is_dnd' } }),
				}),
			]);

			assert.deepStrictEqual(outcome, {
				type: 'prevent',
				meta: { app: { id: 'preventing', name: 'preventing app', i18nNamespace: 'app-preventing' } },
				i18n: { key: 'callee_is_dnd' },
			});
		});

		/**
		 * The one key the app named, in every language it ships it in - not the whole catalogue,
		 * which would cross the boundary on every prevented call.
		 */
		it('slices the app translations of the key the result named', async () => {
			const outcome = await runPreCallCreated([
				mockApp(
					'preventing',
					{ [AppMethod.EXECUTE_PRE_MEDIA_CALL_CREATED]: () => EventResult.prevent({ i18n: { key: 'callee_is_dnd' } }) },
					{
						'en': { callee_is_dnd: 'The callee is on a do-not-disturb list', another_key: 'not asked for' },
						'pt-BR': { callee_is_dnd: 'O destinatário está em modo não perturbe' },
						'de': { another_key: 'nicht gefragt' },
					},
				),
			]);

			assert.deepStrictEqual(outcome, {
				type: 'prevent',
				meta: {
					app: {
						id: 'preventing',
						name: 'preventing app',
						i18nNamespace: 'app-preventing',
						translations: {
							'en': 'The callee is on a do-not-disturb list',
							'pt-BR': 'O destinatário está em modo não perturbe',
						},
					},
				},
				i18n: { key: 'callee_is_dnd' },
			});
		});

		it('leaves the translations out when no language ships the key', async () => {
			const outcome = await runPreCallCreated([
				mockApp(
					'preventing',
					{ [AppMethod.EXECUTE_PRE_MEDIA_CALL_CREATED]: () => EventResult.prevent({ i18n: { key: 'callee_is_dnd' } }) },
					{ en: { another_key: 'not asked for' } },
				),
			]);

			assert.deepStrictEqual(outcome, {
				type: 'prevent',
				meta: { app: { id: 'preventing', name: 'preventing app', i18nNamespace: 'app-preventing' } },
				i18n: { key: 'callee_is_dnd' },
			});
		});

		/**
		 * `isEventResult` only recognizes the marker, so an app can send anything under it. `meta` is
		 * built from the `ProxiedApp` and overwrites whatever came over the wire.
		 */
		it('overwrites a meta the app put under the marker', async () => {
			const outcome = await runPreCallCreated([
				mockApp('preventing', {
					[AppMethod.EXECUTE_PRE_MEDIA_CALL_CREATED]: () => ({
						'@kind': EVENT_RESULT_KIND,
						'type': 'prevent',
						'reason': 'callee is on a do-not-disturb list',
						'meta': { app: { id: 'another-app', name: 'Another App' } },
					}),
				}),
			]);

			assert.deepStrictEqual(outcome, {
				type: 'prevent',
				meta: { app: { id: 'preventing', name: 'preventing app', i18nNamespace: 'app-preventing' } },
				reason: 'callee is on a do-not-disturb list',
			});
		});

		it('chains patches, handing each app what the previous one patched', async () => {
			const seen: string[][] = [];
			const outcome = await runPreCallCreated([
				mockApp('first', {
					[AppMethod.EXECUTE_PRE_MEDIA_CALL_CREATED]: (ctx: IPreMediaCallCreatedContext) => {
						seen.push(ctx.features);
						return EventResult.patch({ features: [...ctx.features, 'hold'] });
					},
				}),
				mockApp('second', {
					[AppMethod.EXECUTE_PRE_MEDIA_CALL_CREATED]: (ctx: IPreMediaCallCreatedContext) => {
						seen.push(ctx.features);
						return EventResult.patch({ features: [...ctx.features, 'transfer'] });
					},
				}),
			]);

			assert.deepStrictEqual(seen, [['audio'], ['audio', 'hold']]);
			// One patch stands for all of them: the accumulated context, not the last app's fragment
			assert.deepStrictEqual(outcome, {
				type: 'patch',
				patch: { ...context, features: ['audio', 'hold', 'transfer'] },
			});
		});

		it('drops patches to anything other than the requested features', async () => {
			const outcome = await runPreCallCreated([
				mockApp('rerouting', {
					[AppMethod.EXECUTE_PRE_MEDIA_CALL_CREATED]: () =>
						EventResult.patch({
							callee: { type: 'user', id: 'someone-else' },
							// Follows from the contacts, so an app cannot claim the call came from elsewhere
							origin: 'sip-inbound',
							features: ['audio', 'hold'],
						} as never),
				}),
			]);

			assert.deepStrictEqual(outcome, { type: 'patch', patch: { ...context, features: ['audio', 'hold'] } });
		});

		it('drops a patch whose features are not a list', async () => {
			const { result: outcome, warnings } = await capturingWarnings(() =>
				runPreCallCreated([
					mockApp('confused', {
						[AppMethod.EXECUTE_PRE_MEDIA_CALL_CREATED]: () => EventResult.patch({ features: 'audio' } as never),
					}),
				]),
			);

			// The app patched, so the outcome is a patch; nothing usable came with it, so the context is unchanged
			assert.deepStrictEqual(outcome, { type: 'patch', patch: context });
			assert.deepStrictEqual(warnings, []);
		});

		it('drops a patch that carries no payload, rather than failing the call over it', async () => {
			const { result: outcome, warnings } = await capturingWarnings(() =>
				runPreCallCreated([
					// Hand-rolled rather than built by `EventResult.patch`: the marker is all
					// `isEventResult` looks at, so nothing guarantees a patch underneath it
					mockApp('marker-only', {
						[AppMethod.EXECUTE_PRE_MEDIA_CALL_CREATED]: () => ({ '@kind': EVENT_RESULT_KIND, 'type': 'patch' }),
					}),
				]),
			);

			assert.deepStrictEqual(outcome, { type: 'patch', patch: context });
			assert.deepStrictEqual(warnings, ['App marker-only returned a media call patch that is not an object: undefined']);
		});

		it('ignores a return value that is not an EventResult', async () => {
			const outcome = await runPreCallCreated([
				// Predates the EventResult protocol, or is simply not speaking it
				mockApp('legacy', { [AppMethod.EXECUTE_PRE_MEDIA_CALL_CREATED]: () => ({ type: 'prevent', reason: 'not an EventResult' }) }),
			]);

			assert.deepStrictEqual(outcome, { type: 'pass' });
		});

		/**
		 * The static types forbid this, so it only arrives from a bug or a tampered
		 * JSON-RPC payload — hence the hand-built marker instead of a factory call.
		 */
		it('warns about and passes over an EventResult variant this event does not support', async () => {
			const { result: outcome, warnings } = await capturingWarnings(() =>
				runPreCallCreated([
					mockApp('prompting', {
						[AppMethod.EXECUTE_PRE_MEDIA_CALL_CREATED]: () => ({
							'@kind': EVENT_RESULT_KIND,
							'type': 'prompt',
							'message': 'Are you sure?',
						}),
					}),
				]),
			);

			assert.deepStrictEqual(outcome, { type: 'pass' });
			assert.strictEqual(warnings.length, 1);
			assert.match(warnings[0], /App prompting returned an unsupported EventResult from executePreMediaCallCreated: prompt/);
		});

		/**
		 * The pre event is the one thing standing between an app's policy and a call
		 * being created, so an app that fails is not passed over the way it is on the
		 * post events: the rejection travels up to `MediaCallServer.requestCall`, which
		 * turns it into a refused call.
		 */
		it('fails closed when an app handler throws', async () => {
			await assert.rejects(
				runPreCallCreated([
					mockApp('failing', {
						[AppMethod.EXECUTE_PRE_MEDIA_CALL_CREATED]: () => {
							throw new Error('app blew up');
						},
					}),
				]),
				/app blew up/,
			);
		});
	});

	describe('post media call events', () => {
		const call: IMediaCall = {
			id: 'call-id',
			service: 'webrtc',
			kind: 'direct',
			state: 'hangup',
			createdBy: context.caller,
			createdAt: new Date(0),
			caller: context.caller,
			callee: context.callee,
			features: ['audio'],
			uids: ['caller-id', 'callee-id'],
			ended: true,
		};

		// Each post event narrows the call to the timestamp it guarantees, and carries
		// nothing beside it that the call already holds
		const endedContext: IMediaCallEndedContext = {
			call: { ...call, ended: true, endedAt: new Date(0) },
			durationMs: 0,
		};

		const startedContext: IMediaCallStartedContext = {
			call: { ...call, state: 'active', ended: false, activatedAt: new Date(0) },
		};

		const participantJoinedContext: IMediaCallParticipantJoinedContext = {
			call: { ...call, state: 'accepted', ended: false, acceptedAt: new Date(0) },
		};

		async function triggerPostEvent(
			apps: ProxiedApp[],
			event: Exclude<MediaCallEvent, { method: AppMethod.EXECUTE_PRE_MEDIA_CALL_CREATED }>,
		): Promise<void> {
			await listenerManagerFor(apps).executeListener(AppInterface.IMediaCallHandler, event);

			// Post events are dispatched without being awaited
			await new Promise((resolve) => setImmediate(resolve));
		}

		async function triggerCallEnded(apps: ProxiedApp[]): Promise<void> {
			return triggerPostEvent(apps, { method: AppMethod.EXECUTE_POST_MEDIA_CALL_ENDED, context: endedContext });
		}

		it('hands the context to every app that implements the event', async () => {
			const notified: string[] = [];

			await triggerCallEnded([
				mockApp('logging', {
					[AppMethod.EXECUTE_POST_MEDIA_CALL_ENDED]: (ctx: typeof endedContext) => {
						notified.push(`logging:${ctx.call.id}`);
					},
				}),
				mockApp('billing', {
					[AppMethod.EXECUTE_POST_MEDIA_CALL_ENDED]: (ctx: typeof endedContext) => {
						notified.push(`billing:${ctx.call.id}`);
					},
				}),
			]);

			assert.deepStrictEqual(notified, ['logging:call-id', 'billing:call-id']);
		});

		it('keeps notifying the other apps when one fails or does not implement the event', async () => {
			const notified: string[] = [];

			await triggerCallEnded([
				mockApp('failing', {
					[AppMethod.EXECUTE_POST_MEDIA_CALL_ENDED]: () => {
						throw new Error('app blew up');
					},
				}),
				mockApp('not-subscribed', { [AppMethod.EXECUTE_POST_MEDIA_CALL_STARTED]: () => undefined }),
				mockApp('logging', {
					[AppMethod.EXECUTE_POST_MEDIA_CALL_ENDED]: () => {
						notified.push('logging');
					},
				}),
			]);

			assert.deepStrictEqual(notified, ['logging']);
		});

		it('routes the started event to the method that handles it', async () => {
			const notified: string[] = [];

			await triggerPostEvent(
				[
					mockApp('logging', {
						[AppMethod.EXECUTE_POST_MEDIA_CALL_STARTED]: (ctx: IMediaCallStartedContext) => {
							notified.push(`started:${ctx.call.id}:${ctx.call.state}`);
						},
						[AppMethod.EXECUTE_POST_MEDIA_CALL_ENDED]: () => {
							notified.push('ended');
						},
					}),
				],
				{ method: AppMethod.EXECUTE_POST_MEDIA_CALL_STARTED, context: startedContext },
			);

			assert.deepStrictEqual(notified, ['started:call-id:active']);
		});

		it('routes the participant joined event to the method that handles it', async () => {
			const notified: string[] = [];

			await triggerPostEvent(
				[
					mockApp('logging', {
						[AppMethod.EXECUTE_POST_MEDIA_CALL_PARTICIPANT_JOINED]: (ctx: IMediaCallParticipantJoinedContext) => {
							notified.push(`joined:${ctx.call.callee.id}`);
						},
						[AppMethod.EXECUTE_POST_MEDIA_CALL_ENDED]: () => {
							notified.push('ended');
						},
					}),
				],
				{ method: AppMethod.EXECUTE_POST_MEDIA_CALL_PARTICIPANT_JOINED, context: participantJoinedContext },
			);

			assert.deepStrictEqual(notified, ['joined:callee-id']);
		});
	});
});
