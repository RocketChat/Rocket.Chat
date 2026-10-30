import type { TFunction } from 'i18next';

import { formatPasskeyClient, getPasskeyKind } from './describePasskey';

const t = ((key: string, options?: { client: string; platform: string }) =>
	options ? `${options.client} on ${options.platform}` : key) as unknown as TFunction;

describe('getPasskeyKind', () => {
	it('tells a passkey built into a device from a security key and a phone', () => {
		expect(getPasskeyKind({ authenticatorAttachment: 'platform', transports: ['internal', 'hybrid'] })).toBe('built-in');
		expect(getPasskeyKind({ authenticatorAttachment: 'cross-platform', transports: ['usb', 'nfc'] })).toBe('security-key');
		expect(getPasskeyKind({ authenticatorAttachment: 'cross-platform', transports: ['hybrid', 'internal'] })).toBe('phone');
	});

	it('falls back on the transports when the browser did not say how the authenticator is attached', () => {
		expect(getPasskeyKind({ transports: ['internal'] })).toBe('built-in');
		expect(getPasskeyKind({ transports: ['ble'] })).toBe('security-key');
		expect(getPasskeyKind({})).toBeUndefined();
	});
});

describe('formatPasskeyClient', () => {
	it('names the client by its major version and its platform', () => {
		expect(
			formatPasskeyClient(t, {
				type: 'browser',
				name: 'Chrome',
				version: '130.0.6723',
				longVersion: '130.0.6723.92',
				os: { name: 'Windows', version: '10' },
			}),
		).toBe('Chrome 130 on Windows 10');
		expect(formatPasskeyClient(t, { type: 'browser', name: 'Firefox', version: '131', longVersion: '131.0', os: { name: '' } })).toBe(
			'Firefox 131',
		);
	});

	it('names nothing when the client could not be recognized', () => {
		expect(formatPasskeyClient(t, { type: 'other', name: '', version: '', longVersion: '', os: { name: '' } })).toBeUndefined();
		expect(formatPasskeyClient(t, undefined)).toBeUndefined();
	});
});
