export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<T>;

export type ExtractKeys<T, K extends keyof T, U> = T[K] extends U ? K : never;

export type ValueOf<T> = T[keyof T];

export type UnionToIntersection<T> = (T extends any ? (x: T) => void : never) extends (x: infer U) => void ? U : never;

export type Awaited<T> = T extends PromiseLike<infer U> ? Awaited<U> : T;

// `T extends any` is a trick to apply a operator to each member of a union
export type KeyOfEach<T> = T extends any ? keyof T : never;

// Taken from https://effectivetypescript.com/2020/04/09/jsonify/
export type Jsonify<T> = T extends Date
	? string
	: T extends object
		? {
				[k in keyof T]: Jsonify<T[k]>;
			}
		: T;

// Use AtLeast when you don't care if you receive a partial or full object, as long as the specified attributes are loaded
// Attributes defined as optional will continue to be optional.
export type AtLeast<T, K extends keyof T> = Partial<T> & Pick<T, K>;

// Use RequiredField when you want a full object with specific optional fields no longer being optional.
export type RequiredField<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type DeepWritable<T> = T extends (...args: any) => any
	? T
	: {
			-readonly [P in keyof T]: DeepWritable<T[P]>;
		};

export type DistributiveOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never;

export type ValueOfUnion<T, K extends KeyOfEach<T>> = T extends any ? (K extends keyof T ? T[K] : undefined) : undefined;

export type ValueOfOptional<T, K extends KeyOfEach<T>> = T extends undefined ? undefined : T extends object ? ValueOfUnion<T, K> : null;

export type DeepPartial<T> = {
	[P in keyof T]?: T[P] extends (infer U)[] | undefined
		? DeepPartial<U>[]
		: T[P] extends Date | undefined
			? T[P]
			: T[P] extends object | undefined
				? DeepPartial<T[P]>
				: T[P];
};

export const isNotUndefined = <T>(value: T | undefined): value is T => value !== undefined;
