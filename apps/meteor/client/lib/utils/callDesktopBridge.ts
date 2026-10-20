import type { IRocketChatDesktop } from '@rocket.chat/desktop-api';

/**
 * Calls the desktop app bridge (`window.RocketChatDesktop`) when it is present. The desktop code ships on its own
 * release cycle, so a failed call is logged and dropped instead of crashing the web client.
 */
export const callDesktopBridge = (call: (desktop: IRocketChatDesktop) => void): void => {
	const desktop = typeof window === 'undefined' ? undefined : window.RocketChatDesktop;
	if (!desktop) return;

	try {
		call(desktop);
	} catch (error) {
		console.warn('The desktop app bridge call failed', error);
	}
};
