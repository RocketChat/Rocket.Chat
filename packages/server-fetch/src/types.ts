import type { BodyInit } from 'node-fetch';

export type OriginalFetchOptions = Parameters<typeof fetch>[1];
export type FetchOptions = NonNullable<Parameters<typeof fetch>[1]>;
export type FetchOptionsWithoutBody = Omit<FetchOptions, 'body'>;
export type ExtendedFetchOptions = FetchOptionsWithoutBody & {
	compress?: boolean;
	follow?: number;
	size?: number;
	timeout?: number;
	params?: Record<string, any>;
	body?: BodyInit | Record<string, any>;
	ignoreSsrfValidation?: boolean;
	/** Optional SSRF allowlist: raw string (newline/comma-separated) or array of hosts/IPs/CIDRs. Parsed once inside the package. */
	allowList?: string | string[];
};
