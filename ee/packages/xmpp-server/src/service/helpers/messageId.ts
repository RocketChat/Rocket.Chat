import { createHash, createHmac } from 'node:crypto';

const SCHEME = 'xmpp-msg-v1';

// The alphabet and length of `Random.id()`, so a derived id looks like any other message id
const ID_CHARS = '23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz';
const ID_LENGTH = 17;

export type InboundMessageKey = {
	rid: string;
	/** Who may later correct or retract the message: a bare JID, or in a remote room the nick plus its XEP-0421 occupant id. */
	authorKey: string;
	/** The `id` attribute the sender gave the stanza. */
	senderId: string;
};

/**
 * The `_id` an inbound message is stored under, recomputable from any later stanza that
 * references it by the sender's id and unpredictable without the secret (ADR 0014).
 */
export function deriveInboundMessageId(secret: string, { rid, authorKey, senderId }: InboundMessageKey): string {
	const digest = createHmac('sha256', secret)
		.update(JSON.stringify([SCHEME, rid, authorKey, senderId]))
		.digest('hex');
	const base = BigInt(ID_CHARS.length);
	let value = BigInt(`0x${digest}`);
	let id = '';
	for (let i = 0; i < ID_LENGTH; i++) {
		id += ID_CHARS[Number(value % base)];
		value /= base;
	}
	return id;
}

export type InboundEventKey = Pick<InboundMessageKey, 'rid' | 'authorKey'> & {
	/** The sender's domain, or the room's for a remote room. */
	originDomain: string;
	/** The XEP-0359 id the room stamped on the message. */
	roomStanzaId?: string;
	senderId?: string;
};

/**
 * The `federation.eventId` every copy of one inbound message shares (message-deduplication R2).
 * A room's own id is unique in the room; a sender's id is unique only among that sender's messages.
 */
export function deriveInboundEventId({ originDomain, rid, authorKey, roomStanzaId, senderId }: InboundEventKey): string | undefined {
	if (roomStanzaId) {
		return `xmpp:${originDomain}:${rid}:${roomStanzaId}`;
	}
	if (senderId) {
		const digest = createHash('sha256')
			.update(JSON.stringify([authorKey, senderId]))
			.digest('base64url');
		return `xmpp:${originDomain}:${rid}:${digest}`;
	}
	return undefined;
}
