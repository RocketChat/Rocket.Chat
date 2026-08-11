import type Element from 'ltx/lib/Element';

import type { ResolvedXMPPServerConfig } from '../config';
import { xml } from '../xml/build';
import { buildStanzaError } from '../xml/errors';
import { NS_DISCO_INFO, NS_DISCO_ITEMS, NS_MUC, NS_PING, NS_DIALBACK } from '../xml/namespaces';

export type DiscoItemsProvider = () => { jid: string; name?: string }[];

export type MucRoomDescription = { roomId: string; public: boolean; subject?: string };

/** Resolves a hosted room by localpart; undefined when we host no such room. */
export type MucRoomDescriber = (roomId: string) => MucRoomDescription | undefined;

/** Builds the reply to a disco#info/#items IQ get, or `undefined` if the query is unsupported. */
export function buildDiscoReply(
	iq: Element,
	config: ResolvedXMPPServerConfig,
	listPublicRooms: DiscoItemsProvider,
	describeRoom?: MucRoomDescriber,
): Element | undefined {
	const { to } = iq.attrs;
	const infoQuery = iq.getChild('query', NS_DISCO_INFO);
	const itemsQuery = iq.getChild('query', NS_DISCO_ITEMS);

	if (!infoQuery && !itemsQuery) {
		return undefined;
	}

	const reply = xml('iq', { from: to, to: iq.attrs.from, id: iq.attrs.id, type: 'result' });
	const bareTo = to?.split('/')[0] ?? '';
	const isMucDomain = bareTo === config.mucDomain;
	// A room JID (`room@conference.domain`) must describe the room, not the service
	const roomId = !isMucDomain && bareTo.endsWith(`@${config.mucDomain}`) ? bareTo.split('@')[0] : undefined;

	if (roomId !== undefined) {
		const room = describeRoom?.(roomId);
		if (!room) {
			return buildStanzaError(iq, 'item-not-found', 'cancel');
		}
		if (infoQuery) {
			reply.cnode(buildRoomInfo(room));
			return reply;
		}
		// Occupant lists are not disclosed; an empty result is a valid answer
		reply.cnode(xml('query', { xmlns: NS_DISCO_ITEMS }));
		return reply;
	}

	if (infoQuery) {
		const query = xml('query', { xmlns: NS_DISCO_INFO });
		if (isMucDomain) {
			query.cnode(xml('identity', { category: 'conference', type: 'text', name: 'Rocket.Chat Conferences' }));
			query.cnode(xml('feature', { var: NS_DISCO_INFO }));
			query.cnode(xml('feature', { var: NS_MUC }));
		} else {
			query.cnode(xml('identity', { category: 'server', type: 'im', name: 'Rocket.Chat' }));
			query.cnode(xml('feature', { var: NS_DISCO_INFO }));
			query.cnode(xml('feature', { var: NS_DISCO_ITEMS }));
			query.cnode(xml('feature', { var: NS_PING }));
			query.cnode(xml('feature', { var: NS_DIALBACK }));
		}
		reply.cnode(query);
		return reply;
	}

	const query = xml('query', { xmlns: NS_DISCO_ITEMS });
	if (isMucDomain) {
		for (const room of listPublicRooms()) {
			query.cnode(xml('item', { jid: room.jid, name: room.name }));
		}
	} else {
		// The server domain advertises the MUC service as a child item
		query.cnode(xml('item', { jid: config.mucDomain, name: 'Conferences' }));
	}
	reply.cnode(query);
	return reply;
}

/**
 * disco#info for a hosted room. Clients read these features before joining to decide
 * whether the JID is a groupchat at all and how to present it.
 */
function buildRoomInfo(room: MucRoomDescription): Element {
	const query = xml('query', { xmlns: NS_DISCO_INFO });
	query.cnode(xml('identity', { category: 'conference', type: 'text', name: room.subject || room.roomId }));
	for (const feature of [
		NS_DISCO_INFO,
		NS_MUC,
		'muc_persistent',
		'muc_unmoderated',
		'muc_nonanonymous',
		room.public ? 'muc_public' : 'muc_hidden',
		room.public ? 'muc_open' : 'muc_membersonly',
	]) {
		query.cnode(xml('feature', { var: feature }));
	}
	return query;
}
