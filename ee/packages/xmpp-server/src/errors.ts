export class XmppError extends Error {
	constructor(
		message: string,
		public readonly code: string,
	) {
		super(message);
		this.name = 'XmppError';
	}
}

export class InvalidJidError extends XmppError {
	constructor(value: string) {
		super(`Invalid JID: ${value}`, 'invalid-jid');
		this.name = 'InvalidJidError';
	}
}

export class DomainNotAllowedError extends XmppError {
	constructor(domain: string) {
		super(`Remote domain not allowed: ${domain}`, 'domain-not-allowed');
		this.name = 'DomainNotAllowedError';
	}
}

export class QueueOverflowError extends XmppError {
	constructor(domain: string) {
		super(`Outbound stanza queue overflow for domain: ${domain}`, 'queue-overflow');
		this.name = 'QueueOverflowError';
	}
}

export class ConnectionFailedError extends XmppError {
	constructor(domain: string, cause?: Error) {
		super(`Failed to connect to remote domain: ${domain}${cause ? ` (${cause.message})` : ''}`, 'connection-failed');
		this.name = 'ConnectionFailedError';
	}
}

export class NotJoinedToRemoteRoomError extends XmppError {
	constructor(roomJid: string, localJid: string) {
		super(`No session for ${localJid} in remote room ${roomJid}`, 'not-joined-to-remote-room');
		this.name = 'NotJoinedToRemoteRoomError';
	}
}

export class ServerNotRunningError extends XmppError {
	constructor() {
		super('XMPP server is not running', 'not-running');
		this.name = 'ServerNotRunningError';
	}
}
