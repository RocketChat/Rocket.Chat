import { Emitter } from '@rocket.chat/emitter';
import { parse } from 'ltx';
import type Element from 'ltx/lib/Element';

import { resolveConfig } from '../config';
import type { XMPPServerEventMap } from '../events';
import type { Logger } from '../logger';
import { StanzaRouter } from './StanzaRouter';

const silentLogger: Logger = {
	debug: () => undefined,
	info: () => undefined,
	warn: () => undefined,
	error: () => undefined,
	child: () => silentLogger,
};

const parseStanza = (xmlString: string): Element => parse(xmlString) as unknown as Element;

const setup = () => {
	const events = new Emitter<XMPPServerEventMap>();
	const replies: Element[] = [];
	const captured: Partial<Record<keyof XMPPServerEventMap, unknown>> = {};
	(['message.received', 'presence.received', 'presence.subscriptionRequest', 'presence.probe'] as const).forEach((type) => {
		events.on(type, (e) => {
			captured[type] = e;
		});
	});

	const router = new StanzaRouter({
		config: resolveConfig({ domain: 'rc.tld', requireTls: false, logger: silentLogger }),
		events,
		logger: silentLogger,
		reply: (stanza) => replies.push(stanza),
		listPublicRooms: () => [{ jid: 'team@conference.rc.tld', name: 'Team' }],
	});

	return { router, replies, captured };
};

describe('StanzaRouter', () => {
	it('emits message.received for a chat message with a body', () => {
		const { router, captured } = setup();
		router.dispatch(parseStanza("<message from='a@x.tld' to='b@rc.tld' type='chat' id='m1'><body>hi</body></message>"));
		expect(captured['message.received']).toMatchObject({ from: 'a@x.tld', to: 'b@rc.tld', body: 'hi', id: 'm1' });
	});

	it('ignores messages without a body', () => {
		const { router, captured } = setup();
		router.dispatch(parseStanza("<message from='a@x.tld' to='b@rc.tld' type='chat'><composing/></message>"));
		expect(captured['message.received']).toBeUndefined();
	});

	it('emits presence.received for availability presence', () => {
		const { router, captured } = setup();
		router.dispatch(parseStanza("<presence from='a@x.tld' to='b@rc.tld'><show>away</show></presence>"));
		expect(captured['presence.received']).toMatchObject({ availability: 'available', show: 'away' });
	});

	it('emits presence.subscriptionRequest for subscribe', () => {
		const { router, captured } = setup();
		router.dispatch(parseStanza("<presence from='a@x.tld' to='b@rc.tld' type='subscribe'/>"));
		expect(captured['presence.subscriptionRequest']).toEqual({ from: 'a@x.tld', to: 'b@rc.tld' });
	});

	it('replies to XEP-0199 ping with an empty result', () => {
		const { router, replies } = setup();
		router.dispatch(parseStanza("<iq from='peer.tld' to='rc.tld' type='get' id='p1'><ping xmlns='urn:xmpp:ping'/></iq>"));
		expect(replies).toHaveLength(1);
		expect(replies[0].attrs).toMatchObject({ type: 'result', id: 'p1', to: 'peer.tld', from: 'rc.tld' });
		expect(replies[0].children).toHaveLength(0);
	});

	it('answers disco#info on the server domain with server identity', () => {
		const { router, replies } = setup();
		router.dispatch(
			parseStanza("<iq from='peer.tld' to='rc.tld' type='get' id='d1'><query xmlns='http://jabber.org/protocol/disco#info'/></iq>"),
		);
		const query = replies[0].getChild('query');
		expect(query?.getChild('identity')?.attrs.category).toBe('server');
		expect(query?.getChildren('feature').some((f) => f.attrs.var === 'urn:xmpp:ping')).toBe(true);
	});

	it('answers disco#items on the MUC domain with hosted rooms', () => {
		const { router, replies } = setup();
		router.dispatch(
			parseStanza(
				"<iq from='peer.tld' to='conference.rc.tld' type='get' id='d2'><query xmlns='http://jabber.org/protocol/disco#items'/></iq>",
			),
		);
		const items = replies[0].getChild('query')?.getChildren('item');
		expect(items?.[0].attrs.jid).toBe('team@conference.rc.tld');
	});

	it('returns service-unavailable for unknown IQ get', () => {
		const { router, replies } = setup();
		router.dispatch(parseStanza("<iq from='peer.tld' to='rc.tld' type='get' id='u1'><foo xmlns='urn:example:unknown'/></iq>"));
		expect(replies[0].attrs.type).toBe('error');
		expect(replies[0].getChild('error')?.getChild('service-unavailable')).toBeDefined();
	});

	it('routes MUC-addressed stanzas to the MUC handler', () => {
		const events = new Emitter<XMPPServerEventMap>();
		const handled: Element[] = [];
		const router = new StanzaRouter({
			config: resolveConfig({ domain: 'rc.tld', requireTls: false, logger: silentLogger }),
			events,
			logger: silentLogger,
			reply: () => undefined,
			listPublicRooms: () => [],
			handleMucStanza: (stanza) => {
				handled.push(stanza);
				return true;
			},
		});

		router.dispatch(
			parseStanza("<presence from='a@x.tld/pc' to='team@conference.rc.tld/nick'><x xmlns='http://jabber.org/protocol/muc'/></presence>"),
		);
		expect(handled).toHaveLength(1);
	});
});
