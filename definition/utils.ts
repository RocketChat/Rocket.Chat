export type ExtractKeys<T, K extends keyof T, U> = T[K] extends U ? K : never;

export type ValueOf<T> = T[keyof T];

export type UnionToIntersection<T> = (T extends any ? (x: T) => void : never) extends (x: infer U) => void
	? U
	: never;
