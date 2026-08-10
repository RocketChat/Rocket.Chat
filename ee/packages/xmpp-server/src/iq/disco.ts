import type Element from 'ltx/lib/Element';

import type { ResolvedXMPPServerConfig } from '../config';
import { xml } from '../xml/build';
import { NS_DISCO_INFO, NS_DISCO_ITEMS, NS_MUC, NS_PING, NS_DIALBACK } from '../xml/namespaces';

export type DiscoItemsProvider = () => { jid: string; name?: string }[];

/** Builds the reply to a disco#info/#items IQ get, or `undefined` if the query is unsupported. */
export function buildDiscoReply(iq: Element, config: ResolvedXMPPServerConfig, listPublicRooms: DiscoItemsProvider): Element | undefined {
	const { to } = iq.attrs;
	const infoQuery = iq.getChild('query', NS_DISCO_INFO);
	const itemsQuery = iq.getChild('query', NS_DISCO_ITEMS);

	if (!infoQuery && !itemsQuery) {
		return undefined;
	}

	const reply = xml('iq', { from: to, to: iq.attrs.from, id: iq.attrs.id, type: 'result' });
	const isMucDomain = to === config.mucDomain;

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
