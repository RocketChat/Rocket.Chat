import type { BodyInit, RequestInit } from 'node-fetch';

export type OriginalFetchOptions = RequestInit | undefined;
export type FetchOptions = Omit<RequestInit, 'agent'>;
export type FetchOptionsWithoutBody = Omit<FetchOptions, 'body'>;

type BaseExtendedOptions = FetchOptionsWithoutBody & {
	compress?: boolean;
	follow?: number;
	size?: number;
	timeout?: number;
	params?: Record<string, any>;
	body?: BodyInit | Record<string, any>;
	onRedirect?: (nextUrl: URL) => void | Promise<void>;
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
