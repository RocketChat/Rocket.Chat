import type { Contract, OutputOf, ParamsOf, PathOfKind, Procedure, ProcedureAt } from './contract';
import { PROCEDURE_ERROR, ProcedureError } from './errors';
import { isErrorObject } from '../framing/jsonrpc';

type Primitive = string | number | boolean | bigint | symbol | null | undefined | void;

type AnyFunction = (...args: never[]) => unknown;

type Kept = Primitive | Date | RegExp | Error | ArrayBuffer | ArrayBufferView;

/**
 * The part of `T` that survives the send. The sanitizer replaces a function with `undefined`, and
 * structured clone drops class prototypes, so no function member reaches the receiver.
 */
export type Wire<T> = 0 extends 1 & T
	? T
	: T extends AnyFunction
		? undefined
		: T extends Kept
			? T
			: T extends Map<infer K, infer V>
				? Map<Wire<K>, Wire<V>>
				: T extends Set<infer V>
					? Set<Wire<V>>
					: T extends readonly unknown[]
						? { [K in keyof T]: Wire<T[K]> }
						: { [K in keyof T as T[K] extends AnyFunction ? never : K]: Wire<T[K]> };

/** The send half of the messenger that a client runs on. */
export type Transport = {
	request(message: { method: string; params: object }): Promise<{ result: unknown }>;
	notify(message: { method: string; params: object }): void;
};

/** A procedure whose params can all be left out takes no params argument. */
type ParamsArgs<P extends Procedure> = {} extends ParamsOf<P> ? [params?: ParamsOf<P>] : [params: ParamsOf<P>];

export type Client<C extends Contract> = {
	request<P extends PathOfKind<C, 'request'>>(
		path: P,
		...params: ParamsArgs<ProcedureAt<C, P>>
	): Promise<Wire<OutputOf<ProcedureAt<C, P>>>>;
	notify<P extends PathOfKind<C, 'notification'>>(path: P, ...params: ParamsArgs<ProcedureAt<C, P>>): void;
};

type RejectionPayload = { message?: unknown; code?: unknown; data?: unknown };

const isDeclaredErrorData = (data: unknown): data is { name: string; data: unknown } =>
	typeof data === 'object' && data !== null && typeof (data as { name?: unknown }).name === 'string';

/** Turn a rejection of the transport into the error that the caller sees. */
const toError = (path: string, rejection: unknown): Error => {
	const payload = (rejection as { error?: RejectionPayload } | null | undefined)?.error;

	if (isErrorObject(rejection) || typeof payload?.message === 'string') {
		const { code, data, message } = payload as RejectionPayload;

		if (code === PROCEDURE_ERROR && isDeclaredErrorData(data)) {
			return new ProcedureError(path, data.name, data.data);
		}

		return new Error(message as string);
	}

	if (rejection instanceof Error) {
		return rejection;
	}

	return new Error('An unknown error occurred', { cause: rejection });
};

/** A client for the procedures of one contract. The subprocess loads it without Zod. */
export const createClient = <C extends Contract>(transport: Transport): Client<C> =>
	({
		request: (path: string, params: object = {}) =>
			transport.request({ method: path, params }).then(
				(response) => response.result,
				(rejection: unknown) => {
					throw toError(path, rejection);
				},
			),

		notify: (path: string, params: object = {}) => transport.notify({ method: path, params }),
	}) as Client<C>;
