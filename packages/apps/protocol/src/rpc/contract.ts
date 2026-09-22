import { z } from 'zod';

declare const outputType: unique symbol;

/** The declared output type of a procedure. It exists only at compile time. */
export type Output<T> = { readonly [outputType]?: T };

/** The input of every procedure: one closed object, built with `z.strictObject`. */
export type Input = z.ZodObject<z.core.$ZodLooseShape, z.core.$strict>;

export type Kind = 'request' | 'notification';

export type Procedure<K extends Kind = Kind, I extends Input = Input, O = unknown> = {
	readonly kind: K;
	readonly input: I;
	readonly output: Output<O>;
};

export type InputOf<P extends Procedure> = z.infer<P['input']>;

export type OutputOf<P extends Procedure> = P extends Procedure<Kind, Input, infer O> ? O : never;

/** Declare the output type of a procedure. */
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
export const request = <I extends Input, O>(definition: { input: I; output: Output<O> }): Procedure<'request', I, O> => {
	assertStrictObject(definition.input);

	return { kind: 'request', input: definition.input, output: definition.output };
};

/** Declare a procedure that the host does not answer. */
export const notification = <I extends Input>(definition: { input: I }): Procedure<'notification', I, void> => {
	assertStrictObject(definition.input);

	return { kind: 'notification', input: definition.input, output: type<void>() };
};

/**
 * A domain object checked only on the fields that the call depends on, and typed as the full
 * Apps-Engine interface. The converters validate the rest.
 */
export const shaped =
	<T>() =>
	<S extends { [K in keyof T]?: z.ZodType }>(shape: S & { [K in Exclude<keyof S, keyof T>]: never }): z.ZodType<T> =>
		z.looseObject(shape as z.ZodRawShape) as unknown as z.ZodType<T>;
