import type { CalendarSyncFetchFn } from '../../definition';
import { CalendarSyncError } from '../../definition';

export interface IGraphTokenManagerConfig {
	tenantId: string;
	clientId: string;
	clientSecret: string;
	/** e.g. https://login.microsoftonline.com — configurable for national clouds (P1) */
	loginHost: string;
	/** e.g. https://graph.microsoft.com — used as the token scope audience */
	graphHost: string;
}

/** Refresh this many ms before the token actually expires */
const EXPIRY_SAFETY_MARGIN_MS = 2 * 60 * 1000;

const AADSTS_ERROR_CODES: [RegExp, string][] = [
	[/AADSTS90002|AADSTS900023/, 'invalid-tenant'],
	[/AADSTS700016/, 'invalid-client'],
	[/AADSTS7000215|AADSTS7000222/, 'invalid-client-secret'],
	[/AADSTS500011|AADSTS65001/, 'consent-missing'],
];

/**
 * Acquires and caches OAuth 2.0 client-credentials tokens for Microsoft Graph.
 * Tokens live in memory only and are refreshed ahead of expiry; concurrent
 * callers share a single in-flight request.
 */
export class GraphTokenManager {
	private accessToken: string | null = null;

	private expiresAt = 0;

	private inflight: Promise<string> | null = null;

	constructor(
		private readonly config: IGraphTokenManagerConfig,
		private readonly fetchFn: CalendarSyncFetchFn,
	) {}

	public invalidate(): void {
		this.accessToken = null;
		this.expiresAt = 0;
	}

	public async getToken(): Promise<string> {
		if (this.accessToken && Date.now() < this.expiresAt - EXPIRY_SAFETY_MARGIN_MS) {
			return this.accessToken;
		}

		if (!this.inflight) {
			this.inflight = this.requestToken().finally(() => {
				this.inflight = null;
			});
		}

		return this.inflight;
	}

	private async requestToken(): Promise<string> {
		const { tenantId, clientId, clientSecret, loginHost, graphHost } = this.config;

		if (!tenantId || !clientId || !clientSecret) {
			throw new CalendarSyncError('missing-credentials', 'Microsoft Graph tenant id, client id and client secret must be configured');
		}

		const url = `${loginHost}/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`;
		const body = new URLSearchParams({
			grant_type: 'client_credentials',
			client_id: clientId,
			client_secret: clientSecret,
			scope: `${graphHost}/.default`,
		}).toString();

		let response;
		try {
			response = await this.fetchFn(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body,
			});
		} catch (error) {
			throw new CalendarSyncError('network-error', `Unable to reach the Microsoft identity platform: ${(error as Error).message}`);
		}

		const payload = await response.json().catch(() => ({}));

		if (!response.ok) {
			throw this.mapTokenError(response.status, payload);
		}

		if (typeof payload.access_token !== 'string' || typeof payload.expires_in !== 'number') {
			throw new CalendarSyncError('provider-error', 'Unexpected token response from the Microsoft identity platform');
		}

		this.accessToken = payload.access_token;
		this.expiresAt = Date.now() + payload.expires_in * 1000;

		return payload.access_token;
	}

	private mapTokenError(status: number, payload: { error?: string; error_description?: string }): CalendarSyncError {
		const description: string = payload.error_description || payload.error || `Token request failed with status ${status}`;

		const [, code] = AADSTS_ERROR_CODES.find(([pattern]) => pattern.test(description)) ?? [];
		if (code) {
			// AADSTS descriptions are safe (no secrets), but keep only the first line
			return new CalendarSyncError(code, description.split(/[\r\n]/)[0]);
		}

		return new CalendarSyncError(status === 429 ? 'throttled' : 'auth-failed', description.split(/[\r\n]/)[0]);
	}
}
