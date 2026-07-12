import { createHash, randomUUID, sign, X509Certificate } from 'node:crypto';

import { getGraphDefaultScope, getTenantTokenEndpoint } from './clouds';
import { EnterpriseCalendarError, sanitizeGraphError } from './errors';
import type { GraphProviderConfiguration, HttpClient } from './types';

type CachedToken = { value: string; expiresAt: number };

const encode = (value: unknown): string => Buffer.from(JSON.stringify(value)).toString('base64url');

export class GraphTokenProvider {
	private cached?: CachedToken;

	private pending?: Promise<string>;

	constructor(
		private readonly configuration: GraphProviderConfiguration,
		private readonly http: HttpClient,
		private readonly now: () => number = Date.now,
	) {}

	async getToken(): Promise<string> {
		if (this.cached && this.cached.expiresAt - 5 * 60_000 > this.now()) return this.cached.value;
		if (this.pending) return this.pending;
		this.pending = this.acquire();
		try {
			return await this.pending;
		} finally {
			this.pending = undefined;
		}
	}

	clear(): void {
		this.cached = undefined;
	}

	private async acquire(): Promise<string> {
		const endpoint = getTenantTokenEndpoint(this.configuration.cloud, this.configuration.tenantId);
		const body = new URLSearchParams({
			client_id: this.configuration.clientId,
			scope: getGraphDefaultScope(this.configuration.cloud),
			grant_type: 'client_credentials',
		});

		if (this.configuration.credential.type === 'client-secret') {
			body.set('client_secret', this.configuration.credential.clientSecret);
		} else {
			body.set('client_assertion_type', 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer');
			body.set('client_assertion', this.createClientAssertion(endpoint));
		}

		const response = await this.http(endpoint, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: body.toString(),
			timeoutMs: this.configuration.requestTimeoutMs,
		});
		const text = await response.text();
		if (Buffer.byteLength(text) > 1024 * 1024) {
			throw new EnterpriseCalendarError('invalid-response', false, 'Microsoft identity response exceeded the size limit');
		}
		let payload: { access_token?: string; expires_in?: number; error?: string };
		try {
			payload = JSON.parse(text);
		} catch {
			throw new EnterpriseCalendarError('invalid-response', false, 'Microsoft identity returned an invalid response');
		}
		if (response.status < 200 || response.status >= 300 || !payload.access_token || !payload.expires_in) {
			throw sanitizeGraphError(response.status, payload.error);
		}

		this.cached = { value: payload.access_token, expiresAt: this.now() + payload.expires_in * 1_000 };
		return this.cached.value;
	}

	private createClientAssertion(audience: string): string {
		const { credential } = this.configuration;
		if (credential.type !== 'certificate') throw new Error('certificate-credential-required');
		const certificate = new X509Certificate(credential.certificate);
		const x5t = createHash('sha1').update(certificate.raw).digest('base64url');
		const nowSeconds = Math.floor(this.now() / 1_000);
		const header = encode({ alg: 'RS256', typ: 'JWT', x5t });
		const claims = encode({
			aud: audience,
			iss: this.configuration.clientId,
			sub: this.configuration.clientId,
			jti: randomUUID(),
			nbf: nowSeconds - 60,
			exp: nowSeconds + 5 * 60,
		});
		const signingInput = `${header}.${claims}`;
		const signature = sign('RSA-SHA256', Buffer.from(signingInput), credential.privateKey).toString('base64url');
		return `${signingInput}.${signature}`;
	}
}
