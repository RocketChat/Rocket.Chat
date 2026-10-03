import { createHmac } from 'node:crypto';

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
