import { parse } from 'ltx';
import type Element from 'ltx/lib/Element';

import { RemoteMucSession } from './RemoteMucSession';
import type { RemoteMucSessionDeps } from './RemoteMucSession';

const NS_MUC = 'http://jabber.org/protocol/muc';
const NS_CORRECT = 'urn:xmpp:message-correct:0';

const p = (xmlString: string): Element => parse(xmlString) as unknown as Element;

const createSession = (overrides: Partial<RemoteMucSessionDeps> = {}): { session: RemoteMucSession; sent: Element[] } => {
	const sent: Element[] = [];
	const session = new RemoteMucSession({
		roomJid: 'team@conference.remote.tld',
		localJid: 'alice@rc.tld',
		nick: 'alice',
		send: async (stanza) => {
			sent.push(stanza);
		},
		onJoined: () => undefined,
		onJoinFailed: () => undefined,
		onOccupantJoined: () => undefined,
		onOccupantLeft: () => undefined,
		onMessage: () => undefined,
		...overrides,
	});
	return { session, sent };
};

const joinStanza = async (maxHistoryStanzas?: number): Promise<Element> => {
	const { session, sent } = createSession({ maxHistoryStanzas });
	await session.join();
	return sent[0];
};

describe('RemoteMucSession', () => {
	it('leaves discussion history to the room default when no cap is given', async () => {
		const presence = await joinStanza();

		expect(presence.attrs.to).toBe('team@conference.remote.tld/alice');
		expect(presence.getChild('x', NS_MUC)?.getChild('history')).toBeUndefined();
	});

	it('asks the room to cap the discussion history it replays on join', async () => {
		const presence = await joinStanza(0);

		expect(presence.getChild('x', NS_MUC)?.getChild('history')?.attrs.maxstanzas).toBe('0');
	});

	it('sends a correction with the id of the message it replaces', async () => {
		const { session, sent } = createSession();

		await session.sendMessage({ body: 'hi, fixed', id: 'm2', replaceId: 'm1' });

		expect(sent[0].attrs).toMatchObject({ to: 'team@conference.remote.tld', type: 'groupchat', id: 'm2' });
		expect(sent[0].getChild('replace', NS_CORRECT)?.attrs.id).toBe('m1');
	});

	it('reports the message a received correction replaces', () => {
		const onMessage = jest.fn();
		const { session } = createSession({ onMessage });

		session.handleMessage(
			p(
				"<message from='team@conference.remote.tld/bob' type='groupchat' id='m2'><body>fixed</body><replace id='m1' xmlns='urn:xmpp:message-correct:0'/></message>",
			),
		);

		expect(onMessage).toHaveBeenCalledWith(expect.objectContaining({ fromNick: 'bob', body: 'fixed', id: 'm2', replaceId: 'm1' }));
	});

	it('reports the id attribute a correction references and the XEP-0421 occupant id, whatever id the room assigned (message-corrections R4)', () => {
		const onMessage = jest.fn();
		const { session } = createSession({ onMessage });

		session.handleMessage(
			p(
				"<message from='team@conference.remote.tld/bob' type='groupchat' id='m1'><body>hi</body><origin-id xmlns='urn:xmpp:sid:0' id='o1'/><stanza-id xmlns='urn:xmpp:sid:0' id='room-id' by='team@conference.remote.tld'/><occupant-id xmlns='urn:xmpp:occupant-id:0' id='occ-bob'/></message>",
			),
		);

		expect(onMessage).toHaveBeenCalledWith(
			expect.objectContaining({ id: 'room-id', originId: 'o1', senderId: 'm1', occupantId: 'occ-bob' }),
		);
	});

	it('reports the id the sender gave a message alongside the one the room assigned (message-deduplication R2, R3)', () => {
		const onMessage = jest.fn();
		const { session } = createSession({ onMessage });

		session.handleMessage(
			p(
				"<message from='team@conference.remote.tld/bob' type='groupchat' id='rc-msg-id'><body>hi</body><stanza-id xmlns='urn:xmpp:sid:0' id='room-id' by='team@conference.remote.tld'/></message>",
			),
		);

		expect(onMessage).toHaveBeenCalledWith(expect.objectContaining({ id: 'room-id', originId: 'rc-msg-id' }));
	});

	describe('real JIDs of occupants (remote-muc R6)', () => {
		const occupantPresence = (nick: string, item: string, type?: string): Element =>
			p(
				`<presence from='team@conference.remote.tld/${nick}'${type ? ` type='${type}'` : ''}><x xmlns='http://jabber.org/protocol/muc#user'><item ${item} affiliation='member' role='participant'/></x></presence>`,
			);

		it('knows the real JID a non-anonymous room discloses for a nick', () => {
			const { session } = createSession();

			session.handlePresence(occupantPresence('bob', "jid='bob@remote.tld/phone'"));

			expect(session.realJidOf('bob')).toBe('bob@remote.tld/phone');
		});

		it('knows no real JID when a semi-anonymous room hides it', () => {
			const { session } = createSession();

			session.handlePresence(occupantPresence('bob', ''));

			expect(session.realJidOf('bob')).toBeUndefined();
		});

		it('forgets the real JID once the occupant leaves, so a later holder of the nick is not taken for them', () => {
			const { session } = createSession();

			session.handlePresence(occupantPresence('bob', "jid='bob@remote.tld/phone'"));
			session.handlePresence(occupantPresence('bob', "jid='bob@remote.tld/phone'", 'unavailable'));

			expect(session.realJidOf('bob')).toBeUndefined();
		});
	});

	it('prefers the XEP-0359 origin id over the stanza id as the sender id', () => {
		const onMessage = jest.fn();
		const { session } = createSession({ onMessage });

		session.handleMessage(
			p(
				"<message from='team@conference.remote.tld/bob' type='groupchat' id='client-id'><body>hi</body><origin-id xmlns='urn:xmpp:sid:0' id='origin'/></message>",
			),
		);

		expect(onMessage).toHaveBeenCalledWith(expect.objectContaining({ id: 'client-id', originId: 'origin' }));
	});
});
