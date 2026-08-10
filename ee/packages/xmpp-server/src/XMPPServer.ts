import { Emitter } from '@rocket.chat/emitter';
import type { EventHandlerOf, OffCallbackHandler } from '@rocket.chat/emitter';
import type Element from 'ltx/lib/Element';

import type { XMPPServerConfig, ResolvedXMPPServerConfig } from './config';
import { resolveConfig } from './config';
import { ServerNotRunningError } from './errors';
import type { ConnectionStatus, XMPPServerEventMap } from './events';
import type { Logger } from './logger';
import { StanzaRouter } from './router/StanzaRouter';
import { S2SManager } from './s2s/S2SManager';
import type { XmppDnsResolver } from './s2s/dnsResolver';
import { resolveXmppServer } from './s2s/dnsResolver';
import { xml } from './xml/build';

export type XMPPServerOptions = {
	/** Overridable DNS resolver — injected in tests to point at loopback listeners. */
	resolver?: XmppDnsResolver;
};

export type SendChatMessageParams = { from: string; to: string; body: string; id?: string; thread?: string };
export type SendPresenceParams = {
	from: string;
	to: string;
	availability: 'available' | 'unavailable';
	show?: 'away' | 'chat' | 'dnd' | 'xa';
	status?: string;
};
export type SubscriptionType = 'subscribe' | 'subscribed' | 'unsubscribe' | 'unsubscribed';

/** Lists the hosted MUC rooms to advertise via disco#items — set by the MUC layer. */
export type PublicRoomsProvider = () => { jid: string; name?: string }[];

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

	private readonly router: StanzaRouter;

	private s2s: S2SManager | undefined;

	private publicRoomsProvider: PublicRoomsProvider = () => [];

	/** Installed by the MUC layer to consume MUC-domain-addressed stanzas. */
	protected mucStanzaHandler?: (stanza: Element) => boolean;

	constructor(config: XMPPServerConfig, options: XMPPServerOptions = {}) {
		this.config = resolveConfig(config);
		this.logger = this.config.logger;
		this.resolver = options.resolver ?? resolveXmppServer;
		this.router = new StanzaRouter({
			config: this.config,
			events: this.emitter,
			logger: this.logger,
			reply: (stanza) => this.reply(stanza),
			listPublicRooms: () => this.publicRoomsProvider(),
			handleMucStanza: (stanza) => this.mucStanzaHandler?.(stanza) ?? false,
		});
	}

	/** Registers the disco#items source for hosted rooms. */
	setPublicRoomsProvider(provider: PublicRoomsProvider): void {
		this.publicRoomsProvider = provider;
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

	/** The actual bound port (useful when configured with port 0). */
	getListeningPort(): number | undefined {
		return this.s2s?.listeningPort;
	}

	async sendChatMessage(params: SendChatMessageParams): Promise<void> {
		const message = xml('message', { from: params.from, to: params.to, type: 'chat', id: params.id }, xml('body', {}, params.body));
		if (params.thread) {
			message.cnode(xml('thread', {}, params.thread));
		}
		await this.send(message);
	}

	async sendPresence(params: SendPresenceParams): Promise<void> {
		const presence = xml('presence', {
			from: params.from,
			to: params.to,
			type: params.availability === 'unavailable' ? 'unavailable' : undefined,
		});
		if (params.show) {
			presence.cnode(xml('show', {}, params.show));
		}
		if (params.status) {
			presence.cnode(xml('status', {}, params.status));
		}
		await this.send(presence);
	}

	async probePresence(params: { from: string; to: string }): Promise<void> {
		await this.send(xml('presence', { from: params.from, to: params.to, type: 'probe' }));
	}

	async sendSubscription(params: { from: string; to: string; type: SubscriptionType }): Promise<void> {
		await this.send(xml('presence', { from: params.from, to: params.to, type: params.type }));
	}

	/** Low-level send used by the routing/handler layers. Rejects if the server is stopped. */
	protected send(stanza: Element): Promise<void> {
		if (!this.s2s) {
			return Promise.reject(new ServerNotRunningError());
		}
		return this.s2s.sendStanza(stanza);
	}

	/** Fire-and-forget reply used for IQ auto-responses; delivery failures are logged, not thrown. */
	private reply(stanza: Element): void {
		this.send(stanza).catch((error: Error) => {
			this.logger.debug({ err: error, name: stanza.name }, 'Failed to send reply stanza');
		});
	}

	private handleInboundStanza(stanza: Element): void {
		try {
			this.router.dispatch(stanza);
		} catch (error) {
			this.logger.error({ err: error, name: stanza.name }, 'Error dispatching inbound stanza');
			this.emitter.emit('error', {
				scope: 'stanza',
				error: error instanceof Error ? error : new Error(String(error)),
				raw: stanza,
			});
		}
	}
}
