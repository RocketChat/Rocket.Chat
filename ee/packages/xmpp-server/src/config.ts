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
	| { allow: true; role?: 'moderator' | 'participant' }
	| { allow: false; reason: 'forbidden' | 'members-only' | 'banned' };

export type MucDelegates = {
	/** Decides whether a remote occupant may join a hosted room. Default: allow as participant. */
	authorizeMucJoin?: (params: { roomId: string; occupantJid: string; nick: string }) => Promise<MucJoinDecision>;
};

export type XMPPServerConfig = {
	/** The XMPP domain this server serves, e.g. `chat.example.com`. */
	domain: string;
	/** S2S listen port. Default 5269. */
	port?: number;
	/** Default `0.0.0.0`. */
	bindAddress?: string;
	/** Required unless `requireTls` is explicitly disabled. */
	tls?: TlsConfig;
	/** Inbound: advertise STARTTLS as required. Outbound: abort if the peer lacks STARTTLS. Default true. */
	requireTls?: boolean;
	/** Default true. */
	dialbackEnabled?: boolean;
	/** Persisted by the caller; an ephemeral random secret is generated when omitted. */
	dialbackSecret?: string;
	/** Offer/attempt SASL EXTERNAL when TLS material is available. Default true. */
	saslExternalEnabled?: boolean;
	/** Hosted MUC service subdomain. Default `conference`. */
	mucSubdomain?: string;
	/** When set, only these remote domains may federate. */
	allowedDomains?: string[];
	deniedDomains?: string[];
	/** Default 262144 bytes. */
	maxStanzaSize?: number;
	/** Default 15000. */
	connectTimeoutMs?: number;
	/** Outbound sessions idle longer than this are closed. Default 600000. */
	idleTimeoutMs?: number;
	/** Max stanzas queued per remote domain while connecting. Default 256. */
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
	const mucSubdomain = config.mucSubdomain?.trim() || 'conference';
	const requireTls = config.requireTls ?? true;

	if (requireTls && !config.tls) {
		throw new Error('TLS material is required unless requireTls is explicitly disabled');
	}

	return {
		domain,
		port: config.port ?? 5269,
		bindAddress: config.bindAddress ?? '0.0.0.0',
		tls: config.tls,
		requireTls,
		dialbackEnabled: config.dialbackEnabled ?? true,
		dialbackSecret: config.dialbackSecret || crypto.randomBytes(32).toString('hex'),
		saslExternalEnabled: (config.saslExternalEnabled ?? true) && !!config.tls,
		mucSubdomain,
		mucDomain: normalizeDomain(`${mucSubdomain}.${domain}`),
		allowedDomains: config.allowedDomains?.length ? config.allowedDomains : undefined,
		deniedDomains: config.deniedDomains?.length ? config.deniedDomains : undefined,
		maxStanzaSize: config.maxStanzaSize ?? DEFAULT_MAX_STANZA_SIZE,
		connectTimeoutMs: config.connectTimeoutMs ?? 15000,
		idleTimeoutMs: config.idleTimeoutMs ?? 600000,
		outboundQueueLimit: config.outboundQueueLimit ?? 256,
		delegates: config.delegates ?? {},
		logger: config.logger ?? pino({ name: 'xmpp-server' }),
	};
}
