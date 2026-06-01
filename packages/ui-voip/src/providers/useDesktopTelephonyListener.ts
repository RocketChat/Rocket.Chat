import { useEffect, useRef } from 'react';

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
 * Routing by current widget state:
 * - `closed`  -> open the widget pre-filled with the number
 * - `new`     -> widget already open and idle -> just set the number
 * - otherwise -> a call is in progress, ignore the request
 *
 * The number is forwarded as-is; the Desktop app already strips formatting characters and
 * no validation is applied on the dial-pad input (see DMV-1 / DMV-6).
 */
export const useDesktopTelephonyListener = ({ sessionState, toggleWidget, selectPeer }: TelephonyControls) => {
	const controlsRef = useRef<TelephonyControls>({ sessionState, toggleWidget, selectPeer });
	controlsRef.current = { sessionState, toggleWidget, selectPeer };

	useEffect(() => {
		if (typeof window.RocketChatDesktop?.onTelephonyCallRequested !== 'function') {
			return;
		}

		window.RocketChatDesktop.onTelephonyCallRequested(({ phoneNumber }) => {
			const { sessionState, toggleWidget, selectPeer } = controlsRef.current;
			const peerInfo: PeerInfo = { number: phoneNumber };

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
		});
	}, []);
};
