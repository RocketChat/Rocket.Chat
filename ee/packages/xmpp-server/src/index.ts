export { XMPPServer } from './XMPPServer.js';
export type { XMPPServerOptions, SendChatMessageParams, SendPresenceParams, SubscriptionType } from './XMPPServer.js';
export { XMPP_SERVER_DEFAULTS } from './config.js';
export type { XMPPServerConfig, TlsConfig, MucDelegates, MucJoinDecision } from './config.js';
export type { ConnectionStatus, IncomingChatMessage, IncomingPresence, MucRemoteOccupant, XMPPServerEventMap } from './events.js';
export { escapeLocalpart, unescapeLocalpart } from './jid/escaping.js';
export { normalizeDomain } from './jid/normalize.js';
export { XmppError, InvalidJidError, DomainNotAllowedError, NotJoinedToRemoteRoomError, ServerNotRunningError } from './errors.js';
export type { Logger } from './logger.js';
export { resolveXmppServer } from './s2s/dnsResolver.js';
export type { XmppDnsResolver, XmppServerAddress } from './s2s/dnsResolver.js';

export { XMPPServerService } from './service/XMPPServerService.js';
export type { InboundHandlerObserver, XMPPServerServiceOptions } from './service/XMPPServerService.js';
