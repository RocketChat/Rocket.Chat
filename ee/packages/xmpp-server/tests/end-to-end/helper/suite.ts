import { Cleanup } from './cleanup';
import { config } from './config';
import { connectRocketChat, forgetRemoteUserOnCleanup } from './rocketchat';
import type { RocketChat } from './rocketchat';
import { XmppUser } from './xmpp-client';

/** Connects to Rocket.Chat and returns the suite's context; pass it to `teardown` when done. */
export async function setupSuite(): Promise<RocketChat> {
	await assertServiceForwards();
	return connectRocketChat(new Cleanup());
}

/** Reads the service's `/stats`, when reachable: a decode-only service parses traffic but never hands it to Rocket.Chat. */
async function assertServiceForwards(): Promise<void> {
	const stats = await serviceStats();
	if (stats?.decodeOnly) {
		throw new Error(`xmpp-server-service at ${config.serviceUrl} runs with XMPP_DECODE_ONLY=true; restart it without that variable`);
	}
}

export type ServiceStats = { decodeOnly: boolean; decoded: Record<string, number>; completed: Record<string, number> };

/** The service's `/stats`, or undefined when XMPP_E2E_SERVICE_URL does not answer. */
export async function serviceStats(): Promise<ServiceStats | undefined> {
	try {
		const res = await fetch(`${config.serviceUrl}/stats`, { signal: AbortSignal.timeout(2000) });
		return res.ok ? ((await res.json()) as ServiceStats) : undefined;
	} catch {
		return undefined;
	}
}

/**
 * Registers an account on the XMPP server and, on cleanup, also deletes the local record
 * Rocket.Chat materializes for it once it federates.
 */
export async function registerXmppUser(rc: RocketChat, label: string): Promise<XmppUser> {
	const user = await XmppUser.register(label, rc.cleanup);
	forgetRemoteUserOnCleanup(rc, user.jid);
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
