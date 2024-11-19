import type { BodyInit } from 'node-fetch';
import type fetch from 'node-fetch';

export type OriginalFetchOptions = Parameters<typeof fetch>[1];
export type FetchOptions = NonNullable<OriginalFetchOptions>;
export type FetchOptionsWithoutBody = Omit<FetchOptions, 'body'>;
export type ExtendedFetchOptions = FetchOptionsWithoutBody & {
	compress?: boolean;
	follow?: number;
	size?: number;
	timeout?: number;
	params?: Record<string, any>;
	body?: BodyInit | Record<string, any>;
};
