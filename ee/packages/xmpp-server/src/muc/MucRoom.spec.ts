import { parse } from 'ltx';
import type Element from 'ltx/lib/Element';

import { MucRoom } from './MucRoom';
import type { MucRoomDeps } from './MucRoom';

const p = (xmlString: string): Element => parse(xmlString) as unknown as Element;

const ROOM = 'team@conference.rc.tld';

const join = (jid: string, nick: string) =>
	p(`<presence from='${jid}' to='${ROOM}/${nick}'><x xmlns='http://jabber.org/protocol/muc'/></presence>`);

const setup = (authorizeJoin?: MucRoomDeps['authorizeJoin']) => {
	const sent: Element[] = [];
	const events: { event: string; args: unknown[] }[] = [];
	const room = new MucRoom({
		roomJid: ROOM,
		send: (stanza) => sent.push(stanza),
		emit: (event, ...args) => events.push({ event, args }),
		authorizeJoin,
	});
	return { room, sent, events };
};

describe('MucRoom', () => {
	it('admits a first occupant with self-presence 110, and never claims 201', async () => {
		const { room, sent, events } = setup();
		await room.handleJoin(join('alice@remote.tld/pc', 'alice'));

		const selfPresence = sent.find((s) => s.attrs.to === 'alice@remote.tld/pc' && s.getChild('x')?.getChildren('status').length);
		const codes = selfPresence
			?.getChild('x')
			?.getChildren('status')
			.map((s) => s.attrs.code);
		expect(codes).toContain('110');
		// 201 would send the client into the room-creation/configuration flow for a room it did not create
		expect(codes).not.toContain('201');
		expect(events.map((e) => e.event)).toContain('occupantJoined');
		expect(room.listOccupants().map((o) => o.nick)).toEqual(['alice']);
	});

	it('closes the join with the room subject', async () => {
		const { room, sent } = setup();
		room.setSubject('release planning');
		await room.handleJoin(join('alice@remote.tld/pc', 'alice'));

		const subject = sent.find((s) => s.name === 'message' && s.getChild('subject'));
		expect(subject?.attrs).toMatchObject({ from: ROOM, to: 'alice@remote.tld/pc', type: 'groupchat' });
		expect(subject?.getChildText('subject')).toBe('release planning');
		// It must be the last thing the newcomer receives
		expect(sent.indexOf(subject as (typeof sent)[number])).toBe(sent.length - 1);
	});

	it('sends the existing roster to a newcomer and announces them to others', async () => {
		const { room, sent } = setup();
		await room.handleJoin(join('alice@remote.tld/pc', 'alice'));
		sent.length = 0;
		await room.handleJoin(join('bob@remote.tld/pc', 'bob'));

		// bob receives alice's presence
		expect(sent.some((s) => s.attrs.to === 'bob@remote.tld/pc' && s.attrs.from === `${ROOM}/alice`)).toBe(true);
		// alice is notified of bob
		expect(sent.some((s) => s.attrs.to === 'alice@remote.tld/pc' && s.attrs.from === `${ROOM}/bob`)).toBe(true);
	});

	it('rejects a nick already taken by a different JID with a conflict error', async () => {
		const { room, sent } = setup();
		await room.handleJoin(join('alice@remote.tld/pc', 'alice'));
		sent.length = 0;
		await room.handleJoin(join('mallory@remote.tld/pc', 'alice'));

		expect(sent[0].attrs.type).toBe('error');
		expect(sent[0].getChild('error')?.getChild('conflict')).toBeDefined();
		expect(room.listOccupants()).toHaveLength(1);
	});

	it('broadcasts groupchat messages to remote occupants and emits an event', async () => {
		const { room, sent, events } = setup();
		await room.handleJoin(join('alice@remote.tld/pc', 'alice'));
		await room.handleJoin(join('bob@remote.tld/pc', 'bob'));
		sent.length = 0;
		events.length = 0;

		room.handleGroupchatMessage(
			p(`<message from='alice@remote.tld/pc' to='${ROOM}' type='groupchat' id='m1'><body>hello room</body></message>`),
		);

		const delivered = sent.filter((s) => s.name === 'message' && s.getChildText('body') === 'hello room');
		expect(delivered.map((s) => s.attrs.to).sort()).toEqual(['alice@remote.tld/pc', 'bob@remote.tld/pc']);
		expect(events.find((e) => e.event === 'message')).toBeDefined();
	});

	it('does not deliver stanzas to local (virtual) occupants but keeps them in the roster', async () => {
		const { room, sent } = setup();
		room.addLocalOccupant({ nick: 'carol', realJid: 'carol@rc.tld' });
		sent.length = 0;
		await room.handleJoin(join('alice@remote.tld/pc', 'alice'));

		// carol (local) must not receive any stanza
		expect(sent.some((s) => s.attrs.to === 'carol@rc.tld')).toBe(false);
		expect(
			room
				.listOccupants()
				.map((o) => o.nick)
				.sort(),
		).toEqual(['alice', 'carol']);
	});

	it('invites a remote JID on behalf of a local member', () => {
		const { room, sent } = setup();
		room.addLocalOccupant({ nick: 'diego', realJid: 'diego@rc.tld', role: 'moderator' });
		sent.length = 0;

		room.invite({ inviteeJid: 'alice@remote.tld', inviterJid: 'diego@rc.tld', reason: 'join us' });

		expect(sent).toHaveLength(1);
		expect(sent[0].attrs).toMatchObject({ from: ROOM, to: 'alice@remote.tld' });
		expect(sent[0].getChild('x')?.getChild('invite')?.attrs.from).toBe('diego@rc.tld');
	});

	it('denies a join the authorizer rejects and applies the granted role', async () => {
		const denied = setup(async () => ({ allow: false, reason: 'members-only' }));
		await denied.room.handleJoin(join('alice@remote.tld/pc', 'alice'));

		expect(denied.sent[0].attrs.type).toBe('error');
		expect(denied.sent[0].getChild('error')?.getChild('registration-required')).toBeDefined();
		expect(denied.room.listOccupants()).toHaveLength(0);

		const allowed = setup(async () => ({ allow: true, role: 'moderator' }));
		await allowed.room.handleJoin(join('alice@remote.tld/pc', 'alice'));

		expect(allowed.room.listOccupants()[0].role).toBe('moderator');
	});

	it('finds an occupant by bare JID regardless of resource', async () => {
		const { room } = setup();
		await room.handleJoin(join('alice@remote.tld/pc', 'alice'));

		expect(room.findOccupantByJid('alice@remote.tld')?.nick).toBe('alice');
		expect(room.findOccupantByJid('mallory@remote.tld')).toBeUndefined();
	});

	it('kicks an occupant with status 307', async () => {
		const { room, sent } = setup();
		await room.handleJoin(join('alice@remote.tld/pc', 'alice'));
		await room.handleJoin(join('bob@remote.tld/pc', 'bob'));
		sent.length = 0;

		room.kick('bob');
		const kickNotice = sent.find((s) => s.attrs.to === 'alice@remote.tld/pc' && s.attrs.type === 'unavailable');
		expect(
			kickNotice
				?.getChild('x')
				?.getChildren('status')
				.map((s) => s.attrs.code),
		).toContain('307');
		expect(room.listOccupants().map((o) => o.nick)).toEqual(['alice']);
	});
});
