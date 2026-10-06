import type { Scenario, ScenarioContext } from './types';
import { remoteUsers, warmUpDirectMessages } from './types';

/** Remote users send 1:1 chat messages to local users. */
export function dmScenario(ctx: ScenarioContext): Scenario {
	const users = remoteUsers(ctx);
	let cursor = 0;
	let persistedSends = 0;

	return {
		name: 'dm',
		eventKeys: ['message.received'],
		get persistedSends() {
			return persistedSends;
		},
		warmup: () => warmUpDirectMessages(ctx, users),
		send() {
			const { peer, jid, localJid } = users[cursor++ % users.length];
			persistedSends++;
			return peer.server.sendChatMessage({ from: jid, to: localJid, body: `load ${Date.now()}`, id: ctx.nextId() });
		},
	};
}
