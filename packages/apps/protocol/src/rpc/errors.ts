import type { Contract, ErrorDataOf, ErrorNameOf, PathOfKind, ProcedureAt } from './contract';

/** The wire code of every declared error. The error name travels in `data`. */
export const PROCEDURE_ERROR = -32001;

/** An error that a procedure declares in the contract, thrown by its handler on purpose. */
export class ProcedureError<N extends string = string, D = unknown> extends Error {
	declare public readonly name: N;

	constructor(
		public readonly path: string,
		name: N,
		public readonly data: D,
	) {
		super(`${path} failed with ${name}`);
		this.name = name;
	}
}

type RequestPath<C extends Contract> = PathOfKind<C, 'request'>;

/** Narrows `error` to one declared error of one procedure, which types its `data`. */
export type ProcedureErrorGuard<C extends Contract> = <P extends RequestPath<C>, N extends ErrorNameOf<ProcedureAt<C, P>>>(
	error: unknown,
	path: P,
	name: N,
) => error is ProcedureError<N, ErrorDataOf<ProcedureAt<C, P>, N>>;

const isProcedureError = (error: unknown, path: string, name: string): boolean =>
	error instanceof ProcedureError && error.path === path && error.name === name;

/**
 * The `isProcedureError` guard for one contract. A rejection has no type, so the contract comes
 * from the type argument: `const isProcedureError = createErrorGuard<HostContract>()`.
 */
export const createErrorGuard = <C extends Contract>(): ProcedureErrorGuard<C> => isProcedureError as ProcedureErrorGuard<C>;
