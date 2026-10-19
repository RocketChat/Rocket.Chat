import { Emitter } from '@rocket.chat/emitter';
import { parse } from 'ltx';
import type Element from 'ltx/lib/Element';

import { MucService } from './MucService';
import { resolveConfig } from '../config';
import type { XMPPServerEventMap } from '../events';
import type { Logger } from '../logger';

const silentLogger: Logger = {
	debug: () => undefined,
	info: () => undefined,
	warn: () => undefined,
	error: () => undefined,
	child: () => silentLogger,
};

const p = (xmlString: string): Element => parse(xmlString) as unknown as Element;

function setup() {
	const events = new Emitter<XMPPServerEventMap>();
	const invites: XMPPServerEventMap['muc.inviteReceived'][] = [];
	const sent: Element[] = [];
	events.on('muc.inviteReceived', (invite) => invites.push(invite));
	const muc = new MucService({
		config: resolveConfig({ domain: 'rc.tld', requireTls: false, logger: silentLogger }),
		events,
		logger: silentLogger,
		send: (stanza) => sent.push(stanza),
	});
	return { muc, invites, sent };
}

const errorConditionOf = (stanza: Element): string | undefined =>
	stanza.getChild('error')?.children.find((child) => typeof child !== 'string')?.name;

describe('MucService.handlePossibleInvite', () => {
	it('emits the room JID in its normalized spelling (remote-muc R1)', () => {
		const { muc, invites } = setup();
		const direct = p(
			`<message from='alice@remote.tld/phone' to='bob@rc.tld'><x xmlns='jabber:x:conference' jid='Team@Conference.Remote.TLD'/></message>`,
		);

		expect(muc.handlePossibleInvite(direct, 'bob@rc.tld')).toBe(true);
		expect(invites).toEqual([expect.objectContaining({ roomJid: 'team@conference.remote.tld' })]);
	});

	it('consumes an invite whose room JID names no room without emitting it', () => {
		const { muc, invites } = setup();
		const direct = p(
			`<message from='alice@remote.tld/phone' to='bob@rc.tld'><x xmlns='jabber:x:conference' jid='conference.remote.tld'/></message>`,
		);

		expect(muc.handlePossibleInvite(direct, 'bob@rc.tld')).toBe(true);
		expect(invites).toEqual([]);
	});

	it('emits the inviter as a normalized bare JID (remote-muc R1)', () => {
		const { muc, invites } = setup();
		const mediated = p(
			`<message from='team@conference.remote.tld' to='bob@rc.tld'><x xmlns='http://jabber.org/protocol/muc#user'><invite from='Alice@Remote.TLD/phone'/></x></message>`,
		);

		muc.handlePossibleInvite(mediated, 'bob@rc.tld');

		expect(invites).toEqual([expect.objectContaining({ fromJid: 'Alice@remote.tld' })]);
	});

	it.each([
		['names no account', 'admin'],
		['names an account on our domain', 'admin@rc.tld'],
		['names an occupant of our MUC service', 'room@conference.rc.tld'],
	])('emits the room as the inviter when the invitation %s (remote-muc R1, addressing R11)', (_, from) => {
		const { muc, invites } = setup();
		const mediated = p(
			`<message from='team@conference.remote.tld' to='bob@rc.tld'><x xmlns='http://jabber.org/protocol/muc#user'><invite from='${from}'/></x></message>`,
		);

		muc.handlePossibleInvite(mediated, 'bob@rc.tld');

		expect(invites).toEqual([expect.objectContaining({ fromJid: 'team@conference.remote.tld' })]);
	});
});

describe('MucService.listPublicRooms (service-discovery R4)', () => {
	it('lists public rooms and leaves private ones out', () => {
		const { muc } = setup();
		muc.createRoom({ roomId: 'team', public: true });
		muc.createRoom({ roomId: 'secret', public: false });

		expect(muc.listPublicRooms()).toEqual([{ jid: 'team@conference.rc.tld' }]);
	});

	it('stops listing a room that turns private', () => {
		const { muc } = setup();
		muc.createRoom({ roomId: 'team', public: true });
		muc.createRoom({ roomId: 'team', public: false });

		expect(muc.listPublicRooms()).toEqual([]);
	});
});

describe('MucService.handleStanza (hosted-muc R16)', () => {
	it('answers a message to a room that does not exist with item-not-found, consuming it', () => {
		const { muc, sent } = setup();

		expect(
			muc.handleStanza(
				p(`<message from='alice@remote.tld/pc' to='team@conference.rc.tld/bob' type='chat' id='m1'><body>hi</body></message>`),
			),
		).toBe(true);
		expect(sent.map(errorConditionOf)).toEqual(['item-not-found']);
		expect(sent[0].attrs).toMatchObject({ to: 'alice@remote.tld/pc', type: 'error', id: 'm1' });
	});

	it('answers a private message in an existing room with feature-not-implemented, consuming it', () => {
		const { muc, sent } = setup();
		muc.createRoom({ roomId: 'team' });

		expect(
			muc.handleStanza(p(`<message from='alice@remote.tld/pc' to='team@conference.rc.tld/bob' type='chat'><body>hi</body></message>`)),
		).toBe(true);
		expect(sent.map(errorConditionOf)).toEqual(['feature-not-implemented']);
	});

	it('refuses a join to a room that does not exist with forbidden (R4)', () => {
		const { muc, sent } = setup();

		expect(muc.handleStanza(p(`<presence from='alice@remote.tld/pc' to='ghost@conference.rc.tld/alice'/>`))).toBe(true);
		expect(sent.map(errorConditionOf)).toEqual(['forbidden']);
	});

	it.each([['subscribe'], ['probe'], ['subscribed'], ['unsubscribe']])(
		'treats a %s presence to a room as no join, answering nothing',
		(type) => {
			const { muc, sent } = setup();
			muc.createRoom({ roomId: 'team' });

			expect(muc.handleStanza(p(`<presence from='alice@remote.tld/pc' to='team@conference.rc.tld/alice' type='${type}'/>`))).toBe(true);
			expect(sent).toEqual([]);
		},
	);

	it('never answers an error stanza', () => {
		const { muc, sent } = setup();

		expect(muc.handleStanza(p(`<message from='alice@remote.tld/pc' to='ghost@conference.rc.tld' type='error'/>`))).toBe(true);
		expect(sent).toEqual([]);
	});

	it('leaves IQs to the router', () => {
		const { muc } = setup();

		expect(muc.handleStanza(p(`<iq from='alice@remote.tld/pc' to='team@conference.rc.tld' type='get' id='q1'/>`))).toBe(false);
	});
});
