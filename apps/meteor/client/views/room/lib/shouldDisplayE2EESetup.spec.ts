import { shouldDisplayE2EESetup } from './shouldDisplayE2EESetup';

describe('shouldDisplayE2EESetup', () => {
	it('shows the setup for an encrypted room when E2EE is enabled and unencrypted messages are not allowed', () => {
		expect(shouldDisplayE2EESetup({ encrypted: true }, { e2eEnabled: true, unencryptedMessagesAllowed: false })).toBe(true);
	});

	it('does not show the setup when E2EE is disabled for the workspace', () => {
		expect(shouldDisplayE2EESetup({ encrypted: true }, { e2eEnabled: false, unencryptedMessagesAllowed: false })).toBe(false);
	});

	it('does not show the setup when unencrypted messages are allowed', () => {
		expect(shouldDisplayE2EESetup({ encrypted: true }, { e2eEnabled: true, unencryptedMessagesAllowed: true })).toBe(false);
	});

	it('does not show the setup for a room that is not encrypted', () => {
		expect(shouldDisplayE2EESetup({ encrypted: false }, { e2eEnabled: true, unencryptedMessagesAllowed: false })).toBe(false);
		expect(shouldDisplayE2EESetup({}, { e2eEnabled: true, unencryptedMessagesAllowed: false })).toBe(false);
	});
});
