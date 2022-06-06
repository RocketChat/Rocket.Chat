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

export type AtLeast<T, K extends keyof T> = Partial<T> & Pick<T, K>;

export type RequiredField<T, K extends keyof T> = T & Required<Pick<T, K>>;
