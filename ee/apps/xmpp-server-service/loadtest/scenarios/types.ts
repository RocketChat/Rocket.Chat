import type { Peer } from '../peers';

export type ScenarioContext = {
	peers: Peer[];
	rcDomain: string;
	/** Local usernames that remote users address. */
	localUsers: string[];
	remoteUsersPerDomain: number;
	occupants: number;
	/** JID of the hosted room the muc scenario posts into. */
	roomJid?: string;
	/** Stanza id of a load message; the completeness check matches persisted messages by it. */
	nextId(): string;
	warmupId(): string;
	/** Resolves once the service has finished handling `count` more of `events` than when `action` started. */
	expectHandled(events: string[], count: number, action: () => Promise<void>): Promise<void>;
	/** Resolves once nothing is in flight in the service. */
	waitForIdle(): Promise<void>;
};

export type Scenario = {
	name: string;
	/** The `/stats` events one send turns into. */
	eventKeys: string[];
	/** Sends that should each end up as one persisted message. */
	readonly persistedSends: number;
	warmup(): Promise<void>;
	send(): Promise<void>;
	/** Scenario-specific measurements for the step that just ended; resets them. */
	takeStepExtras?(): Record<string, number | undefined>;
	teardown?(): Promise<void>;
};

export type RemoteUser = { peer: Peer; jid: string; localJid: string };

/** Remote users interleaved across peers, each pinned to one local user so its DM already exists after warm-up. */
export function remoteUsers(ctx: ScenarioContext): RemoteUser[] {
	const users: RemoteUser[] = [];
	for (let j = 0; j < ctx.remoteUsersPerDomain; j++) {
		for (const peer of ctx.peers) {
			const local = ctx.localUsers[users.length % ctx.localUsers.length];
			users.push({ peer, jid: `u${j}@${peer.domain}`, localJid: `${local}@${ctx.rcDomain}` });
		}
	}
	return users;
}

/** Sends one DM per remote user so the remote users and their DM rooms exist before load starts. */
export async function warmUpDirectMessages(ctx: ScenarioContext, users: RemoteUser[]): Promise<void> {
	await ctx.expectHandled(['message.received'], users.length, async () => {
		await Promise.all(
			users.map(({ peer, jid, localJid }) =>
				peer.server.sendChatMessage({ from: jid, to: localJid, body: 'load-test warm-up', id: ctx.warmupId() }),
			),
		);
	});
}

export const percentileOf = (sorted: number[], percentile: number): number | undefined =>
	sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * percentile))] : undefined;
