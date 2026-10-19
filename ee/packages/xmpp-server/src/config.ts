import crypto from 'node:crypto';

import { pino } from 'pino';

import { normalizeDomain } from './jid/normalize';
import type { Logger } from './logger';
import { DEFAULT_MAX_STANZA_SIZE } from './xml/StanzaParser';

export type TlsConfig = {
	cert: string | Buffer;
	key: string | Buffer;
	/** Extra CA chain used to validate peer certificates for SASL EXTERNAL. */
	ca?: string | Buffer;
};

export type MucJoinDecision =
	{ allow: true; role?: 'moderator' | 'participant' } | { allow: false; reason: 'forbidden' | 'members-only' | 'banned' };

export type MucDelegates = {
	/** Decides whether a remote occupant may join a hosted room. Default: allow as participant. */
	authorizeMucJoin?: (params: { roomId: string; occupantJid: string; nick: string }) => Promise<MucJoinDecision>;
};

export const XMPP_SERVER_DEFAULTS = {
	port: 5269,
	bindAddress: '0.0.0.0',
	requireTls: true,
	dialbackEnabled: true,
	saslExternalEnabled: true,
	mucSubdomain: 'conference',
	maxStanzaSize: DEFAULT_MAX_STANZA_SIZE,
	connectTimeoutMs: 15_000,
	idleTimeoutMs: 10 * 60_000,
	inboundAuthTimeoutMs: 60_000,
	outboundQueueLimit: 256,
} as const;

/** Inbound: advertise STARTTLS as required. Outbound: abort if the peer lacks STARTTLS. */
type TlsRequirement = { requireTls?: true; tls: TlsConfig } | { requireTls: false; tls?: TlsConfig };

/** An option left out takes its value from {@link XMPP_SERVER_DEFAULTS}. */
export type XMPPServerConfig = TlsRequirement & {
	/** The XMPP domain this server serves, e.g. `chat.example.com`. */
	domain: string;
	/** S2S listen port. */
	port?: number;
	bindAddress?: string;
	dialbackEnabled?: boolean;
	/** An ephemeral random secret is generated when omitted. */
	dialbackSecret?: string;
	/** Offer/attempt SASL EXTERNAL when TLS material is available. */
	saslExternalEnabled?: boolean;
	/** Hosted MUC service subdomain. */
	mucSubdomain?: string;
	/** When set, only these remote domains may federate. */
	allowedDomains?: string[];
	deniedDomains?: string[];
	maxStanzaSize?: number;
	connectTimeoutMs?: number;
	/** Outbound sessions idle longer than this are closed. */
	idleTimeoutMs?: number;
	/** Inbound connections that authenticate no domain within this time are closed. */
	inboundAuthTimeoutMs?: number;
	/** Max stanzas queued per remote domain while connecting. */
	outboundQueueLimit?: number;
	delegates?: MucDelegates;
	logger?: Logger;
};

export type ResolvedXMPPServerConfig = Required<
	Omit<XMPPServerConfig, 'tls' | 'allowedDomains' | 'deniedDomains' | 'delegates' | 'logger'>
> & {
	tls?: TlsConfig;
	allowedDomains?: string[];
	deniedDomains?: string[];
	delegates: MucDelegates;
	logger: Logger;
	mucDomain: string;
};

export function resolveConfig(config: XMPPServerConfig): ResolvedXMPPServerConfig {
	const domain = normalizeDomain(config.domain);
	const mucSubdomain = config.mucSubdomain?.trim() || XMPP_SERVER_DEFAULTS.mucSubdomain;
	const requireTls = config.requireTls ?? XMPP_SERVER_DEFAULTS.requireTls;

	if (requireTls && !config.tls) {
		throw new Error('TLS material is required unless requireTls is explicitly disabled');
	}

	return {
		domain,
		port: config.port ?? XMPP_SERVER_DEFAULTS.port,
		bindAddress: config.bindAddress ?? XMPP_SERVER_DEFAULTS.bindAddress,
		tls: config.tls,
		requireTls,
		dialbackEnabled: config.dialbackEnabled ?? XMPP_SERVER_DEFAULTS.dialbackEnabled,
		dialbackSecret: config.dialbackSecret || crypto.randomBytes(32).toString('hex'),
		saslExternalEnabled: (config.saslExternalEnabled ?? XMPP_SERVER_DEFAULTS.saslExternalEnabled) && !!config.tls,
		mucSubdomain,
		mucDomain: normalizeDomain(`${mucSubdomain}.${domain}`),
		allowedDomains: config.allowedDomains?.length ? config.allowedDomains : undefined,
		deniedDomains: config.deniedDomains?.length ? config.deniedDomains : undefined,
		maxStanzaSize: config.maxStanzaSize ?? XMPP_SERVER_DEFAULTS.maxStanzaSize,
		connectTimeoutMs: config.connectTimeoutMs ?? XMPP_SERVER_DEFAULTS.connectTimeoutMs,
		idleTimeoutMs: config.idleTimeoutMs ?? XMPP_SERVER_DEFAULTS.idleTimeoutMs,
		inboundAuthTimeoutMs: config.inboundAuthTimeoutMs ?? XMPP_SERVER_DEFAULTS.inboundAuthTimeoutMs,
		outboundQueueLimit: config.outboundQueueLimit ?? XMPP_SERVER_DEFAULTS.outboundQueueLimit,
		delegates: config.delegates ?? {},
		logger: config.logger ?? pino({ name: 'xmpp-server' }),
	};
}
