import http from 'http';
import https from 'https';
import { URL } from 'url';

import { createType1Message, createType3Message, parseNtlmUsername, parseType2Message } from './ntlm';
import { CalendarSyncError } from '../../definition';

export interface IEwsHttpResponse {
	statusCode: number;
	headers: Record<string, string | string[] | undefined>;
	body: string;
}

export interface IEwsRequestOptions {
	url: string;
	headers: Record<string, string>;
	body: string;
	agent: http.Agent | https.Agent;
	timeoutMs: number;
}

export type EwsRequestFn = (options: IEwsRequestOptions) => Promise<IEwsHttpResponse>;

export interface IEwsHttpConfig {
	url: string;
	username: string;
	password: string;
	authMethod: 'ntlm' | 'basic';
	timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Default transport on top of node:http(s).request. serverFetch is not used here:
 * NTLM authenticates the TCP connection (not the request), so the whole handshake
 * must be pinned to a single kept-alive socket, which requires owning the Agent.
 */
export const nodeRequest: EwsRequestFn = ({ url, headers, body, agent, timeoutMs }) =>
	new Promise((resolve, reject) => {
		const parsed = new URL(url);
		const transport = parsed.protocol === 'https:' ? https : http;

		const request = transport.request(
			{
				hostname: parsed.hostname,
				port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
				path: `${parsed.pathname}${parsed.search}`,
				method: 'POST',
				headers: { ...headers, 'Content-Length': Buffer.byteLength(body) },
				agent,
				timeout: timeoutMs,
			},
			(response) => {
				const chunks: Buffer[] = [];
				response.on('data', (chunk: Buffer) => chunks.push(chunk));
				response.on('end', () =>
					resolve({
						statusCode: response.statusCode ?? 0,
						headers: response.headers,
						body: Buffer.concat(chunks).toString('utf8'),
					}),
				);
				response.on('error', reject);
			},
		);

		request.on('timeout', () => {
			request.destroy(new Error(`Request to the EWS endpoint timed out after ${timeoutMs}ms`));
		});
		request.on('error', reject);
		request.end(body);
	});

/**
 * POSTs SOAP payloads to the admin-configured EWS endpoint using Basic or NTLM
 * (NTLMv2) service-account authentication. This client only ever contacts the
 * configured endpoint — it holds no other hostname.
 */
export class EwsHttpClient {
	private readonly agent: http.Agent | https.Agent;

	private readonly timeoutMs: number;

	/** NTLM handshakes must not interleave on the shared socket */
	private queue: Promise<unknown> = Promise.resolve();

	constructor(
		private readonly config: IEwsHttpConfig,
		private readonly requestFn: EwsRequestFn = nodeRequest,
	) {
		const isHttps = new URL(config.url).protocol === 'https:';
		this.agent = isHttps
			? new https.Agent({
					keepAlive: true,
					maxSockets: 1,
				})
			: new http.Agent({ keepAlive: true, maxSockets: 1 });
		this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
	}

	public async post(soapXml: string): Promise<IEwsHttpResponse> {
		const run = this.queue.then(() => this.doPost(soapXml));
		// Keep the chain alive even when a request fails
		this.queue = run.catch(() => undefined);
		return run;
	}

	public destroy(): void {
		this.agent.destroy();
	}

	private baseHeaders(): Record<string, string> {
		return {
			'Content-Type': 'text/xml; charset=utf-8',
			'Accept': 'text/xml',
			'Connection': 'keep-alive',
		};
	}

	private async doPost(soapXml: string): Promise<IEwsHttpResponse> {
		try {
			if (this.config.authMethod === 'basic') {
				return await this.requestFn({
					url: this.config.url,
					headers: {
						...this.baseHeaders(),
						Authorization: `Basic ${Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64')}`,
					},
					body: soapXml,
					agent: this.agent,
					timeoutMs: this.timeoutMs,
				});
			}

			return await this.doNtlmPost(soapXml);
		} catch (error) {
			if (error instanceof CalendarSyncError) {
				throw error;
			}
			throw new CalendarSyncError('network-error', `Unable to reach the EWS endpoint: ${(error as Error).message}`);
		}
	}

	private async doNtlmPost(soapXml: string): Promise<IEwsHttpResponse> {
		const { username, domain } = parseNtlmUsername(this.config.username);

		const negotiate = await this.requestFn({
			url: this.config.url,
			headers: { ...this.baseHeaders(), Authorization: createType1Message() },
			body: '',
			agent: this.agent,
			timeoutMs: this.timeoutMs,
		});

		if (negotiate.statusCode !== 401) {
			// Endpoint did not challenge us — some proxies/pre-auth setups respond directly
			if (negotiate.statusCode >= 200 && negotiate.statusCode < 300) {
				throw new CalendarSyncError('provider-error', 'The EWS endpoint accepted an unauthenticated request; verify the endpoint URL');
			}
			throw new CalendarSyncError('auth-failed', `Expected an NTLM challenge but received HTTP ${negotiate.statusCode}`);
		}

		const authenticateHeader = negotiate.headers['www-authenticate'];
		const headerValue = Array.isArray(authenticateHeader) ? authenticateHeader.join(', ') : (authenticateHeader ?? '');
		if (!headerValue.includes('NTLM')) {
			throw new CalendarSyncError('auth-failed', 'The EWS endpoint does not offer NTLM authentication');
		}

		let challenge;
		try {
			challenge = parseType2Message(headerValue);
		} catch (error) {
			throw new CalendarSyncError('auth-failed', (error as Error).message);
		}

		return this.requestFn({
			url: this.config.url,
			headers: {
				...this.baseHeaders(),
				Authorization: createType3Message(challenge, {
					username,
					password: this.config.password,
					domain,
					workstation: 'ROCKETCHAT',
				}),
			},
			body: soapXml,
			agent: this.agent,
			timeoutMs: this.timeoutMs,
		});
	}
}
