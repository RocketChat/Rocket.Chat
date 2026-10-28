import { parse } from 'ltx';
import type Element from 'ltx/lib/Element';

import { getSubscriptionType, parseAvailabilityPresence, parseChatMessage } from './parse';

const p = (xmlString: string): Element => parse(xmlString) as unknown as Element;

describe('parseChatMessage', () => {
	it('parses body, thread and id', () => {
		const message = parseChatMessage(p("<message from='a@x' to='b@y' type='chat' id='1'><body>hi</body><thread>t1</thread></message>"));
		expect(message).toMatchObject({ from: 'a@x', to: 'b@y', body: 'hi', id: '1', thread: 't1' });
	});

	it('treats a typeless message with a body as chat', () => {
		expect(parseChatMessage(p("<message from='a@x' to='b@y'><body>hi</body></message>"))?.body).toBe('hi');
	});

	it('returns undefined for groupchat, error, and bodyless messages', () => {
		expect(parseChatMessage(p("<message from='a@x' to='b@y' type='groupchat'><body>hi</body></message>"))).toBeUndefined();
		expect(parseChatMessage(p("<message from='a@x' to='b@y' type='error'><body>hi</body></message>"))).toBeUndefined();
		expect(parseChatMessage(p("<message from='a@x' to='b@y' type='chat'><composing/></message>"))).toBeUndefined();
	});

	it('captures a XEP-0308 correction id', () => {
		const message = parseChatMessage(
			p("<message from='a@x' to='b@y' type='chat'><body>fixed</body><replace id='old1' xmlns='urn:xmpp:message-correct:0'/></message>"),
		);
		expect(message?.replaceId).toBe('old1');
	});
});

describe('parseAvailabilityPresence', () => {
	it('parses available presence with show/status', () => {
		const presence = parseAvailabilityPresence(p("<presence from='a@x' to='b@y'><show>dnd</show><status>busy</status></presence>"));
		expect(presence).toMatchObject({ availability: 'available', show: 'dnd', status: 'busy' });
	});

	it('parses unavailable presence', () => {
		expect(parseAvailabilityPresence(p("<presence from='a@x' to='b@y' type='unavailable'/>"))?.availability).toBe('unavailable');
	});

	it('drops invalid show values', () => {
		expect(parseAvailabilityPresence(p("<presence from='a@x' to='b@y'><show>bogus</show></presence>"))?.show).toBeUndefined();
	});

	it('returns undefined for subscription presence', () => {
		expect(parseAvailabilityPresence(p("<presence from='a@x' to='b@y' type='subscribe'/>"))).toBeUndefined();
	});
});

describe('getSubscriptionType', () => {
	it.each(['subscribe', 'subscribed', 'unsubscribe', 'unsubscribed'] as const)('recognizes %s', (type) => {
		expect(getSubscriptionType(p(`<presence from='a@x' to='b@y' type='${type}'/>`))).toBe(type);
	});

	it('returns undefined for availability presence', () => {
		expect(getSubscriptionType(p("<presence from='a@x' to='b@y'/>"))).toBeUndefined();
	});
});
