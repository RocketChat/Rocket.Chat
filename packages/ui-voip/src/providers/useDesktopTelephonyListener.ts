import { useEffect, useState } from 'react';

import type { PeerInfo, SessionState } from '../context/definitions';

type TelephonyControls = {
	sessionState: SessionState;
	toggleWidget: (peerInfo?: PeerInfo) => void;
	selectPeer: (peerInfo: PeerInfo) => void;
};

/**
 * Listens for `tel:`/`callto:` deeplink and global-shortcut phone numbers forwarded
 * by the Rocket.Chat Desktop app via `window.RocketChatDesktop.onTelephonyCallRequested`,
 * and pre-populates the media-call widget with the number (the user still starts the call).
 *
 * Delivery is consume-once: the Desktop app buffers a cold-start deeplink and hands it over
 * synchronously inside the *first* `onTelephonyCallRequested(cb)` call after the buffer is
 * ready. So we register exactly once, at mount, against a stable callback that only *stores*
 * the number — gating registration on subsystem readiness would lose that one-shot delivery.
 * Acting on the number (opening the dial pad) is deferred to a separate effect that waits
 * until the widget is idle, decoupling delivery from the volatile media-session state.
 *
 * Routing once a number is pending:
 * - `closed`  -> open the widget pre-filled with the number
 * - `new`     -> widget already open and idle -> just set the number
 * - otherwise -> a call is in progress, ignore the request
 *
 * The pending number is cleared as soon as it is handled, so applying it can never loop and
 * dismissing the widget afterwards cannot re-open it.
 *
 * The number is forwarded as-is; the Desktop app already strips formatting characters and
 * no validation is applied on the dial-pad input (see DMV-1 / DMV-6).
 */
export const useDesktopTelephonyListener = ({ sessionState, toggleWidget, selectPeer }: TelephonyControls) => {
	const [pendingNumber, setPendingNumber] = useState<string | undefined>(undefined);

	useEffect(() => {
		if (typeof window.RocketChatDesktop?.onTelephonyCallRequested !== 'function') {
			return;
		}

		window.RocketChatDesktop.onTelephonyCallRequested(({ phoneNumber }) => {
			setPendingNumber(phoneNumber);
		});
	}, []);

	useEffect(() => {
		if (pendingNumber === undefined) {
			return;
		}

		const peerInfo: PeerInfo = { number: pendingNumber };

		switch (sessionState.state) {
			case 'closed':
				toggleWidget(peerInfo);
				break;
			case 'new':
				selectPeer(peerInfo);
				break;
			default:
				break;
		}

		setPendingNumber(undefined);
	}, [pendingNumber, sessionState.state, toggleWidget, selectPeer]);
};
