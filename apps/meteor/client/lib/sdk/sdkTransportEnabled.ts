const KEY = 'sdk_transport';
const META_NAME = 'rc-sdk-transport-enabled';

/**
 * Runtime flag that gates the SDK-over-DDP transport migration. Three sources,
 * checked in order:
 *   1. URL parameter `?sdk_transport=on|off` — per-tab override (highest).
 *   2. `rc-config-sdk_transport` in localStorage — persisted per-user opt-in.
 *   3. `<meta name="rc-sdk-transport-enabled" content="on|off">` injected by
 *      the server from the `SDK_DDP_Transport_Enabled` admin setting — global
 *      opt-in / kill-switch.
 *
 * Default is `false` (legacy Meteor DDP transport) when none of the three
 * resolves, so the migration ships dormant for staged rollout.
 */
export const isSdkTransportEnabled = (): boolean => {
	if (typeof window === 'undefined') return false;
	try {
		const fromUrl = new URLSearchParams(window.location.search).get(KEY);
		if (fromUrl === 'on') return true;
		if (fromUrl === 'off') return false;
		if (window.localStorage.getItem(`rc-config-${KEY}`) === 'on') return true;
		const meta = window.document?.querySelector(`meta[name="${META_NAME}"]`);
		return meta?.getAttribute('content') === 'on';
	} catch {
		return false;
	}
};
