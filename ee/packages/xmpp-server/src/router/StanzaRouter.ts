import type { Emitter } from '@rocket.chat/emitter';
import type Element from 'ltx/lib/Element';

import type { ResolvedXMPPServerConfig } from '../config';
import type { XMPPServerEventMap } from '../events';
import { getSubscriptionType, parseAvailabilityPresence, parseChatMessage } from '../handlers/parse';
import { buildDiscoReply } from '../iq/disco';
import type { DiscoItemsProvider, MucRoomDescriber } from '../iq/disco';
import { buildPingReply, isPing } from '../iq/ping';
import type { Logger } from '../logger';
import { buildStanzaError } from '../xml/errors';

export type StanzaRouterDeps = {
	config: ResolvedXMPPServerConfig;
	events: Emitter<XMPPServerEventMap>;
	logger: Logger;
	/** Sends a reply stanza back over S2S (routed by its `to` domain). */
	reply: (stanza: Element) => void;
	listPublicRooms: DiscoItemsProvider;
	describeRoom?: MucRoomDescriber;
	/** Optional MUC-domain handler installed by the MUC layer; returns true if it consumed the stanza. */
	handleMucStanza?: (stanza: Element) => boolean;
};

/**
 * Dispatches authenticated inbound stanzas: MUC-addressed traffic to the MUC
 * layer, IQ disco/ping to auto-replies, and message/presence to typed events.
 */
export class StanzaRouter {
	private readonly logger: Logger;

	constructor(private readonly deps: StanzaRouterDeps) {
		this.logger = deps.logger.child({ component: 'router' });
	}

	dispatch(stanza: Element): void {
		if (this.isMucAddressed(stanza) && this.deps.handleMucStanza?.(stanza)) {
			return;
		}

		switch (stanza.name) {
			case 'message':
				return this.handleMessage(stanza);
			case 'presence':
				return this.handlePresence(stanza);
			case 'iq':
				return this.handleIq(stanza);
			default:
				this.logger.debug({ name: stanza.name }, 'Dropping unsupported stanza');
		}
	}

	private isMucAddressed(stanza: Element): boolean {
		const { to } = stanza.attrs;
		if (!to) {
			return false;
		}
		const domain = to.split('/')[0].split('@').pop();
		return domain === this.deps.config.mucDomain;
	}

	private handleMessage(stanza: Element): void {
		const message = parseChatMessage(stanza);
		if (!message) {
			this.logger.debug({ id: stanza.attrs.id }, 'Ignoring non-chat or bodyless message');
			return;
		}
		this.deps.events.emit('message.received', message);
	}

	private handlePresence(stanza: Element): void {
		const subscription = getSubscriptionType(stanza);
		const { from, to } = stanza.attrs;
		if (!from || !to) {
			return;
		}

		if (subscription) {
			switch (subscription) {
				case 'subscribe':
					return this.deps.events.emit('presence.subscriptionRequest', { from, to });
				case 'subscribed':
					return this.deps.events.emit('presence.subscribed', { from, to });
				case 'unsubscribe':
				case 'unsubscribed':
					return this.deps.events.emit('presence.unsubscribed', { from, to });
			}
		}

		if (stanza.attrs.type === 'probe') {
			return this.deps.events.emit('presence.probe', { from, to });
		}

		const presence = parseAvailabilityPresence(stanza);
		if (presence) {
			this.deps.events.emit('presence.received', presence);
		}
	}

	private handleIq(stanza: Element): void {
		const { type } = stanza.attrs;
		if (type === 'result' || type === 'error') {
			// Responses to IQs we issued are handled by their own trackers, not here
			this.logger.debug({ id: stanza.attrs.id, type }, 'Unmatched IQ response');
			return;
		}

		if (isPing(stanza)) {
			return this.deps.reply(buildPingReply(stanza));
		}

		const disco = buildDiscoReply(stanza, this.deps.config, this.deps.listPublicRooms, this.deps.describeRoom);
		if (disco) {
			return this.deps.reply(disco);
		}

		// RFC 6120: unknown IQ get/set must be answered with an error, or peers hang
		this.deps.reply(buildStanzaError(stanza, 'service-unavailable', 'cancel'));
	}
}
