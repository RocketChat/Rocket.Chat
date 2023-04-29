import Ajv from 'ajv';
import type { Static, TSchema, UnionToIntersect } from '@sinclair/typebox';
import { Type } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';

export const ajv = new Ajv({
	coerceTypes: true,
});

export const type = {
	strict: Type.Strict,
	bigInt: Type.BigInt,
	constructorParameters: Type.ConstructorParameters,
	constructor: Type.Constructor,
	date: Type.Date,
	function: Type.Function,
	instanceType: Type.InstanceType,
	parameters: Type.Parameters,
	promise: Type.Promise,
	regEx: Type.RegEx,
	returnType: Type.ReturnType,
	symbol: Type.Symbol,
	undefined: Type.Undefined,
	uint8Array: Type.Uint8Array,
	void: Type.Void,
	optional: Type.Optional,
	readonlyOptional: Type.ReadonlyOptional,
	readonly: Type.Readonly,
	any: Type.Any,
	array: Type.Array,
	boolean: Type.Boolean,
	composite: Type.Composite,
	enum: Type.Enum,
	extends: Type.Extends,
	exclude: Type.Exclude,
	extract: Type.Extract,
	index: Type.Index,
	integer: Type.Integer,
	intersect: Type.Intersect,
	keyOf: Type.KeyOf,
	literal: Type.Literal,
	never: Type.Never,
	not: Type.Not,
	null: Type.Null,
	number: Type.Number,
	object: Type.Object,
	omit: Type.Omit,
	partial: Type.Partial,
	pick: Type.Pick,
	record: Type.Record,
	recursive: Type.Recursive,
	ref: Type.Ref,
	required: Type.Required,
	rest: Type.Rest,
	string: Type.String,
	templateLiteral: Type.TemplateLiteral,
	tuple: Type.Tuple,
	union: Type.Union,
	unknown: Type.Unknown,
	unsafe: Type.Unsafe,
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
