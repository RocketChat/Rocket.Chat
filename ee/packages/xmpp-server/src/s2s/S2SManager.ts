import net from 'node:net';

import type { Emitter } from '@rocket.chat/emitter';
import type Element from 'ltx/lib/Element';

import type { ResolvedXMPPServerConfig } from '../config';
import { ConnectionFailedError, DomainNotAllowedError, InvalidJidError, QueueOverflowError } from '../errors';
import type { ConnectionStatus, XMPPServerEventMap } from '../events';
import { Backoff } from './backoff';
import type { DialbackVerdict } from './dialback';
import { verifyDialbackKey } from './dialback';
import type { XmppDnsResolver } from './dnsResolver';
import { isDomainAllowed, normalizeDomain } from '../jid/normalize';
import type { Logger } from '../logger';
import { InboundSession } from '../stream/InboundSession';
import { OutboundSession } from '../stream/OutboundSession';

const MAX_CONSECUTIVE_FAILURES = 3;
const IDLE_REAP_INTERVAL_MS = 60000;

type QueuedStanza = { el: Element; resolve: () => void; reject: (error: Error) => void };

type DomainRoute = {
	/** Local origin domain of this route — dialback authenticates (origin, target) pairs. */
	localDomain: string;
	targetDomain: string;
	session?: OutboundSession;
	connecting: boolean;
	queue: QueuedStanza[];
	backoff: Backoff;
	reconnectTimer?: NodeJS.Timeout;
	lastActivity: number;
	status: ConnectionStatus;
};

export type S2SManagerDeps = {
	config: ResolvedXMPPServerConfig;
	logger: Logger;
	resolver: XmppDnsResolver;
	events: Emitter<XMPPServerEventMap>;
	/** Delivery target for authenticated inbound stanzas (wired to the router). */
	onStanza: (stanza: Element, meta: { authenticatedFromDomains: Set<string> }) => void;
};

/**
 * The S2S hub: owns the TCP listener, the per-domain outbound routes
 * (connection reuse, bounded queueing, backoff) and both sides of dialback.
 */
export class S2SManager {
	private server: net.Server | undefined;

	private readonly inboundSessions = new Set<InboundSession>();

	private readonly routes = new Map<string, DomainRoute>();

	private reapTimer: NodeJS.Timeout | undefined;

	private stopped = true;

	private readonly logger: Logger;

	constructor(private readonly deps: S2SManagerDeps) {
		this.logger = deps.logger.child({ component: 's2s' });
	}

	async startListener(): Promise<void> {
		const { config } = this.deps;
		this.stopped = false;

		await new Promise<void>((resolve, reject) => {
			const server = net.createServer((socket) => this.acceptInbound(socket));
			server.once('error', reject);
			server.listen(config.port, config.bindAddress, () => {
				server.removeListener('error', reject);
				server.on('error', (error: Error) => {
					this.deps.events.emit('error', { scope: 'internal', error });
				});
				this.server = server;
				resolve();
			});
		});

		this.reapTimer = setInterval(() => this.reapIdleRoutes(), IDLE_REAP_INTERVAL_MS);
		this.reapTimer.unref();
	}

	/** The actual bound port — differs from the configured one when it is 0 (ephemeral). */
	get listeningPort(): number | undefined {
		const address = this.server?.address();
		return typeof address === 'object' && address ? address.port : undefined;
	}

	async stopAll(): Promise<void> {
		this.stopped = true;

		if (this.reapTimer) {
			clearInterval(this.reapTimer);
			this.reapTimer = undefined;
		}

		const listenerClosed = this.server
			? new Promise<void>((resolve) => {
					this.server?.close(() => resolve());
				})
			: Promise.resolve();
		this.server = undefined;

		for (const route of this.routes.values()) {
			if (route.reconnectTimer) {
				clearTimeout(route.reconnectTimer);
			}
			for (const queued of route.queue) {
				queued.reject(new ConnectionFailedError('*', new Error('Server stopping')));
			}
			route.queue = [];
			route.session?.destroy();
		}
		this.routes.clear();

		await Promise.all([...this.inboundSessions].map((session) => session.close()));
		this.inboundSessions.clear();

		await listenerClosed;
	}

	getConnectionStatus(domain: string): ConnectionStatus {
		try {
			const target = normalizeDomain(domain);
			const statuses = [...this.routes.values()].filter((route) => route.targetDomain === target).map((route) => route.status);
			if (statuses.includes('connected')) {
				return 'connected';
			}
			if (statuses.includes('connecting')) {
				return 'connecting';
			}
			if (statuses.includes('failed')) {
				return 'failed';
			}
			return 'disconnected';
		} catch {
			return 'disconnected';
		}
	}

	/** Routes a stanza to the remote domain in its `to` attribute, connecting on demand. */
	async sendStanza(el: Element): Promise<void> {
		const { to, from } = el.attrs;
		if (!to || !from) {
			throw new InvalidJidError('(missing to/from attribute)');
		}

		const domain = normalizeDomain(to.split('/')[0].split('@').pop() as string);
		const localDomain = normalizeDomain(from.split('/')[0].split('@').pop() as string);
		const { config } = this.deps;

		if (domain === config.domain || domain === config.mucDomain) {
			throw new InvalidJidError(`Stanza addressed to the local domain: ${to}`);
		}

		if (localDomain !== config.domain && localDomain !== config.mucDomain) {
			throw new InvalidJidError(`Stanza not originated by the local domain: ${from}`);
		}

		if (!isDomainAllowed(domain, config.allowedDomains, config.deniedDomains)) {
			throw new DomainNotAllowedError(domain);
		}

		const route = this.getRoute(localDomain, domain);
		route.lastActivity = Date.now();

		if (route.session?.isReady) {
			route.session.send(el);
			return;
		}

		if (route.queue.length >= config.outboundQueueLimit) {
			const dropped = route.queue.shift();
			dropped?.reject(new QueueOverflowError(domain));
			this.deps.events.emit('error', { scope: 'internal', domain, error: new QueueOverflowError(domain) });
		}

		const queued = new Promise<void>((resolve, reject) => {
			route.queue.push({ el, resolve, reject });
		});

		this.ensureConnection(route);
		return queued;
	}

	private getRoute(localDomain: string, targetDomain: string): DomainRoute {
		const key = `${localDomain} ${targetDomain}`;
		let route = this.routes.get(key);
		if (!route) {
			route = {
				localDomain,
				targetDomain,
				connecting: false,
				queue: [],
				backoff: new Backoff(),
				lastActivity: Date.now(),
				status: 'disconnected',
			};
			this.routes.set(key, route);
		}
		return route;
	}

	private ensureConnection(route: DomainRoute): void {
		if (this.stopped || route.connecting || route.session?.isReady || route.reconnectTimer) {
			return;
		}

		const domain = route.targetDomain;
		route.connecting = true;
		route.status = 'connecting';

		const session = new OutboundSession({
			config: this.deps.config,
			logger: this.logger,
			localDomain: route.localDomain,
			targetDomain: domain,
			resolver: this.deps.resolver,
			answerDialbackVerify: (req) => this.answerDialbackVerify(req),
			onClosed: (error) => {
				if (route.session !== session) {
					return;
				}
				route.session = undefined;
				if (route.status === 'connected') {
					route.status = 'disconnected';
					this.deps.events.emit('connection.lost', { domain, direction: 'outbound', error });
				}
				if (route.queue.length > 0) {
					this.scheduleReconnect(route);
				}
			},
		});

		session
			.connect()
			.then(() => {
				route.connecting = false;
				route.session = session;
				route.status = 'connected';
				route.backoff.reset();
				this.deps.events.emit('connection.established', {
					domain,
					direction: 'outbound',
					tls: session.isSecure,
					authMethod: session.authMethod ?? 'dialback',
				});
				this.flushQueue(route);
			})
			.catch((error: Error) => {
				route.connecting = false;
				session.destroy();
				this.logger.warn({ err: error, domain }, 'Outbound connection failed');
				this.scheduleReconnect(route, error);
			});
	}

	private scheduleReconnect(route: DomainRoute, error?: Error): void {
		if (this.stopped || route.reconnectTimer) {
			return;
		}

		const domain = route.targetDomain;
		if (route.backoff.attemptCount >= MAX_CONSECUTIVE_FAILURES) {
			route.status = 'failed';
			const failure = error ?? new ConnectionFailedError(domain);
			this.deps.events.emit('connection.failed', { domain, attempts: route.backoff.attemptCount, error: failure });
			for (const queued of route.queue) {
				queued.reject(failure);
			}
			route.queue = [];
			route.backoff.reset();
			return;
		}

		const delay = route.backoff.nextDelayMs();
		route.status = 'connecting';
		route.reconnectTimer = setTimeout(() => {
			route.reconnectTimer = undefined;
			if (route.queue.length > 0) {
				this.ensureConnection(route);
			} else {
				route.status = 'disconnected';
			}
		}, delay);
		route.reconnectTimer.unref();
	}

	private flushQueue(route: DomainRoute): void {
		const { session } = route;
		if (!session?.isReady) {
			return;
		}

		const { queue } = route;
		route.queue = [];
		for (const queued of queue) {
			try {
				session.send(queued.el);
				queued.resolve();
			} catch (error) {
				queued.reject(error instanceof Error ? error : new ConnectionFailedError(route.targetDomain));
			}
		}
		route.lastActivity = Date.now();
	}

	private acceptInbound(socket: net.Socket): void {
		const session = new InboundSession(socket, {
			config: this.deps.config,
			logger: this.logger,
			requestDialbackVerification: (req) => this.requestDialbackVerification(req),
			answerDialbackVerify: (req) => this.answerDialbackVerify(req),
			onDomainAuthenticated: (inbound, domain, authMethod) => {
				this.deps.events.emit('connection.established', { domain, direction: 'inbound', tls: inbound.isSecure, authMethod });
			},
			onStanza: (stanza, inbound) => {
				this.deps.onStanza(stanza, { authenticatedFromDomains: inbound.authenticatedFromDomains });
			},
			onClosed: (inbound, error) => {
				this.inboundSessions.delete(inbound);
				for (const domain of inbound.authenticatedFromDomains) {
					this.deps.events.emit('connection.lost', { domain, direction: 'inbound', error });
				}
			},
		});
		this.inboundSessions.add(session);
	}

	/**
	 * Receiving-server side of dialback: dial the CLAIMED domain via DNS (never
	 * the source connection) on a dedicated verify connection and ask it to
	 * validate the key.
	 */
	private async requestDialbackVerification(req: { originatingDomain: string; streamId: string; key: string }): Promise<DialbackVerdict> {
		const session = new OutboundSession({
			config: this.deps.config,
			logger: this.logger,
			localDomain: this.deps.config.domain,
			targetDomain: req.originatingDomain,
			resolver: this.deps.resolver,
		});

		return session.verifyDialback({ originatingStreamId: req.streamId, key: req.key });
	}

	/** Authoritative-server side of dialback: only keys derived from our own secret are valid. */
	private answerDialbackVerify(req: {
		receivingDomain: string;
		originatingDomain: string;
		streamId: string;
		key: string;
	}): 'valid' | 'invalid' {
		const { config } = this.deps;

		try {
			const originatingDomain = normalizeDomain(req.originatingDomain);
			// We issue keys both as the server domain and as the MUC service domain
			if (originatingDomain !== config.domain && originatingDomain !== config.mucDomain) {
				return 'invalid';
			}
			return verifyDialbackKey(config.dialbackSecret, normalizeDomain(req.receivingDomain), originatingDomain, req.streamId, req.key)
				? 'valid'
				: 'invalid';
		} catch {
			return 'invalid';
		}
	}

	private reapIdleRoutes(): void {
		const now = Date.now();
		for (const [key, route] of this.routes) {
			if (route.queue.length > 0 || route.connecting || route.reconnectTimer) {
				continue;
			}
			if (now - route.lastActivity < this.deps.config.idleTimeoutMs) {
				continue;
			}
			route.session?.destroy();
			this.routes.delete(key);
			this.logger.debug({ domain: route.targetDomain }, 'Closed idle outbound route');
		}
	}
}
