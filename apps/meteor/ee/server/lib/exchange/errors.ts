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
	/** Rate limited and out of retries. */
	| 'rate-limited'
	/** The server answered, but not in a shape we understand. */
	| 'unexpected-response';

export class ExchangeError extends Error {
	public readonly code: ExchangeErrorCode;

	/** Scrubbed on the way in, so it is always safe to log and to surface to an admin. */
	public readonly detail?: string;

	constructor(code: ExchangeErrorCode, message: string, options?: { detail?: string; cause?: unknown }) {
		super(message, options?.cause ? { cause: options.cause } : undefined);
		this.name = 'ExchangeError';
		this.code = code;
		this.detail = options?.detail === undefined ? undefined : scrubText(options.detail);
	}
}

export const isExchangeError = (err: unknown): err is ExchangeError => err instanceof ExchangeError;
