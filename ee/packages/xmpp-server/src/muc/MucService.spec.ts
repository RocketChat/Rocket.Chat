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
	events.on('muc.inviteReceived', (invite) => invites.push(invite));
	const muc = new MucService({
		config: resolveConfig({ domain: 'rc.tld', requireTls: false, logger: silentLogger }),
		events,
		logger: silentLogger,
		send: () => undefined,
	});
	return { muc, invites };
}

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
