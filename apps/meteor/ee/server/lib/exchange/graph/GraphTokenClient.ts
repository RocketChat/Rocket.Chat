import { ExchangeError } from '../errors';
import { fetchWithRetry } from '../http/fetchWithRetry';
import { logger } from '../logger';

export type GraphTokenClientConfig = {
	/** Entra ID tenant id or verified domain. */
	tenantId: string;
	clientId: string;
	clientSecret: string;
	/**
	 * A setting rather than a constant, so national cloud endpoints can be supported later without a code
	 * change. Defaults to the global cloud.
	 */
	authorityHost?: string;
	/** Defaults to `https://graph.microsoft.com`. Kept configurable for the same reason as `authorityHost`. */
	graphHost?: string;
};

type TokenCache = {
	accessToken: string;
	/** Absolute epoch milliseconds, already reduced by the safety margin. */
	expiresAt: number;
};

type TokenResponse = {
	access_token?: unknown;
	expires_in?: unknown;
	token_type?: unknown;
};

export const DEFAULT_AUTHORITY_HOST = 'https://login.microsoftonline.com';
export const DEFAULT_GRAPH_HOST = 'https://graph.microsoft.com';

/** Refresh this many seconds early so a token cannot expire midway through a request. */
const EXPIRY_SAFETY_MARGIN_SECONDS = 30;
/** Used only when the server omits `expires_in`, which it should never do. */
const FALLBACK_EXPIRES_IN_SECONDS = 300;
const TOKEN_REQUEST_TIMEOUT_MS = 10000;

const hostnameOf = (url: string): string => new URL(url).hostname;

export class GraphTokenClient {
	private tokenCache: TokenCache | null = null;

	private config: GraphTokenClientConfig;

	/** Serializes concurrent callers onto one in-flight request instead of stampeding the token endpoint. */
	private inFlight: Promise<string> | null = null;

	constructor(config: GraphTokenClientConfig) {
		this.config = config;
	}

	public updateConfig(config: GraphTokenClientConfig): void {
		this.config = config;
		this.invalidate();
	}

	public invalidate(): void {
		this.tokenCache = null;
		this.inFlight = null;
	}

	private get authorityHost(): string {
		return this.config.authorityHost ?? DEFAULT_AUTHORITY_HOST;
	}

	private get graphHost(): string {
		return this.config.graphHost ?? DEFAULT_GRAPH_HOST;
	}

	/**
	 * The only hosts this provider may ever contact. Passed to server-fetch as an explicit allowlist rather
	 * than disabling SSRF validation, which is how the air-gap invariant is enforced on the Graph side.
	 */
	public get allowList(): string[] {
		return [hostnameOf(this.authorityHost), hostnameOf(this.graphHost)];
	}

	public get tokenEndpoint(): string {
		return `${this.authorityHost.replace(/\/+$/, '')}/${encodeURIComponent(this.config.tenantId)}/oauth2/v2.0/token`;
	}

	/**
	 * For client credentials the scope is `<graphHost>/.default`, meaning "every application permission
	 * already granted to this app registration". Individual permission names belong to delegated flows.
	 */
	public get scope(): string {
		return `${this.graphHost.replace(/\/+$/, '')}/.default`;
	}

	public async getAccessToken(): Promise<string> {
		const cached = this.tokenCache;
		if (cached && Date.now() < cached.expiresAt) {
			return cached.accessToken;
		}

		if (this.inFlight) {
			return this.inFlight;
		}

		this.inFlight = this.requestToken().finally(() => {
			this.inFlight = null;
		});

		return this.inFlight;
	}

	private assertConfigured(): void {
		const { tenantId, clientId, clientSecret } = this.config;
		if (!tenantId || !clientId || !clientSecret) {
			throw new ExchangeError('not-configured', 'Microsoft Graph credentials are incomplete', {
				detail: 'tenantId, clientId and clientSecret are all required',
			});
		}
	}

	private async requestToken(): Promise<string> {
		this.assertConfigured();

		const body = new URLSearchParams();
		body.append('grant_type', 'client_credentials');
		body.append('client_id', this.config.clientId);
		body.append('client_secret', this.config.clientSecret);
		body.append('scope', this.scope);

		const response = await fetchWithRetry(this.tokenEndpoint, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body,
			timeout: TOKEN_REQUEST_TIMEOUT_MS,
			ignoreSsrfValidation: false,
			allowList: this.allowList,
		});

		if (!response.ok) {
			// The body carries `error` and `error_description`, which name the actual misconfiguration.
			// Worth surfacing, and it never contains the secret we sent.
			const detail = await response.text().catch(() => undefined);

			if (response.status === 400 || response.status === 401) {
				throw new ExchangeError('authentication-failed', 'Microsoft Graph rejected the credentials', {
					detail: detail?.slice(0, 500),
				});
			}

			throw new ExchangeError('unexpected-response', `Token endpoint returned ${response.status}`, {
				detail: detail?.slice(0, 500),
			});
		}

		const payload = (await response.json().catch(() => undefined)) as TokenResponse | undefined;

		if (!payload || typeof payload.access_token !== 'string' || !payload.access_token) {
			throw new ExchangeError('unexpected-response', 'Token endpoint response had no access_token');
		}

		const expiresIn = typeof payload.expires_in === 'number' && payload.expires_in > 0 ? payload.expires_in : FALLBACK_EXPIRES_IN_SECONDS;

		this.tokenCache = {
			accessToken: payload.access_token,
			expiresAt: Date.now() + Math.max(expiresIn - EXPIRY_SAFETY_MARGIN_SECONDS, 0) * 1000,
		};

		logger.debug({ msg: 'Acquired Microsoft Graph access token', expiresIn });

		return payload.access_token;
	}
}
