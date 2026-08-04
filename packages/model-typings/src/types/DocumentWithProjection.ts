import type { FindOptions } from 'mongodb';

type Prettify<T> = {
	[K in keyof T]: T[K];
} & {};

export type DocumentWithProjection<T extends NonNullable<unknown>, O extends FindOptions<T>['projection']> = O extends {
	projection: infer P;
}
	? P extends FindOptions<T>['projection']
		? keyof P extends keyof T
			? Prettify<Pick<T, keyof P & keyof T>>
			: T
		: T
	: T;
