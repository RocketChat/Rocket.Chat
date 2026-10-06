import { apiUrl } from '../../../../../../apps/meteor/tests/data/api-data';

const optional = (name: string, fallback: string): string => process.env[name]?.trim() || fallback;

const required = (name: string, hint: string): string => {
	const value = process.env[name]?.trim();
	if (!value) {
		throw new Error(`${name} is required (${hint})`);
	}
	return value;
};

const xmppDomain = required('XMPP_E2E_XMPP_DOMAIN', 'the domain served by the XMPP server under test, e.g. xmpp.host');

/**
 * Where the suite finds the XMPP side. Rocket.Chat is reached like every other e2e suite in the repo
 * (TEST_API_URL and the test admin); its own XMPP domain is read from its settings at runtime.
 */
export const config = {
	xmpp: {
		service: optional('XMPP_E2E_XMPP_SERVICE', 'xmpp://localhost:5222'),
		domain: xmppDomain,
		mucDomain: optional('XMPP_E2E_XMPP_MUC_DOMAIN', `conference.${xmppDomain}`),
	},
	// With microservices the DDP streamer, not Meteor, owns websocket sessions and presence
	ddpUrl: optional('XMPP_E2E_RC_DDP_URL', apiUrl),
	serviceUrl: optional('XMPP_E2E_SERVICE_URL', 'http://localhost:3039').replace(/\/$/, ''),
};

/** Federation is asynchronous on both hops; this is how long the suite waits for it to settle. */
export const polling = { retries: 30, delayMs: 500 };

/** Suffix that keeps names unique across runs, so leftovers of an aborted run never collide. */
export const uniqueSuffix = (): string => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
