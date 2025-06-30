export const enum BSONType {
	Double = 1,
	String,
	Object,
	Array,
	BinData,
	/** @deprecated */
	Undefined,
	ObjectId,
	Boolean,
	Date,
	Null,
	Regex,
	/** @deprecated */
	DBPointer,
	JavaScript,
	/** @deprecated */
	Symbol,
	JavaScriptWithScope,
	Int,
	Timestamp,
	Long,
	Decimal,
	MinKey = -1,
	MaxKey = 127,
}

type Join<T extends unknown[], D extends string> = T extends []
	? ''
	: T extends [string | number]
		? `${T[0]}`
		: T extends [string | number, ...infer R]
			? `${T[0]}${D}${Join<R, D>}`
			: string;

type NestedPaths<TType, TDepth extends number[]> = TDepth['length'] extends 8
	? []
	: TType extends
				| string
				| number
				| bigint
				| boolean
				| Date
				| RegExp
				| Buffer
				| Uint8Array
				| ((...args: any[]) => any)
				| {
						_bsontype: string;
				  }
		? []
		: TType extends ReadonlyArray<infer ArrayType>
			? [] | [number, ...NestedPaths<ArrayType, [...TDepth, 1]>]
			: TType extends Map<string, any>
				? [string]
				: TType extends object
					? {
							[Key in Extract<keyof TType, string>]: TType[Key] extends TType
								? [Key]
								: TType extends TType[Key]
									? [Key]
									: TType[Key] extends ReadonlyArray<infer ArrayType>
										? TType extends ArrayType
											? [Key]
											: ArrayType extends TType
												? [Key]
												: [Key, ...NestedPaths<TType[Key], [...TDepth, 1]>] // child is not structured the same as the parent
										: [Key, ...NestedPaths<TType[Key], [...TDepth, 1]>] | [Key];
						}[Extract<keyof TType, string>]
					: [];

type EnhancedOmit<TRecordOrUnion, TKeyUnion> = string extends keyof TRecordOrUnion
	? TRecordOrUnion
	: TRecordOrUnion extends any
		? Pick<TRecordOrUnion, Exclude<keyof TRecordOrUnion, TKeyUnion>>
		: never;

type WithId<TSchema> = EnhancedOmit<TSchema, '_id'> & {
	_id: string;
};

type RegExpOrString<T> = T extends string ? RegExp | T : T;

type AlternativeType<T> = T extends ReadonlyArray<infer U> ? T | RegExpOrString<U> : RegExpOrString<T>;

type BSONTypeAlias = keyof typeof BSONType;

type BitwiseFilter = number /** numeric bit mask */ | ReadonlyArray<number>;

export type FieldExpression<TValue> = {
	$eq?: TValue;
	$gt?: TValue;
	$gte?: TValue;
	$in?: ReadonlyArray<TValue>;
	$lt?: TValue;
	$lte?: TValue;
	$ne?: TValue;
	$nin?: ReadonlyArray<TValue>;
	$not?: TValue extends string ? FieldExpression<TValue> | RegExp : FieldExpression<TValue>;
	$exists?: boolean;
	$type?: BSONType | BSONTypeAlias;
	$expr?: Record<string, any>;
	$jsonSchema?: Record<string, any>;
	$mod?: TValue extends number ? [number, number] : never;
	$regex?: TValue extends string ? RegExp | string : never;
	$options?: TValue extends string ? string : never;
	$geoIntersects?: {
		$geometry: Record<string, any>;
	};
	$geoWithin?: Record<string, any>;
	$near?: Record<string, any>;
	$nearSphere?: Record<string, any>;
	$maxDistance?: number;
	$all?: ReadonlyArray<any>;
	$elemMatch?: Record<string, any>;
	$size?: TValue extends ReadonlyArray<any> ? number : never;
	$bitsAllClear?: BitwiseFilter;
	$bitsAllSet?: BitwiseFilter;
	$bitsAnyClear?: BitwiseFilter;
	$bitsAnySet?: BitwiseFilter;
	$rand?: Record<string, never>;
};

type Condition<T> = AlternativeType<T> | FieldExpression<AlternativeType<T>>;

type PropertyType<TType, TProperty extends string> = string extends TProperty
	? unknown
	: TProperty extends keyof TType
		? TType[TProperty]
		: TProperty extends `${number}`
			? TType extends ReadonlyArray<infer ArrayType>
				? ArrayType
				: unknown
			: TProperty extends `${infer Key}.${infer Rest}`
				? Key extends `${number}`
					? TType extends ReadonlyArray<infer ArrayType>
						? PropertyType<ArrayType, Rest>
						: unknown
					: Key extends keyof TType
						? TType[Key] extends Map<string, infer MapType>
							? MapType
							: PropertyType<TType[Key], Rest>
						: unknown
				: unknown;

type RootFilterOperators<TSchema> = Record<string, any> & {
	$and?: Filter<TSchema>[];
	$nor?: Filter<TSchema>[];
	$or?: Filter<TSchema>[];
	$text?: {
		$search: string;
		$language?: string;
		$caseSensitive?: boolean;
		$diacriticSensitive?: boolean;
	};
	$where?: string | ((this: TSchema) => boolean);
	$comment?: string | Record<string, any>;
};

export type Filter<TSchema> = {
	[Property in Join<NestedPaths<WithId<TSchema>, []>, '.'>]?: Condition<PropertyType<WithId<TSchema>, Property>>;
} & RootFilterOperators<WithId<TSchema>>;

export type Sort =
	| (string | [string, 'asc' | 'desc'])[]
	| {
			[key: string]: -1 | 1;
	  };

export type ArrayIndices = (number | 'x')[];

export type LookupBranch = {
	value: unknown;
	dontIterate?: boolean;
	arrayIndices?: ArrayIndices;
};
