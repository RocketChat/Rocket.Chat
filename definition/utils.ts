export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<T>;

export type ExtractKeys<T, K extends keyof T, U> = T[K] extends U ? K : never;

export type ValueOf<T> = T[keyof T];

export type UnionToIntersection<T> = (T extends any ? (x: T) => void : never) extends (x: infer U) => void ? U : never;

export type Awaited<T> = T extends PromiseLike<infer U> ? Awaited<U> : T;

// `T extends any` is a trick to apply a operator to each member of a union
export type KeyOfEach<T> = T extends any ? keyof T : never;
