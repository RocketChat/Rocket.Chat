import type Element from 'ltx/lib/Element';

import type { MucRemoteOccupant } from '../events';
import { splitOccupantJid } from './stanzas';
import { xml } from '../xml/build';
import { NS_MUC, NS_MUC_USER, NS_SID } from '../xml/namespaces';

const REMOTE_RESOURCE = 'rocketchat';

export type RemoteMucSessionState = 'joining' | 'joined' | 'leaving' | 'closed';

export type RemoteMucSessionDeps = {
	/** Remote room JID: `room@conference.remote.tld`. */
	roomJid: string;
	/** The bare JID of the local user joining on whose behalf we act. */
	localJid: string;
	nick: string;
	send: (stanza: Element) => Promise<void>;
	onJoined: (occupants: MucRemoteOccupant[]) => void;
	onJoinFailed: (condition: string) => void;
	onOccupantJoined: (occupant: MucRemoteOccupant) => void;
	onOccupantLeft: (nick: string) => void;
	onMessage: (params: { fromNick: string; body: string; id?: string; raw: Element }) => void;
};

/**
 * The client side of joining a MUC hosted on a remote server, on behalf of a
 * local Rocket.Chat user. We use a fixed resource since we control the full JID.
 */
export class RemoteMucSession {
	state: RemoteMucSessionState = 'closed';

	private readonly occupants = new Map<string, MucRemoteOccupant>();

	constructor(private readonly deps: RemoteMucSessionDeps) {}

	private get occupantJid(): string {
		return `${this.deps.localJid.split('/')[0].split('@')[0]}@${this.deps.localJid.split('@')[1]}/${REMOTE_RESOURCE}`;
	}

	async join(): Promise<void> {
		this.state = 'joining';
		await this.deps.send(
			xml('presence', { from: this.occupantJid, to: `${this.deps.roomJid}/${this.deps.nick}` }, xml('x', { xmlns: NS_MUC })),
		);
	}

	async leave(): Promise<void> {
		this.state = 'leaving';
		await this.deps.send(xml('presence', { from: this.occupantJid, to: `${this.deps.roomJid}/${this.deps.nick}`, type: 'unavailable' }));
		this.state = 'closed';
	}

	async sendMessage(params: { body: string; id?: string }): Promise<void> {
		await this.deps.send(
			xml('message', { from: this.occupantJid, to: this.deps.roomJid, type: 'groupchat', id: params.id }, xml('body', {}, params.body)),
		);
	}

	handlePresence(presence: Element): void {
		const [roomJid, nick] = splitOccupantJid(presence.attrs.from ?? '');
		if (roomJid !== this.deps.roomJid || !nick) {
			return;
		}

		if (presence.attrs.type === 'error') {
			if (this.state === 'joining') {
				this.state = 'closed';
				this.deps.onJoinFailed(presence.getChild('error')?.getChildElements()[0]?.name ?? 'unknown');
			}
			return;
		}

		const userX = presence.getChild('x', NS_MUC_USER);
		const item = userX?.getChild('item');
		const occupant: MucRemoteOccupant = {
			nick,
			jid: item?.attrs.jid,
			role: item?.attrs.role ?? 'participant',
			affiliation: item?.attrs.affiliation ?? 'none',
		};

		if (presence.attrs.type === 'unavailable') {
			this.occupants.delete(nick);
			this.deps.onOccupantLeft(nick);
			return;
		}

		this.occupants.set(nick, occupant);

		const isSelf = userX?.getChildren('status').some((status) => status.attrs.code === '110') ?? false;
		if (isSelf && this.state === 'joining') {
			this.state = 'joined';
			this.deps.onJoined([...this.occupants.values()]);
		} else if (this.state === 'joined') {
			this.deps.onOccupantJoined(occupant);
		}
	}

	handleMessage(message: Element): void {
		const [roomJid, nick] = splitOccupantJid(message.attrs.from ?? '');
		const body = message.getChildText('body');
		if (roomJid !== this.deps.roomJid || !nick || !body) {
			return;
		}
		// Skip our own reflected messages
		if (nick === this.deps.nick) {
			return;
		}
		// Every local member holds a session, so the same message arrives once per member:
		// prefer the room-assigned XEP-0359 id, which makes deduplication reliable.
		const stanzaId = message.getChild('stanza-id', NS_SID)?.attrs.id ?? message.attrs.id;
		this.deps.onMessage({ fromNick: nick, body, id: stanzaId, raw: message });
	}

	markStale(): void {
		this.state = 'closed';
		this.occupants.clear();
	}
}
