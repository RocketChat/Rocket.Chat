import type { ClientRequestArgs } from 'http';
import type { AgentOptions } from 'https';
import { Agent, request } from 'https';
import type { Duplex } from 'stream';
import type { TLSSocket } from 'tls';

import type { IEwsTransport } from './IEwsTransport';
import { ExchangeError } from '../errors';
import { logger } from '../logger';
import { computeChannelBindingHash } from '../ntlm/channelBinding';
import { createType1Message, createType3Message, decodeType2Message } from '../ntlm/messages';
import { scrubForLog } from '../scrub';

/**
 * A bespoke agent rather than `@rocket.chat/server-fetch`, for two structural reasons: the NTLM handshake
 * is three messages that must share one connection, and channel binding needs that connection's TLS
 * certificate. `fetch` guarantees neither and hides the socket.
 *
 * Owning the agent also makes this the natural home for the air-gap invariant, since connections are
 * established here.
 */

export type NtlmEwsTransportConfig = {
	/** Full EWS endpoint, for example `https://exchange.example.com/EWS/Exchange.asmx`. */
	url: string;
	username: string;
	password: string;
	authMethod: 'ntlm' | 'basic';
	/** PEM for a private certificate authority. An opt-in, never a blanket bypass. */
	caCert?: string;
	rejectUnauthorized?: boolean;
	workstation?: string;
};

const REQUEST_TIMEOUT_MS = 60000;

const splitDomainAndUser = (username: string): { domain: string; user: string } => {
	// `CORP\svc-rocketchat` is how administrators write it; Exchange expects the two parts separately.
	const backslash = username.indexOf('\\');
	if (backslash > 0) {
		return { domain: username.slice(0, backslash).toUpperCase(), user: username.slice(backslash + 1) };
	}

	return { domain: '', user: username };
};

/**
 * The air-gap invariant, enforced where connections are actually opened rather than where URLs are built.
 * Anything that reaches this agent for a different host is refused, including a future code path nobody
 * has written yet.
 */
export class AllowlistedAgent extends Agent {
	constructor(
		private readonly allowedHost: string,
		options: AgentOptions,
	) {
		super(options);
	}

	public override createConnection(options: ClientRequestArgs, callback?: (err: Error | null, stream: Duplex) => void): Duplex {
		if (options.host !== this.allowedHost) {
			throw new ExchangeError('host-not-allowed', 'Refusing to connect to a host other than the configured EWS endpoint', {
				detail: `attempted ${String(options.host)}, allowed ${this.allowedHost}`,
			});
		}

		return super.createConnection(options, callback) as Duplex;
	}
}

export class NtlmEwsTransport implements IEwsTransport {
	private readonly config: NtlmEwsTransportConfig;

	private readonly endpoint: URL;

	private readonly agent: Agent;

	/** Must be the certificate of the connection actually carrying the handshake, not a separate lookup. */
	private lastPeerCertificate: Buffer | undefined;

	constructor(config: NtlmEwsTransportConfig) {
		this.config = config;

		try {
			this.endpoint = new URL(config.url);
		} catch {
			throw new ExchangeError('not-configured', 'The EWS endpoint URL is not a valid URL', { detail: config.url });
		}

		if (this.endpoint.protocol !== 'https:') {
			// Channel binding is meaningless without TLS.
			throw new ExchangeError('not-configured', 'The EWS endpoint must use HTTPS');
		}

		this.agent = new AllowlistedAgent(this.endpoint.hostname, {
			// The three handshake messages have to share a connection.
			keepAlive: true,
			maxSockets: 1,
			...(config.caCert ? { ca: config.caCert } : {}),
			rejectUnauthorized: config.rejectUnauthorized !== false,
		});
	}

	/** A reused keep-alive socket is already secure; a fresh one has to wait for `secureConnect`. */
	private captureCertificateFrom(socket: TLSSocket): void {
		const read = (): void => {
			const certificate = socket.getPeerCertificate?.(false);
			if (certificate?.raw?.length) {
				this.lastPeerCertificate = certificate.raw;
			}
		};

		if (socket.encrypted) {
			read();
		}

		socket.once('secureConnect', read);
	}

	public async post(soapEnvelope: string): Promise<string> {
		if (this.config.authMethod === 'basic') {
			return this.postWithBasic(soapEnvelope);
		}

		return this.postWithNtlm(soapEnvelope);
	}

	private async postWithBasic(soapEnvelope: string): Promise<string> {
		const credentials = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');

		const response = await this.send(soapEnvelope, { Authorization: `Basic ${credentials}` });
		return this.readBody(response);
	}

	/** The first request is expected to be rejected with a challenge. That is the protocol, not a failure. */
	private async postWithNtlm(soapEnvelope: string): Promise<string> {
		const { domain, user } = splitDomainAndUser(this.config.username);
		const workstation = this.config.workstation ?? '';

		const negotiate = await this.send('', { Authorization: createType1Message(workstation, domain) }, 'GET');

		if (negotiate.status !== 401) {
			// No challenge means NTLM is not enabled on the virtual directory at all.
			throw new ExchangeError('authentication-failed', 'Exchange did not issue an NTLM challenge', {
				detail: `expected 401, received ${negotiate.status}. NTLM may not be enabled on the EWS virtual directory.`,
			});
		}

		const challengeHeader = negotiate.headers['www-authenticate'];
		if (!challengeHeader) {
			throw new ExchangeError('authentication-failed', 'Exchange did not return an NTLM challenge header');
		}

		const type2 = decodeType2Message(Array.isArray(challengeHeader) ? challengeHeader.join(', ') : challengeHeader);

		// Extended Protection rejects a response whose binding does not match this connection's certificate,
		// which is what stops a relay attack.
		const channelBindings = this.lastPeerCertificate ? computeChannelBindingHash(this.lastPeerCertificate) : undefined;

		if (!channelBindings) {
			logger.warn({
				msg: 'No peer certificate captured, sending NTLM without channel binding',
				detail: 'This will be rejected by a server with Extended Protection enabled',
			});
		}

		const authenticate = createType3Message(type2, user, this.config.password, workstation, domain || undefined, {
			...(channelBindings && { channelBindings }),
		});

		const response = await this.send(soapEnvelope, { Authorization: authenticate });

		if (response.status === 401) {
			throw new ExchangeError('authentication-failed', 'Exchange rejected the NTLM credentials', {
				detail: channelBindings
					? 'The service account credentials were not accepted.'
					: 'Sent without channel binding. If Extended Protection is enabled, this is the cause.',
			});
		}

		return this.readBody(response);
	}

	private async send(
		body: string,
		headers: Record<string, string>,
		method: 'GET' | 'POST' = 'POST',
	): Promise<{ status: number; headers: Record<string, string | string[] | undefined>; body: string }> {
		return new Promise((resolve, reject) => {
			const req = request(
				this.endpoint,
				{
					method,
					agent: this.agent,
					timeout: REQUEST_TIMEOUT_MS,
					headers: {
						'Content-Type': 'text/xml; charset=utf-8',
						'Connection': 'keep-alive',
						'Content-Length': Buffer.byteLength(body),
						...headers,
					},
				},
				(res) => {
					const chunks: Buffer[] = [];
					res.on('data', (chunk: Buffer) => chunks.push(chunk));
					res.on('end', () =>
						resolve({
							status: res.statusCode ?? 0,
							headers: res.headers,
							body: Buffer.concat(chunks).toString('utf8'),
						}),
					);
				},
			);

			req.on('socket', (socket) => this.captureCertificateFrom(socket as TLSSocket));

			req.on('timeout', () => {
				req.destroy();
				reject(new ExchangeError('connection-failed', 'The Exchange endpoint timed out'));
			});

			req.on('error', (err) => {
				logger.warn({ msg: 'EWS request failed', err: scrubForLog(err) });
				// No `cause`: a Node transport error carries request options, and those carry headers.
				reject(new ExchangeError('connection-failed', 'Could not reach the Exchange endpoint', { detail: err.message }));
			});

			req.end(body);
		});
	}

	private readBody(response: { status: number; body: string }): string {
		// SOAP faults arrive with HTTP 500, so 5xx bodies must reach the parser. Only statuses carrying no
		// useful body become errors here.
		if (response.status === 403) {
			throw new ExchangeError('authorization-failed', 'Exchange refused the request', { detail: response.body.slice(0, 300) });
		}

		if (response.status === 404) {
			throw new ExchangeError('connection-failed', 'The EWS endpoint was not found at the configured URL');
		}

		return response.body;
	}
}
