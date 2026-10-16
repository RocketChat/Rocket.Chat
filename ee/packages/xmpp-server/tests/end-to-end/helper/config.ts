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
	ddpUrl: optional('XMPP_E2E_RC_DDP_URL', apiUrl),
	serviceUrl: optional('XMPP_E2E_SERVICE_URL', 'http://localhost:3039').replace(/\/$/, ''),
};

const FEDERATION_SETTLE_MS = 15_000;
const POLL_INTERVAL_MS = 500;
export const federationPolling = { delayMs: POLL_INTERVAL_MS, retries: FEDERATION_SETTLE_MS / POLL_INTERVAL_MS };

export const DUPLICATE_SETTLE_MS = 3000;

/** Suffix that keeps names unique across runs, so leftovers of an aborted run never collide. */
export const uniqueSuffix = (): string => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** The same JID with its domain in upper case, as a user might type it. */
export const withUppercaseDomain = (jid: string): string => {
	const at = jid.lastIndexOf('@');
	return `${jid.slice(0, at)}@${jid.slice(at + 1).toUpperCase()}`;
};
