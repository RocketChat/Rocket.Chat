export { XMPPServer } from './XMPPServer';
export type { XMPPServerOptions } from './XMPPServer';
export type { XMPPServerConfig, TlsConfig, MucDelegates, MucJoinDecision } from './config';
export type { ConnectionStatus, IncomingChatMessage, IncomingPresence, MucRemoteOccupant, XMPPServerEventMap } from './events';
export { escapeLocalpart, unescapeLocalpart } from './jid/escaping';
export { normalizeDomain } from './jid/normalize';
export { XmppError, InvalidJidError, DomainNotAllowedError, ServerNotRunningError } from './errors';
export type { Logger } from './logger';
