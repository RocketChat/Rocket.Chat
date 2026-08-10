import type Element from 'ltx/lib/Element';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'failed';

export type IncomingChatMessage = {
	/** Full JIDs, domain-normalized. */
	from: string;
	to: string;
	body: string;
	id?: string;
	thread?: string;
	/** XEP-0308 correction target, parsed when present (not acted on in v1). */
	replaceId?: string;
	raw: Element;
};

export type IncomingPresence = {
	from: string;
	to: string;
	availability: 'available' | 'unavailable';
	show?: 'away' | 'chat' | 'dnd' | 'xa';
	status?: string;
	raw: Element;
};

export type MucRemoteOccupant = {
	nick: string;
	/** Real JID when the room is non-anonymous. */
	jid?: string;
	role: string;
	affiliation: string;
};

export type XMPPServerEventMap = {
	'server.started': { port: number };
	'server.stopped': void;
	'connection.established': { domain: string; direction: 'inbound' | 'outbound'; tls: boolean; authMethod: 'dialback' | 'sasl-external' };
	'connection.lost': { domain: string; direction: 'inbound' | 'outbound'; error?: Error };
	'connection.failed': { domain: string; attempts: number; error: Error };
	'error': { scope: 'stream' | 'stanza' | 'dialback' | 'muc' | 'internal'; domain?: string; error: Error; raw?: Element };

	'message.received': IncomingChatMessage;
	'message.error': { originalId?: string; from: string; to: string; condition: string; raw: Element };
	'presence.received': IncomingPresence;
	'presence.subscriptionRequest': { from: string; to: string };
	'presence.subscribed': { from: string; to: string };
	'presence.unsubscribed': { from: string; to: string };
	'presence.probe': { from: string; to: string };

	'muc.occupantJoined': { roomId: string; nick: string; jid: string; role: string };
	'muc.occupantLeft': { roomId: string; nick: string; jid: string; reason?: 'left' | 'kicked' };
	'muc.messageReceived': { roomId: string; fromNick: string; fromJid: string; body: string; id?: string; raw: Element };
	'muc.subjectChanged': { roomId: string; fromNick: string; subject: string };
	'muc.inviteReceived': { roomJid: string; toLocalJid: string; fromJid: string; reason?: string; password?: string };

	'muc.remoteJoined': { roomJid: string; localJid: string; nick: string; occupants: MucRemoteOccupant[] };
	'muc.remoteJoinFailed': { roomJid: string; localJid: string; condition: string };
	'muc.remoteOccupantJoined': { roomJid: string; occupant: MucRemoteOccupant };
	'muc.remoteOccupantLeft': { roomJid: string; nick: string };
	'muc.remoteMessage': { roomJid: string; fromNick: string; body: string; id?: string; raw: Element };
	'muc.remoteSessionLost': { roomJid: string; localJid: string };
};
