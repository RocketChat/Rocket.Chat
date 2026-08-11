import { parse } from 'ltx';
import type Element from 'ltx/lib/Element';

import { buildDiscoReply } from './disco';
import { resolveConfig } from '../config';
import type { Logger } from '../logger';

const silentLogger: Logger = {
	debug: () => undefined,
	info: () => undefined,
	warn: () => undefined,
	error: () => undefined,
	child: () => silentLogger,
};

const config = resolveConfig({ domain: 'rc.tld', requireTls: false, logger: silentLogger });
const rooms = () => [{ jid: 'team@conference.rc.tld', name: 'Team' }];
const hosted: Record<string, boolean> = { team: true, secret: false };
const describeRoom = (roomId: string) => (roomId in hosted ? { roomId, public: hosted[roomId] } : undefined);

const info = (to: string): Element =>
	parse(
		`<iq type='get' from='alice@remote.tld/pc' to='${to}' id='q1'><query xmlns='http://jabber.org/protocol/disco#info'/></iq>`,
	) as unknown as Element;

const features = (reply: Element | undefined): string[] =>
	reply
		?.getChild('query')
		?.getChildren('feature')
		.map((f) => f.attrs.var as string) ?? [];

describe('buildDiscoReply', () => {
	it('describes the server domain as a server', () => {
		const reply = buildDiscoReply(info('rc.tld'), config, rooms, describeRoom);
		expect(reply?.getChild('query')?.getChild('identity')?.attrs).toMatchObject({ category: 'server', type: 'im' });
	});

	it('describes the MUC subdomain as a conference service', () => {
		const reply = buildDiscoReply(info('conference.rc.tld'), config, rooms, describeRoom);
		expect(reply?.getChild('query')?.getChild('identity')?.attrs).toMatchObject({ category: 'conference', type: 'text' });
	});

	// A room JID used to fall through to the server branch, telling clients the room was a server
	it('describes a hosted room as a joinable groupchat', () => {
		const reply = buildDiscoReply(info('team@conference.rc.tld'), config, rooms, describeRoom);

		expect(reply?.attrs.type).toBe('result');
		expect(reply?.getChild('query')?.getChild('identity')?.attrs).toMatchObject({ category: 'conference', type: 'text' });
		expect(features(reply)).toEqual(expect.arrayContaining(['http://jabber.org/protocol/muc', 'muc_public', 'muc_open']));
	});

	it('marks a private room as members-only and hidden', () => {
		const reply = buildDiscoReply(info('secret@conference.rc.tld'), config, rooms, describeRoom);
		expect(features(reply)).toEqual(expect.arrayContaining(['muc_hidden', 'muc_membersonly']));
	});

	it('answers item-not-found for a room we do not host', () => {
		const reply = buildDiscoReply(info('ghost@conference.rc.tld'), config, rooms, describeRoom);
		expect(reply?.attrs.type).toBe('error');
		expect(reply?.getChild('error')?.getChild('item-not-found')).toBeDefined();
	});

	it('lists only public rooms on the service', () => {
		const items = parse(
			"<iq type='get' from='alice@remote.tld/pc' to='conference.rc.tld' id='q2'><query xmlns='http://jabber.org/protocol/disco#items'/></iq>",
		) as unknown as Element;

		const reply = buildDiscoReply(items, config, rooms, describeRoom);
		expect(
			reply
				?.getChild('query')
				?.getChildren('item')
				.map((i) => i.attrs.jid),
		).toEqual(['team@conference.rc.tld']);
	});
});
