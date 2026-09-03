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

	private readonly endpoint: URL | undefined;

	private readonly agent: Agent | undefined;

	/** Serialises the NTLM sequences, never the bodies. */
	private ntlmTurn: Promise<void> = Promise.resolve();

	private readonly configError: ExchangeError | undefined;

	/** Must be the certificate of the connection actually carrying the handshake, not a separate lookup. */
	private lastPeerCertificate: Buffer | undefined;

	constructor(config: NtlmEwsTransportConfig) {
		this.config = config;

		try {
			this.endpoint = new URL(config.url);
		} catch {
			this.configError = new ExchangeError('not-configured', 'The EWS endpoint URL is not a valid URL', {
				detail: config.url || 'no URL is configured',
			});
			return;
		}

		if (this.endpoint.protocol !== 'https:') {
			this.configError = new ExchangeError('not-configured', 'The EWS endpoint must use HTTPS');
			return;
		}

		this.agent = new AllowlistedAgent(this.endpoint.hostname, {
			keepAlive: true,
			maxSockets: 1,
			...(config.caCert ? { ca: config.caCert } : {}),
			rejectUnauthorized: config.rejectUnauthorized !== false,
		});
	}

	/**
	 * The single point every request passes through, so a misconfigured transport reports itself as
	 * `not-configured` instead of failing further down as something less diagnosable.
	 */
	private assertConfigured(): { endpoint: URL; agent: Agent } {
		if (!this.endpoint || !this.agent) {
			throw this.configError ?? new ExchangeError('not-configured', 'The EWS transport is not configured');
		}

		return { endpoint: this.endpoint, agent: this.agent };
	}

	/** A reused keep-alive socket is already secure; a fresh one has to wait for `secureConnect`. */
	private captureCertificateFrom(socket: TLSSocket): void {
		const read = (): void => {
			const certificate = socket.getPeerCertificate?.(false);
			if (certificate?.raw?.length) {
				this.lastPeerCertificate = certificate.raw;
			}
		};

		if (socket.getProtocol?.()) {
			read();
			return;
		}

		socket.once('secureConnect', read);
	}

	public async post(soapEnvelope: string): Promise<string> {
		if (this.config.authMethod === 'basic') {
			return this.postWithBasic(soapEnvelope);
		}
		// NTLM authenticates the connection, not the request, and the agent holds a single socket. Two
		// handshakes interleaving on it means one of them answers the other's challenge, which Exchange
		// rejects as bad credentials. `maxSockets: 1` already serialised the requests, not the sequences.
		const result = this.ntlmTurn.then(
			() => this.postWithNtlm(soapEnvelope),
			() => this.postWithNtlm(soapEnvelope),
		);

		this.ntlmTurn = result.then(
			() => undefined,
			() => undefined,
		);

		return result;
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
		const { endpoint, agent } = this.assertConfigured();

		return new Promise((resolve, reject) => {
			const req = request(
				endpoint,
				{
					method,
					agent,
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

			req.on('socket', (socket: TLSSocket) => this.captureCertificateFrom(socket));

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
		// SOAP faults arrive with HTTP 500, so 5xx bodies must reach the parser.
		if (response.status === 403) {
			throw new ExchangeError('authorization-failed', 'Exchange refused the request', { detail: response.body.slice(0, 300) });
		}

		if (response.status === 404) {
			throw new ExchangeError('connection-failed', 'The EWS endpoint was not found at the configured URL');
		}

		return response.body;
	}
}
