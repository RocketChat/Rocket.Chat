import type { Scenario, ScenarioContext } from './types';
import { remoteUsers, warmUpDirectMessages } from './types';

/** Remote users flip between online and away, so every stanza is a real status change. */
export function presenceScenario(ctx: ScenarioContext): Scenario {
	const users = remoteUsers(ctx);
	const away = new Set<string>();
	let cursor = 0;

	return {
		name: 'presence',
		eventKeys: ['presence.received'],
		persistedSends: 0,
		// The service ignores presence from remote users it has never materialized
		warmup: () => warmUpDirectMessages(ctx, users),
		send() {
			const { peer, jid, localJid } = users[cursor++ % users.length];
			const goAway = !away.delete(jid);
			if (goAway) {
				away.add(jid);
			}
			return peer.server.sendPresence({ from: jid, to: localJid, availability: 'available', show: goAway ? 'away' : undefined });
		},
	};
}
