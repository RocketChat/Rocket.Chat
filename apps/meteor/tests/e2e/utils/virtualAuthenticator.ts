import type { Page } from '@playwright/test';

/**
 * Gives `page` a platform authenticator that verifies the user on every request, the way a device with a fingerprint
 * reader or a screen lock does. Chromium only, through the DevTools WebAuthn domain.
 */
export const addVirtualAuthenticator = async (page: Page) => {
	const cdp = await page.context().newCDPSession(page);
	await cdp.send('WebAuthn.enable');
	const { authenticatorId } = await cdp.send('WebAuthn.addVirtualAuthenticator', {
		options: {
			protocol: 'ctap2',
			transport: 'internal',
			hasResidentKey: true,
			hasUserVerification: true,
			isUserVerified: true,
			automaticPresenceSimulation: true,
		},
	});

	const getCredentials = async () => (await cdp.send('WebAuthn.getCredentials', { authenticatorId })).credentials;

	return {
		getCredentials,
		addCredential: (credential: Awaited<ReturnType<typeof getCredentials>>[number]) =>
			cdp.send('WebAuthn.addCredential', { authenticatorId, credential }),
	};
};
