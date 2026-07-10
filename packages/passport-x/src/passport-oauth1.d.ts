declare module 'passport-oauth1' {
	import type { Request } from 'express';

	class OAuthStrategy {
		name: string;

		_oauth: OAuthStrategy.OAuthClient;

		constructor(options: Record<string, unknown>, verify: (...args: unknown[]) => void);

		authenticate(req: Request, options?: Record<string, unknown>): void;

		fail(challenge?: unknown, status?: number): void;

		error(err: Error): void;

		success(user: unknown, info?: unknown): void;

		redirect(url: string, status?: number): void;
	}

	// Merged namespace so the CommonJS `module.exports = Strategy` default and the
	// `exports.InternalOAuthError` named export coexist under a single `export =`.
	// TS7 rejects mixing `export =` with `export { ... }`.
	namespace OAuthStrategy {
		interface OAuthGetCallback {
			(err: OAuthError | null, body?: string, res?: { headers: Record<string, string> }): void;
		}

		interface OAuthError {
			statusCode?: number;
			data?: string;
		}

		interface OAuthClient {
			get(url: string, token: string, tokenSecret: string, callback: OAuthGetCallback): void;
		}

		class InternalOAuthError extends Error {
			constructor(message: string, err: unknown);
		}
	}

	export = OAuthStrategy;
}
