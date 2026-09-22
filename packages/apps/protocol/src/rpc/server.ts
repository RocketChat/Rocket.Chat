import type { z } from 'zod';

import type { Contract, Domain, ErrorDataOf, ErrorNameOf, InputOf, OutputOf, Procedure } from './contract';
import { PROCEDURE_ERROR, ProcedureError } from './errors';
import type { Defined, ErrorObject, NotificationObject, RequestObject, SuccessObject } from '../framing/jsonrpc';
import { JsonRpcError, SERVER_ERROR, error, success } from '../framing/jsonrpc';

type MaybePromise<T> = T | Promise<T>;

/** `AppsEngineException.JSONRPC_ERROR_CODE`. A thrown error with this code keeps it on the wire. */
const APPS_ENGINE_EXCEPTION = -32070;

export type ErrorConstructors<P extends Procedure> = {
	readonly [N in ErrorNameOf<P>]: (data: ErrorDataOf<P, N>) => ProcedureError<N, ErrorDataOf<P, N>>;
};

export type HandlerOptions<P extends Procedure, Ctx> = {
	ctx: Ctx;
	input: InputOf<P>;
	errors: ErrorConstructors<P>;
	path: string;
	procedure: P;
};

export type Handler<P extends Procedure, Ctx> = (options: HandlerOptions<P, Ctx>) => MaybePromise<OutputOf<P>>;

/** One handler for each procedure of a domain. */
export type Handlers<D extends Domain, Ctx> = { [N in keyof D]: Handler<D[N], Ctx> };

/** One `Handlers` object for each domain of a contract. */
export type ContractHandlers<C extends Contract, Ctx> = { [D in keyof C]: Handlers<C[D], Ctx> };

/**
 * Wraps a handler. It gets the input after validation, and it can return without a call to
 * `next`, which skips the handler.
 */
export type Middleware<Ctx> = (options: {
	ctx: Ctx;
	path: string;
	procedure: Procedure;
	input: unknown;
	next: () => Promise<unknown>;
}) => MaybePromise<unknown>;

type AnyHandler = (options: never) => unknown;

type ErasedHandler = (options: HandlerOptions<Procedure, unknown>) => unknown;

export class UnknownProcedureError extends Error {
	constructor(public readonly path: string) {
		super(`Unknown procedure ${path}`);
		this.name = 'UnknownProcedureError';
	}
}

export class InputError extends Error {
	constructor(
		public readonly path: string,
		public readonly issues: z.core.$ZodIssue[],
	) {
		super(`Invalid input for ${path}`);
		this.name = 'InputError';
	}
}

/** A request sent to a notification procedure, or the reverse. */
export class KindMismatchError extends Error {
	constructor(public readonly path: string) {
		super(`Wrong message kind for ${path}`);
		this.name = 'KindMismatchError';
	}
}

const wrap =
	<Ctx>(middleware: Middleware<Ctx>, handler: AnyHandler): ErasedHandler =>
	(options) =>
		middleware({
			ctx: options.ctx as Ctx,
			path: options.path,
			procedure: options.procedure,
			input: options.input,
			next: async () => handler(options as never),
		});

/** Apply a middleware to one procedure. */
export function use<Ctx, H extends AnyHandler>(middleware: Middleware<Ctx>, handler: H): H;
/** Apply a middleware to every procedure of one domain. */
export function use<Ctx, D extends Record<string, AnyHandler>>(middleware: Middleware<Ctx>, handlers: D): D;
export function use<Ctx>(
	middleware: Middleware<Ctx>,
	target: AnyHandler | Record<string, AnyHandler>,
): AnyHandler | Record<string, AnyHandler> {
	if (typeof target === 'function') {
		return wrap(middleware, target);
	}

	return Object.fromEntries(Object.entries(target).map(([name, handler]) => [name, wrap(middleware, handler)]));
}

export type Implementation<C extends Contract, Ctx> = {
	readonly contract: C;

	/** Run one procedure: validation, middleware, then the handler. Throws on every failure. */
	call(path: string, params: unknown, ctx: Ctx): Promise<unknown>;

	/**
	 * Answer one inbound message. A request always gets a response. A notification gets none, and
	 * its failure rejects.
	 */
	dispatch(message: RequestObject | NotificationObject, ctx: Ctx): Promise<SuccessObject | ErrorObject | undefined>;
};

type Entry = {
	procedure: Procedure;
	run: (ctx: unknown, input: unknown) => Promise<unknown>;
};

const toJsonRpcError = (thrown: unknown): JsonRpcError => {
	if (thrown instanceof UnknownProcedureError) {
		return JsonRpcError.methodNotFound(thrown.path);
	}

	if (thrown instanceof KindMismatchError) {
		return JsonRpcError.invalidRequest();
	}

	if (thrown instanceof InputError) {
		return JsonRpcError.invalidParams(thrown.issues);
	}

	if (thrown instanceof ProcedureError) {
		return new JsonRpcError(thrown.message, PROCEDURE_ERROR, { name: thrown.name, data: thrown.data });
	}

	const { message, code, data } = (thrown ?? {}) as { message?: unknown; code?: unknown; data?: unknown };
	const text = typeof message === 'string' ? message : String(thrown);

	if (code === APPS_ENGINE_EXCEPTION) {
		return new JsonRpcError(text, APPS_ENGINE_EXCEPTION, data);
	}

	return new JsonRpcError(text, SERVER_ERROR);
};

/**
 * Bind one handler to each procedure of a contract. The contract is the surface: a handler that it
 * does not declare is unreachable.
 */
export function implement<C extends Contract, Ctx>(
	contract: C,
	handlers: ContractHandlers<C, Ctx>,
	options: { use?: Middleware<Ctx>[] } = {},
): Implementation<C, Ctx> {
	const registry = new Map<string, Entry>();

	for (const [domainName, domain] of Object.entries(contract)) {
		for (const [procedureName, procedure] of Object.entries(domain)) {
			if (domainName.includes('.') || procedureName.includes('.')) {
				throw new TypeError(`A contract key must not contain a dot: ${domainName}.${procedureName}`);
			}

			const path = `${domainName}.${procedureName}`;
			const handler = (handlers as Record<string, Record<string, AnyHandler> | undefined>)[domainName]?.[procedureName];

			if (typeof handler !== 'function') {
				throw new TypeError(`No handler for ${path}`);
			}

			const errors = Object.fromEntries(
				Object.keys(procedure.errors).map((name) => [name, (data: unknown) => new ProcedureError(path, name, data)]),
			);

			const run = (options.use ?? []).reduceRight<AnyHandler>((next, middleware) => wrap(middleware, next), handler);

			registry.set(path, {
				procedure,
				run: async (ctx, input) => run({ ctx, input, errors, path, procedure } as never),
			});
		}
	}

	const call = async (path: string, params: unknown, ctx: Ctx): Promise<unknown> => {
		const entry = registry.get(path);

		if (!entry) {
			throw new UnknownProcedureError(path);
		}

		const parsed = entry.procedure.input.safeParse(params);

		if (!parsed.success) {
			throw new InputError(path, parsed.error.issues);
		}

		return entry.run(ctx, parsed.data);
	};

	const dispatch = async (message: RequestObject | NotificationObject, ctx: Ctx): Promise<SuccessObject | ErrorObject | undefined> => {
		const kind = 'id' in message ? 'request' : 'notification';
		const entry = registry.get(message.method);

		const outcome =
			entry && entry.procedure.kind !== kind
				? Promise.reject(new KindMismatchError(message.method))
				: call(message.method, message.params, ctx);

		if (kind === 'notification') {
			await outcome;

			return undefined;
		}

		const { id } = message as RequestObject;

		return outcome.then(
			(value) => success(id, (value ?? null) as Defined),
			(thrown: unknown) => error(id, toJsonRpcError(thrown)),
		);
	};

	return { contract, call, dispatch };
}
