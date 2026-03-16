import type { BodyInit } from 'node-fetch';

export type OriginalFetchOptions = Parameters<typeof fetch>[1];
export type FetchOptions = NonNullable<Parameters<typeof fetch>[1]>;
export type FetchOptionsWithoutBody = Omit<FetchOptions, 'body'>;

type BaseExtendedOptions = FetchOptionsWithoutBody & {
	compress?: boolean;
	follow?: number;
	size?: number;
	timeout?: number;
	params?: Record<string, any>;
	body?: BodyInit | Record<string, any>;
};

type SsrfValidationIgnored = {
	ignoreSsrfValidation: true;
	allowList?: never;
};

type SsrfValidationEnforced = {
	ignoreSsrfValidation: false;
	allowList: string | string[];
};

export type ExtendedFetchOptions = BaseExtendedOptions & (SsrfValidationIgnored | SsrfValidationEnforced);
