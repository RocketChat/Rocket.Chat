import { serverFetch } from '@rocket.chat/server-fetch';

import { logger } from '../logger';
import type { IVirtruPDPConfig, ITokenCache } from '../pdp/types';

const virtruClientLogger = logger.section('VirtruClient');

const HEALTH_CHECK_TIMEOUT = 5000;
const REQUEST_TIMEOUT = 10000;

export class VirtruClient {
	private tokenCache: ITokenCache | null = null;

	private config: IVirtruPDPConfig;

	constructor(config: IVirtruPDPConfig) {
		this.config = config;
	}

	updateConfig(config: IVirtruPDPConfig): void {
		this.config = config;
		this.tokenCache = null;
	}

	getConfig(): IVirtruPDPConfig {
		return this.config;
	}

	async isAvailable(): Promise<boolean> {
		try {
			const response = await serverFetch(`${this.config.baseUrl}/healthz`, {
				method: 'GET',
				timeout: HEALTH_CHECK_TIMEOUT,
				ignoreSsrfValidation: true,
			});

			if (!response.ok) {
				throw new Error('PDP Health check failed');
			}

			const data = (await response.json()) as { status?: string };

			virtruClientLogger.info({ msg: 'Virtru PDP health check response', data });
			return data.status === 'SERVING';
		} catch (err) {
			virtruClientLogger.warn({ msg: 'Virtru PDP is not reachable', err });
			return false;
		}
	}

	private async getClientToken(): Promise<string> {
		if (this.tokenCache && Date.now() < this.tokenCache.expiresAt) {
			return this.tokenCache.accessToken;
		}
		const response = await serverFetch(`${this.config.oidcEndpoint}/protocol/openid-connect/token`, {
			method: 'POST',
			timeout: REQUEST_TIMEOUT,
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				grant_type: 'client_credentials',
				client_id: this.config.clientId,
				client_secret: this.config.clientSecret,
			}),
			ignoreSsrfValidation: true,
		});

		if (!response.ok) {
			throw new Error(`Failed to obtain client token: ${response.status} ${response.statusText}`);
		}

		const data = (await response.json()) as { access_token: string; expires_in?: number };

		const expiresIn = data.expires_in ?? 300;
		this.tokenCache = {
			accessToken: data.access_token,
			expiresAt: Date.now() + (expiresIn - 30) * 1000,
		};

		return data.access_token;
	}

	resetToken(): void {
		this.tokenCache = null;
	}

	async apiCall<T>(endpoint: string, body: unknown): Promise<T> {
		const token = await this.getClientToken();

		const response = await serverFetch(`${this.config.baseUrl}${endpoint}`, {
			method: 'POST',
			timeout: REQUEST_TIMEOUT,
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`,
			},
			body: JSON.stringify(body),
			ignoreSsrfValidation: true,
		});

		if (!response.ok) {
			const text = await response.text().catch(() => '');
			virtruClientLogger.error({ msg: 'Virtru PDP API call failed', endpoint, status: response.status, response: text });
			throw new Error('Virtru PDP call failed');
		}

		return response.json() as Promise<T>;
	}
}
