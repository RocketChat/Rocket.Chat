import { z } from 'zod';

declare const outputType: unique symbol;

/** The declared output type of a procedure. It exists only at compile time. */
export type Output<T> = { readonly [outputType]?: T };

export type TypeOf<T> = T extends Output<infer U> ? U : never;

/** The input of every procedure: one closed object, built with `z.strictObject`. */
export type Input = z.ZodObject<z.core.$ZodLooseShape, z.core.$strict>;

export type Kind = 'request' | 'notification';

/** The errors that a procedure throws on purpose, by name, each with the type of its `data`. */
export type ErrorMap = { readonly [name: string]: Output<unknown> };

export type Procedure<K extends Kind = Kind, I extends Input = Input, O = unknown, E extends ErrorMap = ErrorMap> = {
	readonly kind: K;
	readonly input: I;
	readonly output: Output<O>;
	readonly errors: E;
};

/** The input that a handler gets, after validation. */
export type InputOf<P extends Procedure> = z.output<P['input']>;

/** The params that a caller sends, before validation. */
export type ParamsOf<P extends Procedure> = z.input<P['input']>;

export type OutputOf<P extends Procedure> = TypeOf<P['output']>;

export type ErrorNameOf<P extends Procedure> = keyof P['errors'] & string;

export type ErrorDataOf<P extends Procedure, N extends ErrorNameOf<P>> = TypeOf<P['errors'][N]>;

export type Domain = { readonly [procedure: string]: Procedure };

/** Procedures grouped by domain. The path of a procedure is `domain.procedure`. */
export type Contract = { readonly [domain: string]: Domain };

export type PathOf<C extends Contract> = { [D in keyof C & string]: `${D}.${keyof C[D] & string}` }[keyof C & string];

export type ProcedureAt<C extends Contract, P extends PathOf<C>> = P extends `${infer D}.${infer N}` ? C[D][N] : never;

export type PathOfKind<C extends Contract, K extends Kind> = {
	[P in PathOf<C>]: ProcedureAt<C, P>['kind'] extends K ? P : never;
}[PathOf<C>];

/** Declare the output type of a procedure, or the `data` type of a declared error. */
export const type = <T>(): Output<T> => ({}) as Output<T>;

/**
 * Reject an input that is not a strict object. The type system cannot do it: Zod types
 * `z.object` and `z.strictObject` alike.
 */
const assertStrictObject = (input: z.ZodType): void => {
	if (!(input instanceof z.ZodObject) || input._zod.def.catchall?._zod.def.type !== 'never') {
		throw new TypeError('A procedure input must be a z.strictObject');
	}
};

/** Declare a procedure that the host answers. */
export const request = <I extends Input, O, E extends ErrorMap = {}>(definition: {
	input: I;
	output: Output<O>;
	errors?: E;
}): Procedure<'request', I, O, E> => {
	assertStrictObject(definition.input);

	return { kind: 'request', input: definition.input, output: definition.output, errors: definition.errors ?? ({} as E) };
};

/** Declare a procedure that the host does not answer. */
export const notification = <I extends Input>(definition: { input: I }): Procedure<'notification', I, void, {}> => {
	assertStrictObject(definition.input);

	return { kind: 'notification', input: definition.input, output: type<void>(), errors: {} };
};

/**
 * A domain object checked only on the fields that the call depends on, and typed as the full
 * Apps-Engine interface. The converters validate the rest.
 */
export const shaped =
	<T>() =>
	<S extends { [K in keyof T]?: z.ZodType }>(shape: S & { [K in Exclude<keyof S, keyof T>]: never }): z.ZodType<T> =>
		z.looseObject(shape as z.ZodRawShape) as unknown as z.ZodType<T>;
