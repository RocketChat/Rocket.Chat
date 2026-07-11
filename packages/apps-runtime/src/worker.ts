/* eslint-disable no-return-await -- awaiting on return improves stack tracing */
/**
 * In-worker bootstrap (decision 0005). Runs *inside* the worker thread: loads the app bundle from
 * its `.tgz`, eval's it in `node:vm`, brand-checks the default export, drives the `defineApp`
 * factory to collect registrations, and answers JSON-RPC `load`/`dispatch` over `parentPort`.
 */
import { parentPort, workerData } from 'node:worker_threads';

import {
	createBuilder,
	getSetup,
	isApp,
	type AppEvent,
	type AppSetupContext,
	type BuilderCollection,
	type Ctx,
	type Decision,
	type EventName,
} from '@rocket.chat/apps-sdk';

import { RpcErrorCode, type DispatchParams, type FaultParams, type JsonRpcId, type JsonRpcRequest } from './protocol';
import { loadBundleFromTgz } from './tgz';
import { evalCjsBundle } from './vm-eval';

const port = parentPort;
if (!port) {
	throw new Error('apps-runtime worker must be spawned as a worker thread');
}

const { packagePath } = workerData as { packagePath: string };

// Slice-1 stubs: a logger-only setup context (0001 §3) and an empty per-event ctx (0002 deferred).
const setupContext: AppSetupContext = { logger: console };
const eventContext: Ctx = {} as Ctx;

let collection: BuilderCollection | undefined;

function reply(id: JsonRpcId, result: unknown): void {
	port!.postMessage({ jsonrpc: '2.0', id, result });
}

function replyError(id: JsonRpcId, code: RpcErrorCode, message: string, data?: unknown): void {
	port!.postMessage({ jsonrpc: '2.0', id, error: { code, message, data } });
}

function fault(params: FaultParams): void {
	port!.postMessage({ jsonrpc: '2.0', method: 'fault', params });
}

async function handleLoad(id: JsonRpcId): Promise<void> {
	try {
		const { code, filename } = await loadBundleFromTgz(packagePath);
		const exports = evalCjsBundle(code, filename) as { default?: unknown };
		const def = exports?.default;

		if (!isApp(def)) {
			replyError(id, RpcErrorCode.BrandInvalid, 'app default export is not a defineApp() result');
			return;
		}

		const { builder, collection: collected } = createBuilder();
		await getSetup(def)(builder, setupContext);
		collection = collected;

		reply(id, { registrations: collected.registrations });
	} catch (err) {
		replyError(id, RpcErrorCode.LoadFailed, errMessage(err), errStack(err));
	}
}

/**
 * Invariant #2 (0005 §4): the `event` object is assembled here, worker-side. The verbs are local
 * functions that return plain serializable `Decision` data — that data is the only thing that
 * crosses back to the host.
 */
function buildEvent<E extends EventName>(payload: Record<string, unknown>): AppEvent<E> {
	return {
		...payload,
		continue: { kind: 'continue' },
		patch: (partial: Record<string, unknown>): Decision => ({ kind: 'patch', patch: partial }),
		prevent: (reason): Decision => ({ kind: 'prevent', reason }),
	} as AppEvent<E>;
}

async function handleDispatch(id: JsonRpcId, params: DispatchParams): Promise<void> {
	const { name, payload } = params.event;
	try {
		if (!collection) {
			replyError(id, RpcErrorCode.LoadFailed, 'app not loaded');
			return;
		}

		const handlers = collection.handlers.get(name) ?? [];
		if (handlers.length === 0) {
			replyError(id, RpcErrorCode.NoHandler, `no handler registered for ${name}`);
			return;
		}

		const event = buildEvent(payload as unknown as Record<string, unknown>);
		// Slice 1: a single handler. The order-agnostic multi-handler pipeline + patch-merge (0003)
		// is deferred.
		const decision = await handlers[0](event, eventContext);

		if (!decision || typeof decision.kind !== 'string') {
			replyError(id, RpcErrorCode.HandlerThrew, 'handler did not return a Decision');
			return;
		}

		reply(id, { decision });
	} catch (err) {
		// Fail-closed (0003 §2 / 0005 §4 invariant #4): any throw becomes an error response. For a
		// `pre` event the host treats this as an implicit veto.
		replyError(id, RpcErrorCode.HandlerThrew, errMessage(err), errStack(err));
	}
}

// Named function as a callback to help the stack trace
port.on('message', async function messageHandler(msg: JsonRpcRequest) {
	switch (msg?.method) {
		case 'load':
			return await handleLoad(msg.id);
		case 'dispatch':
			return await handleDispatch(msg.id, msg.params as DispatchParams);
		default:
			replyError(msg?.id ?? 0, RpcErrorCode.MethodNotFound, `unknown method: ${String(msg?.method)}`);
	}
});

process.on('uncaughtException', (err) => fault({ message: errMessage(err), stack: errStack(err) }));
process.on('unhandledRejection', (err) => fault({ message: errMessage(err), stack: errStack(err) }));

function errMessage(err: unknown): string {
	return err instanceof Error ? err.message : String(err);
}

function errStack(err: unknown): string | undefined {
	return err instanceof Error ? err.stack : undefined;
}
