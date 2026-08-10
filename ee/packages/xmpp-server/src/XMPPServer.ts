import { Emitter } from '@rocket.chat/emitter';
import type { EventHandlerOf, OffCallbackHandler } from '@rocket.chat/emitter';
import type Element from 'ltx/lib/Element';

import type { XMPPServerConfig, ResolvedXMPPServerConfig } from './config';
import { resolveConfig } from './config';
import { ServerNotRunningError } from './errors';
import type { ConnectionStatus, XMPPServerEventMap } from './events';
import type { Logger } from './logger';
import { S2SManager } from './s2s/S2SManager';
import type { XmppDnsResolver } from './s2s/dnsResolver';
import { resolveXmppServer } from './s2s/dnsResolver';

export type XMPPServerOptions = {
	/** Overridable DNS resolver — injected in tests to point at loopback listeners. */
	resolver?: XmppDnsResolver;
};

/**
 * Public entrypoint for the native XMPP S2S server. Owns the S2S transport and
 * exposes a typed event surface (via `@rocket.chat/emitter`) plus imperative
 * send methods. Message routing, presence and MUC handlers layer on top of the
 * `onStanza`/`sendStanza` seam exposed here.
 */
export class XMPPServer {
	private readonly emitter = new Emitter<XMPPServerEventMap>();

	private readonly config: ResolvedXMPPServerConfig;

	private readonly logger: Logger;

	private readonly resolver: XmppDnsResolver;

	private s2s: S2SManager | undefined;

	constructor(config: XMPPServerConfig, options: XMPPServerOptions = {}) {
		this.config = resolveConfig(config);
		this.logger = this.config.logger;
		this.resolver = options.resolver ?? resolveXmppServer;
	}

	get domain(): string {
		return this.config.domain;
	}

	get mucDomain(): string {
		return this.config.mucDomain;
	}

	get isRunning(): boolean {
		return this.s2s !== undefined;
	}

	async start(): Promise<void> {
		if (this.s2s) {
			return;
		}

		const s2s = new S2SManager({
			config: this.config,
			logger: this.logger,
			resolver: this.resolver,
			events: this.emitter,
			onStanza: (stanza) => this.handleInboundStanza(stanza),
		});

		await s2s.startListener();
		this.s2s = s2s;
		this.emitter.emit('server.started', { port: s2s.listeningPort ?? this.config.port });
	}

	async stop(): Promise<void> {
		if (!this.s2s) {
			return;
		}
		const { s2s } = this;
		this.s2s = undefined;
		await s2s.stopAll();
		this.emitter.emit('server.stopped', undefined);
	}

	on<K extends keyof XMPPServerEventMap>(type: K, handler: EventHandlerOf<XMPPServerEventMap, K>): OffCallbackHandler {
		return this.emitter.on(type, handler);
	}

	once<K extends keyof XMPPServerEventMap>(type: K, handler: EventHandlerOf<XMPPServerEventMap, K>): OffCallbackHandler {
		return this.emitter.once(type, handler);
	}

	off<K extends keyof XMPPServerEventMap>(type: K, handler: EventHandlerOf<XMPPServerEventMap, K>): void {
		this.emitter.off(type, handler);
	}

	getConnectionStatus(domain: string): ConnectionStatus {
		return this.s2s?.getConnectionStatus(domain) ?? 'disconnected';
	}

	/** Low-level send used by the routing/handler layers. Rejects if the server is stopped. */
	protected send(stanza: Element): Promise<void> {
		if (!this.s2s) {
			return Promise.reject(new ServerNotRunningError());
		}
		return this.s2s.sendStanza(stanza);
	}

	/** Overridden/extended by the routing layer in a later commit. */
	protected handleInboundStanza(stanza: Element): void {
		this.logger.debug({ name: stanza.name }, 'Inbound stanza received (no router installed yet)');
	}
}
