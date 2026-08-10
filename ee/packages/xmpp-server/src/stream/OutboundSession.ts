import net from 'node:net';

import type Element from 'ltx/lib/Element';

import type { ResolvedXMPPServerConfig } from '../config';
import { ConnectionFailedError } from '../errors';
import type { Logger } from '../logger';
import { XmppStream } from './XmppStream';
import type { DialbackVerdict } from '../s2s/dialback';
import { generateDialbackKey } from '../s2s/dialback';
import type { XmppDnsResolver } from '../s2s/dnsResolver';
import { xml } from '../xml/build';
import { NS_DIALBACK, NS_SASL, NS_STREAMS, NS_TLS } from '../xml/namespaces';
import { resolveElement } from '../xml/resolve';

const NEGOTIATION_STEP_TIMEOUT_MS = 30000;

export type OutboundSessionOptions = {
	config: ResolvedXMPPServerConfig;
	logger: Logger;
	/** Normalized local origin domain — the server domain or the MUC service domain. */
	localDomain: string;
	/** Normalized remote domain. */
	targetDomain: string;
	resolver: XmppDnsResolver;
	/** Answers db:verify requests a peer may send over this stream. */
	answerDialbackVerify?: (req: {
		receivingDomain: string;
		originatingDomain: string;
		streamId: string;
		key: string;
	}) => 'valid' | 'invalid';
	onClosed?: (error?: Error) => void;
};

type Waiter = {
	predicate: (stanza: Element, resolved: { localName: string; ns: string | undefined }) => boolean;
	resolve: (stanza: Element) => void;
	reject: (error: Error) => void;
	timer: NodeJS.Timeout;
};

/**
 * Originating-server side of one outbound S2S connection: SRV resolution,
 * STARTTLS, then SASL EXTERNAL or dialback. `authMethod` is set once ready.
 */
export class OutboundSession {
	authMethod: 'dialback' | 'sasl-external' | undefined;

	private stream: XmppStream | undefined;

	private streamHeader: Element | undefined;

	private currentStreamId: string | undefined;

	private readonly waiters = new Set<Waiter>();

	/** Negotiation stanzas that arrived before a waiter was registered (same-segment race). */
	private readonly pending: Element[] = [];

	private headerWaiters: Array<{ resolve: (header: Element) => void; reject: (error: Error) => void; timer: NodeJS.Timeout }> = [];

	private closed = false;

	private closedError: Error | undefined;

	private readonly logger: Logger;

	constructor(private readonly options: OutboundSessionOptions) {
		this.logger = options.logger.child({ direction: 'outbound', domain: options.targetDomain });
	}

	get isReady(): boolean {
		return this.authMethod !== undefined && !this.closed;
	}

	get isSecure(): boolean {
		return this.stream?.isSecure ?? false;
	}

	send(el: Element): void {
		if (!this.stream) {
			throw new ConnectionFailedError(this.options.targetDomain);
		}
		this.stream.send(el);
	}

	async close(): Promise<void> {
		await this.stream?.close();
		this.markClosed();
	}

	destroy(): void {
		this.stream?.destroy();
		this.markClosed();
	}

	/** Full connection establishment for stanza traffic; resolves once authenticated. */
	async connect(): Promise<void> {
		const { config } = this.options;
		const features = await this.establishStream();

		if (config.saslExternalEnabled && config.tls && this.stream?.isSecure && this.offersSaslExternal(features)) {
			try {
				await this.authenticateSaslExternal();
				this.authMethod = 'sasl-external';
				return;
			} catch (error) {
				this.logger.debug({ err: error }, 'SASL EXTERNAL failed, falling back to dialback');
			}
		}

		if (!config.dialbackEnabled) {
			throw new ConnectionFailedError(this.options.targetDomain, new Error('No usable authentication mechanism'));
		}

		await this.authenticateDialback();
		this.authMethod = 'dialback';
	}

	/**
	 * One-shot verify-mode connection (receiving-server side of dialback):
	 * establishes a stream to the claimed authoritative server, sends db:verify
	 * and resolves with the verdict.
	 */
	async verifyDialback(req: { originatingStreamId: string; key: string }): Promise<DialbackVerdict> {
		try {
			await this.establishStream();

			this.send(xml('db:verify', { from: this.options.localDomain, to: this.options.targetDomain, id: req.originatingStreamId }, req.key));

			const answer = await this.waitForStanza(
				(stanza, { localName, ns }) =>
					ns === NS_DIALBACK && localName === 'verify' && !!stanza.attrs.type && stanza.attrs.id === req.originatingStreamId,
			);

			return answer.attrs.type === 'valid' || answer.attrs.type === 'invalid' ? answer.attrs.type : 'error';
		} catch (error) {
			this.logger.debug({ err: error }, 'Dialback verify connection failed');
			return 'error';
		} finally {
			await this.close();
		}
	}

	/** Connects the socket, opens the stream and negotiates STARTTLS. Returns the final stream features. */
	private async establishStream(): Promise<Element> {
		const { config } = this.options;

		const socket = await this.connectSocket();
		this.stream = new XmppStream(socket, { maxStanzaSize: config.maxStanzaSize, logger: this.logger });
		this.stream.on('streamStart', (header) => {
			this.streamHeader = header;
			this.currentStreamId = header.attrs.id;
			const waiters = this.headerWaiters;
			this.headerWaiters = [];
			for (const waiter of waiters) {
				clearTimeout(waiter.timer);
				waiter.resolve(header);
			}
		});
		this.stream.on('stanza', (stanza) => this.dispatchStanza(stanza));
		this.stream.on('closed', ({ error }) => this.markClosed(error));

		this.stream.openStream({ from: this.options.localDomain, to: this.options.targetDomain });
		await this.waitForStreamStart();
		let features = await this.waitForFeatures();

		const starttls = features.getChild('starttls', NS_TLS);
		if (starttls && config.tls) {
			this.send(xml('starttls', { xmlns: NS_TLS }));
			await this.waitForStanza((_stanza, { localName, ns }) => ns === NS_TLS && (localName === 'proceed' || localName === 'failure')).then(
				(answer) => {
					if (answer.name.endsWith('failure')) {
						throw new ConnectionFailedError(this.options.targetDomain, new Error('Peer refused STARTTLS'));
					}
				},
			);

			await this.stream.upgradeToTls({
				isServer: false,
				servername: this.options.targetDomain,
				cert: config.tls.cert,
				key: config.tls.key,
				ca: config.tls.ca,
			});
			this.stream.restart();
			this.pending.length = 0;
			this.stream.openStream({ from: this.options.localDomain, to: this.options.targetDomain });
			await this.waitForStreamStart();
			features = await this.waitForFeatures();
		} else if (config.requireTls) {
			throw new ConnectionFailedError(this.options.targetDomain, new Error('Peer does not offer STARTTLS'));
		}

		return features;
	}

	private async connectSocket(): Promise<net.Socket> {
		const { config } = this.options;
		const addresses = await this.options.resolver(this.options.targetDomain);

		let lastError: Error | undefined;
		for (const address of addresses) {
			try {
				return await new Promise<net.Socket>((resolve, reject) => {
					const socket = net.connect({ host: address.host, port: address.port });
					const timer = setTimeout(() => {
						socket.destroy();
						reject(new Error(`Connection timeout to ${address.host}:${address.port}`));
					}, config.connectTimeoutMs);

					socket.once('connect', () => {
						clearTimeout(timer);
						socket.removeAllListeners('error');
						resolve(socket);
					});
					socket.once('error', (error: Error) => {
						clearTimeout(timer);
						reject(error);
					});
				});
			} catch (error) {
				lastError = error instanceof Error ? error : new Error(String(error));
				this.logger.debug({ err: lastError, host: address.host, port: address.port }, 'Address attempt failed');
			}
		}

		throw new ConnectionFailedError(this.options.targetDomain, lastError);
	}

	private offersSaslExternal(features: Element): boolean {
		const mechanisms = features.getChild('mechanisms', NS_SASL);
		return mechanisms?.getChildren('mechanism').some((m) => m.getText().trim() === 'EXTERNAL') ?? false;
	}

	private async authenticateSaslExternal(): Promise<void> {
		this.send(xml('auth', { xmlns: NS_SASL, mechanism: 'EXTERNAL' }, Buffer.from(this.options.localDomain, 'utf8').toString('base64')));

		const answer = await this.waitForStanza(
			(_stanza, { localName, ns }) => ns === NS_SASL && (localName === 'success' || localName === 'failure'),
		);
		if (answer.name.endsWith('failure')) {
			throw new Error('SASL EXTERNAL rejected');
		}

		if (!this.stream) {
			throw new ConnectionFailedError(this.options.targetDomain);
		}
		this.stream.restart();
		this.pending.length = 0;
		this.stream.openStream({ from: this.options.localDomain, to: this.options.targetDomain });
		await this.waitForStreamStart();
		await this.waitForFeatures();
	}

	private async authenticateDialback(): Promise<void> {
		const { config } = this.options;
		const streamId = this.currentStreamId;
		if (!streamId) {
			throw new ConnectionFailedError(this.options.targetDomain, new Error('Peer sent no stream id, dialback is impossible'));
		}

		const key = generateDialbackKey(config.dialbackSecret, this.options.targetDomain, this.options.localDomain, streamId);
		this.send(xml('db:result', { from: this.options.localDomain, to: this.options.targetDomain }, key));

		const answer = await this.waitForStanza(
			(stanza, { localName, ns }) => ns === NS_DIALBACK && localName === 'result' && !!stanza.attrs.type,
		);

		if (answer.attrs.type !== 'valid') {
			throw new ConnectionFailedError(this.options.targetDomain, new Error(`Dialback rejected: ${answer.attrs.type}`));
		}
	}

	private dispatchStanza(stanza: Element): void {
		const resolved = resolveElement(stanza, this.streamHeader);

		for (const waiter of this.waiters) {
			if (waiter.predicate(stanza, resolved)) {
				this.waiters.delete(waiter);
				clearTimeout(waiter.timer);
				waiter.resolve(stanza);
				return;
			}
		}

		// A peer may use this stream to verify keys we issued (authoritative role)
		if (resolved.ns === NS_DIALBACK && resolved.localName === 'verify' && !stanza.attrs.type && this.options.answerDialbackVerify) {
			const { from, to, id } = stanza.attrs;
			const key = stanza.getText().trim();
			if (from && to && id && key) {
				const verdict = this.options.answerDialbackVerify({ receivingDomain: from, originatingDomain: to, streamId: id, key });
				this.send(xml('db:verify', { from: to, to: from, id, type: verdict }));
			}
			return;
		}

		// Negotiation stanzas can arrive in the same TCP segment as the stream header,
		// before the next waiter is registered — buffer them for the upcoming waitForStanza.
		if (resolved.ns === NS_STREAMS || resolved.ns === NS_TLS || resolved.ns === NS_SASL || resolved.ns === NS_DIALBACK) {
			this.pending.push(stanza);
			return;
		}

		this.logger.debug({ name: stanza.name }, 'Ignoring unexpected element on outbound stream');
	}

	private waitForStreamStart(): Promise<Element> {
		return new Promise<Element>((resolve, reject) => {
			if (this.closed) {
				return reject(this.closedError ?? new ConnectionFailedError(this.options.targetDomain));
			}
			const timer = setTimeout(() => {
				this.headerWaiters = this.headerWaiters.filter((w) => w.timer !== timer);
				reject(new Error('Timed out waiting for stream header'));
			}, NEGOTIATION_STEP_TIMEOUT_MS);
			this.headerWaiters.push({ resolve, reject, timer });
		});
	}

	private waitForFeatures(): Promise<Element> {
		return this.waitForStanza((_stanza, { localName, ns }) => ns === NS_STREAMS && localName === 'features');
	}

	private waitForStanza(predicate: Waiter['predicate']): Promise<Element> {
		return new Promise<Element>((resolve, reject) => {
			if (this.closed) {
				return reject(this.closedError ?? new ConnectionFailedError(this.options.targetDomain));
			}

			// Serve from the buffer first, in case the stanza raced ahead of this waiter
			const bufferedIndex = this.pending.findIndex((stanza) => predicate(stanza, resolveElement(stanza, this.streamHeader)));
			if (bufferedIndex !== -1) {
				const [stanza] = this.pending.splice(bufferedIndex, 1);
				return resolve(stanza);
			}

			const waiter: Waiter = {
				predicate,
				resolve,
				reject,
				timer: setTimeout(() => {
					this.waiters.delete(waiter);
					reject(new Error('Timed out waiting for peer response'));
				}, NEGOTIATION_STEP_TIMEOUT_MS),
			};
			this.waiters.add(waiter);
		});
	}

	private markClosed(error?: Error): void {
		if (this.closed) {
			return;
		}
		this.closed = true;
		this.closedError = error;
		this.authMethod = undefined;

		const failure = error ?? new ConnectionFailedError(this.options.targetDomain, new Error('Stream closed'));
		for (const waiter of this.waiters) {
			clearTimeout(waiter.timer);
			waiter.reject(failure);
		}
		this.waiters.clear();
		for (const waiter of this.headerWaiters) {
			clearTimeout(waiter.timer);
			waiter.reject(failure);
		}
		this.headerWaiters = [];

		this.options.onClosed?.(error);
	}
}
