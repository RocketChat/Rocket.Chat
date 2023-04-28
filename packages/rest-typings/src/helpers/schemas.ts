import Ajv, { JSONSchemaType } from 'ajv';
import type { Static, TSchema } from '@sinclair/typebox';
import { Type } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';

const ajv = new Ajv({
	coerceTypes: true,
});

/**
 * @borrows Type.Union as union
 */
export const type = {
	strict: Type.Strict,
	bigInt: Type.BigInt,
	ConstructorParameters: Type.ConstructorParameters,
	Constructor: Type.Constructor,
	// /** `[Extended]` Creates a Date type */
	// Date(options?: DateOptions): TDate;
	// /** `[Extended]` Creates a Function type */
	// Function<T extends TSchema[], U extends TSchema>(parameters: [...T], returns: U, options?: SchemaOptions): TFunction<T, U>;
	// /** `[Extended]` Extracts the InstanceType from the given Constructor */
	// InstanceType<T extends TConstructor<any[], any>>(schema: T, options?: SchemaOptions): TInstanceType<T>;
	// /** `[Extended]` Extracts the Parameters from the given Function type */
	// Parameters<T extends TFunction<any[], any>>(schema: T, options?: SchemaOptions): TParameters<T>;
	// /** `[Extended]` Creates a Promise type */
	// Promise<T extends TSchema>(item: T, options?: SchemaOptions): TPromise<T>;
	// /** `[Extended]` Creates a regular expression type */
	// RegEx(regex: RegExp, options?: SchemaOptions): TString;
	// /** `[Extended]` Extracts the ReturnType from the given Function */
	// ReturnType<T extends TFunction<any[], any>>(schema: T, options?: SchemaOptions): TReturnType<T>;
	// /** `[Extended]` Creates a Symbol type */
	// Symbol(options?: SchemaOptions): TSymbol;
	// /** `[Extended]` Creates a Undefined type */
	// Undefined(options?: SchemaOptions): TUndefined;
	// /** `[Extended]` Creates a Uint8Array type */
	// Uint8Array(options?: Uint8ArrayOptions): TUint8Array;
	// /** `[Extended]` Creates a Void type */
	// Void(options?: SchemaOptions): TVoid;
	optional: Type.Optional,
	// /** `[Modifier]` Creates a ReadonlyOptional property */
	// ReadonlyOptional<T extends TSchema>(schema: T): TReadonlyOptional<T>;
	// /** `[Modifier]` Creates a Readonly object or property */
	// Readonly<T extends TSchema>(schema: T): TReadonly<T>;
	// /** `[Standard]` Creates an Any type */
	// Any(options?: SchemaOptions): TAny;
	// /** `[Standard]` Creates an Array type */
	array: Type.Array,
	boolean: Type.Boolean,
	// /** `[Standard]` Creates a Composite object type. */
	// Composite<T extends TObject[]>(objects: [...T], options?: ObjectOptions): TComposite<T>;
	enum: Type.Enum,
	// /** `[Standard]` A conditional type expression that will return the true type if the left type extends the right */
	// Extends<L extends TSchema, R extends TSchema, T extends TSchema, U extends TSchema>(left: L, right: R, trueType: T, falseType: U, options?: SchemaOptions): TExtends<L, R, T, U>;
	// /** `[Standard]` Excludes from the left type any type that is not assignable to the right */
	// Exclude<L extends TSchema, R extends TSchema>(left: L, right: R, options?: SchemaOptions): TExclude<L, R>;
	// /** `[Standard]` Extracts from the left type any type that is assignable to the right */
	// Extract<L extends TSchema, R extends TSchema>(left: L, right: R, options?: SchemaOptions): TExtract<L, R>;
	// /** `[Standard]` Returns indexed property types for the given keys */
	// Index<T extends TSchema, K extends (keyof Static<T>)[]>(schema: T, keys: [...K], options?: SchemaOptions): TIndexReduce<T, Assert<K, Key[]>>;
	// /** `[Standard]` Returns indexed property types for the given keys */
	// Index<T extends TSchema, K extends TSchema>(schema: T, key: K, options?: SchemaOptions): TIndex<T, K>;
	// /** `[Standard]` Creates an Integer type */
	// Integer(options?: NumericOptions<number>): TInteger;
	// /** `[Standard]` Creates a Intersect type */
	// Intersect(allOf: [], options?: SchemaOptions): TNever;
	// /** `[Standard]` Creates a Intersect type */
	// Intersect<T extends [TSchema]>(allOf: [...T], options?: SchemaOptions): T[0];
	// Intersect<T extends TSchema[]>(allOf: [...T], options?: IntersectOptions): TIntersect<T>;
	// /** `[Standard]` Creates a KeyOf type */
	// KeyOf<T extends TSchema>(schema: T, options?: SchemaOptions): TKeyOf<T>;
	literal: Type.Literal,
	// /** `[Standard]` Creates a Never type */
	// Never(options?: SchemaOptions): TNever;
	// /** `[Standard]` Creates a Not type. The first argument is the disallowed type, the second is the allowed. */
	// Not<N extends TSchema, T extends TSchema>(not: N, schema: T, options?: SchemaOptions): TNot<N, T>;
	// /** `[Standard]` Creates a Null type */
	// Null(options?: SchemaOptions): TNull;
	number: Type.Number,
	object: Type.Object,
	// /** `[Standard]` Creates a mapped type whose keys are omitted from the given type */
	// Omit<T extends TSchema, K extends (keyof Static<T>)[]>(schema: T, keys: readonly [...K], options?: SchemaOptions): TOmit<T, K[number]>;
	// /** `[Standard]` Creates a mapped type whose keys are omitted from the given type */
	// Omit<T extends TSchema, K extends TUnion<TLiteral<string>[]>>(schema: T, keys: K, options?: SchemaOptions): TOmit<T, TUnionLiteralKeyRest<K>[number]>;
	// /** `[Standard]` Creates a mapped type whose keys are omitted from the given type */
	// Omit<T extends TSchema, K extends TLiteral<string>>(schema: T, key: K, options?: SchemaOptions): TOmit<T, K['const']>;
	// /** `[Standard]` Creates a mapped type whose keys are omitted from the given type */
	// Omit<T extends TSchema, K extends TTemplateLiteral>(schema: T, key: K, options?: SchemaOptions): TOmit<T, TTemplateLiteralKeyRest<K>[number]>;
	// /** `[Standard]` Creates a mapped type whose keys are omitted from the given type */
	// Omit<T extends TSchema, K extends TNever>(schema: T, key: K, options?: SchemaOptions): TOmit<T, never>;
	// /** `[Standard]` Creates a mapped type where all properties are Optional */
	// Partial<T extends TSchema>(schema: T, options?: ObjectOptions): TPartial<T>;
	// /** `[Standard]` Creates a mapped type whose keys are picked from the given type */
	// Pick<T extends TSchema, K extends (keyof Static<T>)[]>(schema: T, keys: readonly [...K], options?: SchemaOptions): TPick<T, K[number]>;
	// /** `[Standard]` Creates a mapped type whose keys are picked from the given type */
	// Pick<T extends TSchema, K extends TUnion<TLiteral<string>[]>>(schema: T, keys: K, options?: SchemaOptions): TPick<T, TUnionLiteralKeyRest<K>[number]>;
	// /** `[Standard]` Creates a mapped type whose keys are picked from the given type */
	// Pick<T extends TSchema, K extends TLiteral<string>>(schema: T, key: K, options?: SchemaOptions): TPick<T, K['const']>;
	// /** `[Standard]` Creates a mapped type whose keys are picked from the given type */
	// Pick<T extends TSchema, K extends TTemplateLiteral>(schema: T, key: K, options?: SchemaOptions): TPick<T, TTemplateLiteralKeyRest<K>[number]>;
	// /** `[Standard]` Creates a mapped type whose keys are picked from the given type */
	// Pick<T extends TSchema, K extends TNever>(schema: T, key: K, options?: SchemaOptions): TPick<T, never>;
	record: Type.Record,
	recursive: Type.Recursive,
	// /** `[Standard]` Creates a Ref type. The referenced type must contain a $id */
	// Ref<T extends TSchema>(schema: T, options?: SchemaOptions): TRef<T>;
	// /** `[Standard]` Creates a mapped type where all properties are Required */
	// Required<T extends TSchema>(schema: T, options?: SchemaOptions): TRequired<T>;
	// /** `[Standard]` Returns a schema array which allows types to compose with the JavaScript spread operator */
	// Rest<T extends TSchema>(schema: T): TRest<T>;
	// /** `[Standard]` Creates a String type */
	string: Type.String,
	// /** `[Standard]` Creates a template literal type */
	// TemplateLiteral<T extends TTemplateLiteralKind[]>(kinds: [...T], options?: SchemaOptions): TTemplateLiteral<T>;
	// /** `[Standard]` Creates a Tuple type */
	// Tuple<T extends TSchema[]>(items: [...T], options?: SchemaOptions): TTuple<T>;
	union: Type.Union,
	unknown: Type.Unknown,
	// /** `[Standard]` Creates a Unsafe type that infers for the generic argument */
	// Unsafe<T>(options?: UnsafeOptions): TUnsafe<T>;
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

export { JSONSchemaType as SchemaType };
