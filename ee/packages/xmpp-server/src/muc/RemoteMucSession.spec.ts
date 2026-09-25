import type Element from 'ltx/lib/Element';

import { RemoteMucSession } from './RemoteMucSession';

const NS_MUC = 'http://jabber.org/protocol/muc';

const joinStanza = async (maxHistoryStanzas?: number): Promise<Element> => {
	const sent: Element[] = [];
	const session = new RemoteMucSession({
		roomJid: 'team@conference.remote.tld',
		localJid: 'alice@rc.tld',
		nick: 'alice',
		maxHistoryStanzas,
		send: async (stanza) => {
			sent.push(stanza);
		},
		onJoined: () => undefined,
		onJoinFailed: () => undefined,
		onOccupantJoined: () => undefined,
		onOccupantLeft: () => undefined,
		onMessage: () => undefined,
	});
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
});
