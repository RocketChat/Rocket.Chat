import assert from 'node:assert/strict';

import { Cleanup } from './cleanup';
import { config, federationPolling } from './config';
import { connectRocketChat, forgetRemoteUserOnCleanup } from './rocketchat';
import type { RocketChat } from './rocketchat';
import { XmppUser } from './xmpp-client';
import { retry } from '../../../../../../apps/meteor/tests/data/retry';

/** Connects to Rocket.Chat and returns the suite's context; pass it to `teardown` when done. */
export async function setupSuite(): Promise<RocketChat> {
	await assertServiceForwards();
	return connectRocketChat(new Cleanup());
}

async function assertServiceForwards(): Promise<void> {
	const stats = await serviceStats();
	if (stats?.decodeOnly) {
		throw new Error(`xmpp-server-service at ${config.serviceUrl} runs with XMPP_DECODE_ONLY=true; restart it without that variable`);
	}
}

export type ServiceStats = {
	decodeOnly: boolean;
	decoded: Record<string, number>;
	completed: Record<string, number>;
	failed: Record<string, number>;
};

/** The service's `/stats`, or undefined when XMPP_E2E_SERVICE_URL does not answer. */
export async function serviceStats(): Promise<ServiceStats | undefined> {
	try {
		const res = await fetch(`${config.serviceUrl}/stats`, { signal: AbortSignal.timeout(2000) });
		return res.ok ? ((await res.json()) as ServiceStats) : undefined;
	} catch {
		return undefined;
	}
}

/** Resolves once the service has finished handling every event of this kind it decoded so far. */
export async function waitUntilHandled(event: string): Promise<void> {
	await retry(
		`every decoded ${event} to be handled`,
		async () => {
			const stats = await serviceStats();
			assert.ok(stats, `${config.serviceUrl}/stats does not answer`);
			const decoded = stats.decoded[event] ?? 0;
			const handled = (stats.completed[event] ?? 0) + (stats.failed?.[event] ?? 0);
			assert.equal(handled, decoded, `${handled} of ${decoded} handled`);
		},
		federationPolling,
	);
}

/**
 * Registers an account on the XMPP server and, on cleanup, also deletes the local record
 * Rocket.Chat materializes for it once it federates.
 */
export async function registerXmppUser(rc: RocketChat, label: string): Promise<XmppUser> {
	const user = await XmppUser.register(label, rc.cleanup);
	forgetRemoteUserOnCleanup(rc, user.bareJid);
	return user;
}

/** A ping answered by Rocket.Chat proves S2S works in both directions between the two servers. */
export async function assertFederationReachable(rc: RocketChat, user: XmppUser): Promise<void> {
	try {
		await user.ping(rc.domain);
	} catch (error) {
		throw new Error(
			`${config.xmpp.domain} cannot reach Rocket.Chat's XMPP domain ${rc.domain} over S2S. Check that xmpp-server-service is running, ` +
				`that both servers resolve each other's domain and MUC subdomain (DNS or XMPP_DNS_OVERRIDES), and that dialback is enabled.`,
			{ cause: error },
		);
	}
}
