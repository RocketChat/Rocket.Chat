import { scrubText } from './scrub';

export type ExchangeErrorCode =
	/** Settings are missing or empty. Never reached the network. */
	| 'not-configured'
	/** Credentials were rejected. Retrying will not help. */
	| 'authentication-failed'
	/** Authenticated, but not allowed to read this mailbox. Usually a scoping policy. */
	| 'authorization-failed'
	/** The mailbox address does not resolve on the server. */
	| 'mailbox-not-found'
	/** Transport level: DNS, TLS, timeout, connection refused. */
	| 'connection-failed'
	/** The host is not on the provider's allowlist. This is the air-gap invariant refusing a request. */
	| 'host-not-allowed'
	/** NTLM is unusable here: the workspace runs in FIPS mode, which forbids the algorithms it mandates. */
	| 'ntlm-unavailable'
	/** A configured host is not one of Microsoft's own endpoints, so no credential is sent to it. */
	| 'endpoint-not-recognized'
	/** Rate limited and out of retries. */
	| 'rate-limited'
	/** The server answered, but not in a shape we understand. */
	| 'unexpected-response';

export class ExchangeError extends Error {
	public readonly code: ExchangeErrorCode;

	public readonly detail?: string;

	constructor(code: ExchangeErrorCode, message: string, options?: { detail?: string }) {
		super(message);
		this.name = 'ExchangeError';
		this.code = code;
		this.detail = options?.detail === undefined ? undefined : scrubText(options.detail);
	}
}

export const isExchangeError = (err: unknown): err is ExchangeError => err instanceof ExchangeError;
