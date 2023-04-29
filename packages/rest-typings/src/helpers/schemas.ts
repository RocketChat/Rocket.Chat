import Ajv from 'ajv';
import type { Static, TSchema, UnionToIntersect } from '@sinclair/typebox';
import { Type } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';

export const ajv = new Ajv({
	coerceTypes: true,
});

export const type = {
	strict: Type.Strict.bind(Type),
	bigInt: Type.BigInt.bind(Type),
	constructorParameters: Type.ConstructorParameters.bind(Type),
	constructor: Type.Constructor.bind(Type),
	date: Type.Date.bind(Type),
	function: Type.Function.bind(Type),
	instanceType: Type.InstanceType.bind(Type),
	parameters: Type.Parameters.bind(Type),
	promise: Type.Promise.bind(Type),
	regEx: Type.RegEx.bind(Type),
	returnType: Type.ReturnType.bind(Type),
	symbol: Type.Symbol.bind(Type),
	undefined: Type.Undefined.bind(Type),
	uint8Array: Type.Uint8Array.bind(Type),
	void: Type.Void.bind(Type),
	optional: Type.Optional.bind(Type),
	readonlyOptional: Type.ReadonlyOptional.bind(Type),
	readonly: Type.Readonly.bind(Type),
	any: Type.Any.bind(Type),
	array: Type.Array.bind(Type),
	boolean: Type.Boolean.bind(Type),
	composite: Type.Composite.bind(Type),
	enum: Type.Enum.bind(Type),
	extends: Type.Extends.bind(Type),
	exclude: Type.Exclude.bind(Type),
	extract: Type.Extract.bind(Type),
	index: Type.Index.bind(Type),
	integer: Type.Integer.bind(Type),
	intersect: Type.Intersect.bind(Type),
	keyOf: Type.KeyOf.bind(Type),
	literal: Type.Literal.bind(Type),
	never: Type.Never.bind(Type),
	not: Type.Not.bind(Type),
	null: Type.Null.bind(Type),
	number: Type.Number.bind(Type),
	object: Type.Object.bind(Type),
	omit: Type.Omit.bind(Type),
	partial: Type.Partial.bind(Type),
	pick: Type.Pick.bind(Type),
	record: Type.Record.bind(Type),
	recursive: Type.Recursive.bind(Type),
	ref: Type.Ref.bind(Type),
	required: Type.Required.bind(Type),
	rest: Type.Rest.bind(Type),
	string: Type.String.bind(Type),
	templateLiteral: Type.TemplateLiteral.bind(Type),
	tuple: Type.Tuple.bind(Type),
	union: Type.Union.bind(Type),
	unknown: Type.Unknown.bind(Type),
	unsafe: Type.Unsafe.bind(Type),
} as const;

export { Static };

export const check = Value.Check;

export const createTypeGuard = <T extends TSchema>(schema: T) => {
	const strict = type.strict(schema);

	return ajv.compile<Static<T>>(strict);
};

export type SchemasForEndpoints = {
	[key: `${'GET' | 'POST' | 'PUT' | 'DELETE'} ${string}`]:
		| {
				request?: TSchema;
				response: TSchema;
		  }
		| ReadonlyArray<{
				request?: TSchema;
				response: TSchema;
		  }>;
};

export type EndpointsFromSchemas<T extends SchemasForEndpoints> = {
	[TKey in keyof T as TKey extends `${string} ${infer TPathPattern}` ? TPathPattern : never]: UnionToIntersect<
		TKey extends `${infer TMethod} ${string}`
			? {
					[_TMethod in TMethod]: (T[TKey] extends readonly any[] ? T[TKey][number] : T[TKey]) extends infer TPayload
						? TPayload extends {
								request: infer TRequest extends TSchema;
						  }
							? {
									(params: Static<TRequest>): Awaited<
										TPayload extends {
											response: infer TResponse extends TSchema;
										}
											? Static<TResponse>
											: never
									>;
							  }
							: {
									(): Awaited<
										TPayload extends {
											response: infer TResponse extends TSchema;
										}
											? Static<TResponse>
											: never
									>;
							  }
						: never;
			  }
			: never
	>;
};
