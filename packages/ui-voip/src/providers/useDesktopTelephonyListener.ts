import { useEffect } from 'react';

import type { PeerInfo } from '../context/definitions';

/**
 * Listens for `tel:`/`callto:` deeplink and global-shortcut phone numbers forwarded
 * by the Rocket.Chat Desktop and opens widget with new peerInfo
 */
export const useDesktopTelephonyListener = (openWidget: (peerInfo: PeerInfo) => void) => {
	useEffect(() => {
		if (typeof window.RocketChatDesktop?.onTelephonyCallRequested !== 'function') {
			return;
		}

		window.RocketChatDesktop.onTelephonyCallRequested(({ phoneNumber }) => {
			if (typeof phoneNumber !== 'string' || phoneNumber.trim().length === 0) {
				console.warn('MediaCall - Telephony Deeplink listener - Invalid number format: ', phoneNumber);
				return;
			}
			openWidget({ number: phoneNumber });
		});
	}, [openWidget]);
};
