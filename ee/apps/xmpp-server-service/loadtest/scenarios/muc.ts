import type { Peer } from '../peers';
import type { Scenario, ScenarioContext } from './types';
import { percentileOf } from './types';

type Occupant = { peer: Peer; localJid: string; nick: string };

const JOIN_TIMEOUT_MS = 30_000;

/**
 * Remote occupants post groupchat messages into a room Rocket.Chat hosts. The room
 * reflects each one to every occupant, so the echoes the peers get back also measure
 * the XMPP-side round trip.
 */
export function mucScenario(ctx: ScenarioContext): Scenario {
	const { roomJid } = ctx;
	if (!roomJid) {
		throw new Error('The muc scenario needs a hosted room');
	}

	const occupants: Occupant[] = Array.from({ length: ctx.occupants }, (_, k) => {
		const peer = ctx.peers[k % ctx.peers.length];
		return { peer, localJid: `occ${k}@${peer.domain}`, nick: `lt-occ-${k}` };
	});

	let cursor = 0;
	let persistedSends = 0;
	const echoLatencies: number[] = [];

	for (const peer of new Set(occupants.map((occupant) => occupant.peer))) {
		peer.server.on('muc.remoteMessage', ({ roomJid: from, body }) => {
			const sentAt = from === roomJid && Number(/^load (\d+)$/.exec(body)?.[1]);
			if (sentAt) {
				echoLatencies.push(Date.now() - sentAt);
			}
		});
	}

	const join = ({ peer, localJid, nick }: Occupant): Promise<void> =>
		new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				cleanup();
				reject(new Error(`${localJid} did not get into ${roomJid} within ${JOIN_TIMEOUT_MS} ms`));
			}, JOIN_TIMEOUT_MS);
			const offJoined = peer.server.on('muc.remoteJoined', (event) => {
				if (event.localJid === localJid && event.roomJid === roomJid) {
					cleanup();
					resolve();
				}
			});
			const offFailed = peer.server.on('muc.remoteJoinFailed', (event) => {
				if (event.localJid === localJid && event.roomJid === roomJid) {
					cleanup();
					reject(new Error(`${localJid} could not join ${roomJid}: ${event.condition}`));
				}
			});
			const cleanup = () => {
				clearTimeout(timer);
				offJoined();
				offFailed();
			};
			peer.server.mucJoinRemoteRoom({ localJid, roomJid, nick, maxHistoryStanzas: 0 }).catch((error: Error) => {
				cleanup();
				reject(error);
			});
		});

	return {
		name: 'muc',
		eventKeys: ['muc.messageReceived'],
		get persistedSends() {
			return persistedSends;
		},
		async warmup() {
			await Promise.all(occupants.map(join));
			// Each join materializes a remote user and a subscription on the Rocket.Chat side
			await ctx.waitForIdle();
			echoLatencies.length = 0;
		},
		send() {
			const { peer, localJid } = occupants[cursor++ % occupants.length];
			persistedSends++;
			return peer.server.mucSendToRemoteRoom({ localJid, roomJid, body: `load ${Date.now()}`, id: ctx.nextId() });
		},
		takeStepExtras() {
			const sorted = echoLatencies.splice(0).sort((a, b) => a - b);
			return { echoes: sorted.length, echoP50Ms: percentileOf(sorted, 0.5), echoP99Ms: percentileOf(sorted, 0.99) };
		},
		// Occupants left behind would keep receiving every later message of the room from a dead peer
		async teardown() {
			await Promise.all(
				occupants.map(({ peer, localJid }) => peer.server.mucLeaveRemoteRoom({ localJid, roomJid }).catch(() => undefined)),
			);
		},
	};
}
