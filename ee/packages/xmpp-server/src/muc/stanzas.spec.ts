import { parse } from 'ltx';
import type Element from 'ltx/lib/Element';

import {
	buildGroupchatMessage,
	buildMediatedInvite,
	buildOccupantPresence,
	parseJoinPresence,
	parseMucInvite,
	splitOccupantJid,
} from './stanzas';

const p = (xmlString: string): Element => parse(xmlString) as unknown as Element;

describe('splitOccupantJid', () => {
	it('splits room JID and nick', () => {
		expect(splitOccupantJid('team@conference.rc.tld/alice')).toEqual(['team@conference.rc.tld', 'alice']);
	});

	it('returns undefined nick when no resource', () => {
		expect(splitOccupantJid('team@conference.rc.tld')).toEqual(['team@conference.rc.tld', undefined]);
	});
});

describe('buildOccupantPresence', () => {
	it('carries the in-room JID, real JID and status codes', () => {
		const presence = buildOccupantPresence({
			roomJid: 'team@conference.rc.tld',
			nick: 'alice',
			to: 'bob@remote.tld',
			realJid: 'alice@rc.tld',
			role: 'participant',
			statusCodes: [110, 201],
		});
		expect(presence.attrs.from).toBe('team@conference.rc.tld/alice');
		expect(presence.attrs.to).toBe('bob@remote.tld');
		const item = presence.getChild('x')?.getChild('item');
		expect(item?.attrs.jid).toBe('alice@rc.tld');
		expect(
			presence
				.getChild('x')
				?.getChildren('status')
				.map((s) => s.attrs.code),
		).toEqual(['110', '201']);
	});
});

describe('buildGroupchatMessage', () => {
	it('builds a groupchat message from an occupant', () => {
		const message = buildGroupchatMessage({
			roomJid: 'team@conference.rc.tld',
			fromNick: 'alice',
			to: 'bob@remote.tld',
			body: 'hi',
			id: 'm1',
		});
		expect(message.attrs).toMatchObject({ from: 'team@conference.rc.tld/alice', to: 'bob@remote.tld', type: 'groupchat', id: 'm1' });
		expect(message.getChildText('body')).toBe('hi');
	});
});

describe('buildMediatedInvite', () => {
	it('is sent by the room and carries the inviter and reason', () => {
		const invite = buildMediatedInvite({
			roomJid: 'team@conference.rc.tld',
			inviterJid: 'diego@rc.tld',
			to: 'alice@remote.tld',
			reason: 'join us',
		});

		expect(invite.attrs).toMatchObject({ from: 'team@conference.rc.tld', to: 'alice@remote.tld' });
		const element = invite.getChild('x');
		expect(element?.attrs.xmlns).toBe('http://jabber.org/protocol/muc#user');
		expect(element?.getChild('invite')?.attrs.from).toBe('diego@rc.tld');
		expect(element?.getChild('invite')?.getChildText('reason')).toBe('join us');
	});

	it('round-trips through the invite parser', () => {
		const invite = buildMediatedInvite({ roomJid: 'team@conference.rc.tld', inviterJid: 'diego@rc.tld', to: 'alice@remote.tld' });

		expect(parseMucInvite(invite, 'alice@remote.tld')).toMatchObject({
			roomJid: 'team@conference.rc.tld',
			toLocalJid: 'alice@remote.tld',
			fromJid: 'diego@rc.tld',
		});
	});
});

describe('parseJoinPresence', () => {
	it('parses a MUC join', () => {
		const parsed = parseJoinPresence(
			p("<presence from='bob@remote.tld/pc' to='team@conference.rc.tld/bob'><x xmlns='http://jabber.org/protocol/muc'/></presence>"),
		);
		expect(parsed).toEqual({ roomJid: 'team@conference.rc.tld', nick: 'bob' });
	});

	it('ignores presence without the MUC namespace', () => {
		expect(parseJoinPresence(p("<presence from='bob@remote.tld/pc' to='team@conference.rc.tld/bob'/>"))).toBeUndefined();
	});

	it('ignores unavailable presence', () => {
		expect(
			parseJoinPresence(
				p(
					"<presence type='unavailable' from='bob@remote.tld/pc' to='team@conference.rc.tld/bob'><x xmlns='http://jabber.org/protocol/muc'/></presence>",
				),
			),
		).toBeUndefined();
	});
});

describe('parseMucInvite', () => {
	it('parses a direct (XEP-0249) invite', () => {
		const invite = parseMucInvite(
			p(
				"<message from='alice@remote.tld' to='bob@rc.tld'><x xmlns='jabber:x:conference' jid='team@conference.remote.tld' reason='join us'/></message>",
			),
			'bob@rc.tld',
		);
		expect(invite).toMatchObject({
			roomJid: 'team@conference.remote.tld',
			toLocalJid: 'bob@rc.tld',
			fromJid: 'alice@remote.tld',
			reason: 'join us',
		});
	});

	it('parses a mediated (XEP-0045) invite', () => {
		const invite = parseMucInvite(
			p(
				"<message from='team@conference.remote.tld' to='bob@rc.tld'><x xmlns='http://jabber.org/protocol/muc#user'><invite from='alice@remote.tld'><reason>hi</reason></invite></x></message>",
			),
			'bob@rc.tld',
		);
		expect(invite).toMatchObject({ roomJid: 'team@conference.remote.tld', fromJid: 'alice@remote.tld', reason: 'hi' });
	});

	it('returns undefined for a plain message', () => {
		expect(parseMucInvite(p("<message from='a@x' to='b@y'><body>hi</body></message>"), 'b@y')).toBeUndefined();
	});
});
