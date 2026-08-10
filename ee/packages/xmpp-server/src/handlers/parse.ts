import type Element from 'ltx/lib/Element';

import type { IncomingChatMessage, IncomingPresence } from '../events';

const NS_CORRECT = 'urn:xmpp:message-correct:0';

/** Parses a `<message>` stanza into a chat message, or `undefined` for non-chat/bodyless messages. */
export function parseChatMessage(stanza: Element): IncomingChatMessage | undefined {
	const type = stanza.attrs.type ?? 'normal';
	if (type !== 'chat' && type !== 'normal') {
		return undefined;
	}

	const body = stanza.getChildText('body');
	if (!body) {
		return undefined;
	}

	const { from, to } = stanza.attrs;
	if (!from || !to) {
		return undefined;
	}

	return {
		from,
		to,
		body,
		id: stanza.attrs.id,
		thread: stanza.getChildText('thread') ?? undefined,
		replaceId: stanza.getChild('replace', NS_CORRECT)?.attrs.id,
		raw: stanza,
	};
}

const VALID_SHOW = new Set(['away', 'chat', 'dnd', 'xa']);

/** Parses a `<presence>` stanza carrying availability (type absent or `unavailable`). */
export function parseAvailabilityPresence(stanza: Element): IncomingPresence | undefined {
	const { type } = stanza.attrs;
	if (type && type !== 'unavailable') {
		return undefined;
	}

	const { from, to } = stanza.attrs;
	if (!from || !to) {
		return undefined;
	}

	const show = stanza.getChildText('show') ?? undefined;

	return {
		from,
		to,
		availability: type === 'unavailable' ? 'unavailable' : 'available',
		show: show && VALID_SHOW.has(show) ? (show as IncomingPresence['show']) : undefined,
		status: stanza.getChildText('status') ?? undefined,
		raw: stanza,
	};
}

export type PresenceSubscriptionType = 'subscribe' | 'subscribed' | 'unsubscribe' | 'unsubscribed';

export function getSubscriptionType(stanza: Element): PresenceSubscriptionType | undefined {
	const { type } = stanza.attrs;
	if (type === 'subscribe' || type === 'subscribed' || type === 'unsubscribe' || type === 'unsubscribed') {
		return type;
	}
	return undefined;
}
