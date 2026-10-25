import type { xml } from '@xmpp/client';

export type Stanza = ReturnType<typeof xml>;

export const NS = {
	register: 'jabber:iq:register',
	ping: 'urn:xmpp:ping',
	discoInfo: 'http://jabber.org/protocol/disco#info',
	discoItems: 'http://jabber.org/protocol/disco#items',
	muc: 'http://jabber.org/protocol/muc',
	mucUser: 'http://jabber.org/protocol/muc#user',
	mucOwner: 'http://jabber.org/protocol/muc#owner',
	mucAdmin: 'http://jabber.org/protocol/muc#admin',
	dataForms: 'jabber:x:data',
	stanzas: 'urn:ietf:params:xml:ns:xmpp-stanzas',
	correction: 'urn:xmpp:message-correct:0',
	stanzaId: 'urn:xmpp:sid:0',
} as const;

export const bare = (jid = ''): string => jid.split('/')[0].toLowerCase();
