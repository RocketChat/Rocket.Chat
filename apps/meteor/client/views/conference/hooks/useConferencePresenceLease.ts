import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { PRESENCE_HEARTBEAT_MS } from '../../../../lib/videoConference/presence';

/**
 * Keeps telling the server this window is still in the call.
 *
 * The counterpart of reporting a departure, and the half that copes with not being able to. A leave has to be sent
 * at the one moment it is hardest to send anything — the workspace may be down while the call carries on in the
 * provider, the tab may be being killed — so leaving is inferred from these renewals stopping instead. Nothing has
 * to arrive at the moment someone goes; what matters is that nothing arrives afterwards.
 *
 * This works for every provider precisely because it is not about the provider: this window is ours whether the
 * call is rendered in it or handed to an iframe, so it can always speak for itself.
 */
export const useConferencePresenceLease = (callId: string, active: boolean) => {
	const renew = useEndpoint('POST', '/v1/video-conference.heartbeat');

	useEffect(() => {
		if (!active) {
			return;
		}

		// A failed renewal needs no handling: it is indistinguishable from the outage this exists for, and the
		// next one — or the server's own view of who is in the provider's room — settles it.
		const renewNow = () => void renew({ callId }).catch(() => undefined);

		renewNow();
		const interval = setInterval(renewNow, PRESENCE_HEARTBEAT_MS);

		// A call is usually something you listen to while looking at another window, and browsers throttle a
		// hidden window's timers to roughly one a minute. The lease is long enough to absorb that; renewing on
		// the way back to the front is what makes coming back after being throttled harder than that immediate.
		const onVisibilityChange = () => {
			if (document.visibilityState === 'visible') {
				renewNow();
			}
		};

		document.addEventListener('visibilitychange', onVisibilityChange);

		return () => {
			clearInterval(interval);
			document.removeEventListener('visibilitychange', onVisibilityChange);
		};
	}, [active, callId, renew]);
};
