import { EventEmitter } from 'node:events';
import path from 'node:path';
import { Worker } from 'node:worker_threads';

import type { Decision, EventName, EventPayloads } from '@rocket.chat/apps-sdk';

import {
	isFailure,
	isResponse,
	RpcErrorCode,
	type DispatchResult,
	type FaultParams,
	type JsonRpcId,
	type JsonRpcMessage,
	type JsonRpcNotification,
	type LoadResult,
} from './protocol';

/** A typed JSON-RPC error surfaced across the boundary. */
export class RpcError extends Error {
	constructor(
		readonly code: number,
		message: string,
		readonly data?: unknown,
	) {
		super(message);
		this.name = 'RpcError';
	}
}

const DEFAULT_WORKER_ENTRY = path.join(__dirname, 'worker.js');

export type AppWorkerOptions = {
	/** Path to the app package `.tgz`. */
	packagePath: string;
	/** Override the in-worker bootstrap entry (tests/tooling). Defaults to the compiled `worker.js`. */
	workerEntry?: string;
};

type Pending = { resolve: (value: unknown) => void; reject: (err: unknown) => void };

/**
 * Host-side handle to a single app running in its own worker thread (decision 0005). Speaks
 * JSON-RPC 2.0 to the worker, correlating requests by `id`. Emits `'fault'` (out-of-band worker
 * failure) and `'exit'`.
 */
export class AppWorker extends EventEmitter {
	private readonly worker: Worker;

	private seq = 0;

	private readonly pending = new Map<JsonRpcId, Pending>();

	constructor(options: AppWorkerOptions) {
		super();
		this.worker = new Worker(options.workerEntry ?? DEFAULT_WORKER_ENTRY, {
			workerData: { packagePath: options.packagePath },
		});
		this.worker.on('message', (msg: JsonRpcMessage) => this.onMessage(msg));
		this.worker.on('error', (err: Error) => this.onWorkerError(err));
		this.worker.on('exit', (code: number) => this.onExit(code));
	}

	private onMessage(msg: JsonRpcMessage): void {
		if (isResponse(msg)) {
			if (msg.id === null) {
				return;
			}
			const pending = this.pending.get(msg.id);
			if (!pending) {
				return;
			}
			this.pending.delete(msg.id);
			if (isFailure(msg)) {
				pending.reject(new RpcError(msg.error.code, msg.error.message, msg.error.data));
			} else {
				pending.resolve(msg.result);
			}
			return;
		}

		const notification = msg as JsonRpcNotification;
		if (notification.method === 'fault') {
			this.emit('fault', notification.params as FaultParams);
		}
	}

	private onWorkerError(err: Error): void {
		this.failAll(err);
		this.emit('fault', { message: err.message, stack: err.stack } satisfies FaultParams);
	}

	private onExit(code: number): void {
		if (code !== 0) {
			this.failAll(new Error(`app worker exited with code ${code}`));
		}
		this.emit('exit', code);
	}

	private failAll(err: Error): void {
		for (const pending of this.pending.values()) {
			pending.reject(err);
		}
		this.pending.clear();
	}

	private call<R>(method: string, params: unknown): Promise<R> {
		const id = ++this.seq;
		return new Promise<R>((resolve, reject) => {
			this.pending.set(id, { resolve: resolve as (value: unknown) => void, reject });
			this.worker.postMessage({ jsonrpc: '2.0', id, method, params });
		});
	}

	/** Eval the bundle, run the factory, and return the registration manifest. */
	load(): Promise<LoadResult> {
		return this.call<LoadResult>('load', {});
	}

	/** Fire one event and await its `Decision`. Rejects with {@link RpcError} on a handler throw. */
	async dispatch<E extends EventName>(name: E, payload: EventPayloads[E]): Promise<Decision> {
		const { decision } = await this.call<DispatchResult>('dispatch', { event: { name, payload } });
		return decision;
	}

	/**
	 * Fail-closed convenience for `pre` events (0003 §2 / 0005 §4 invariant #4): a handler throw is
	 * mapped to an implicit veto instead of a rejection.
	 */
	async dispatchPre<E extends EventName>(name: E, payload: EventPayloads[E]): Promise<Decision> {
		try {
			return await this.dispatch(name, payload);
		} catch (err) {
			if (err instanceof RpcError && err.code === RpcErrorCode.HandlerThrew) {
				return { kind: 'prevent', reason: { message: 'app handler failed' } };
			}
			throw err;
		}
	}

	terminate(): Promise<number> {
		return this.worker.terminate();
	}
}
