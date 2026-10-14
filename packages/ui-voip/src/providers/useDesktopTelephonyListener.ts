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

		// onTelephonyCallRequested returns no cleanup, and registered callbacks overwrite the previous ones
		// so a noop needs to be set on the effect's cleanup to ensure a stale `openWidget` is not called.
		return () => {
			if (typeof window.RocketChatDesktop?.onTelephonyCallRequested !== 'function') {
				return;
			}
			window.RocketChatDesktop.onTelephonyCallRequested(() => undefined);
		};
	}, [openWidget]);
};
