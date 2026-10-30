import type { TFunction } from 'i18next';

import { getDefaultPasskeyName } from './getDefaultPasskeyName';

const t = ((key: string, options?: { client: string; platform: string }) =>
	options ? `${options.client} on ${options.platform}` : key) as unknown as TFunction;

describe('getDefaultPasskeyName', () => {
	// each user agent also names the browsers and platforms it claims compatibility with
	it.each([
		[
			'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
			'Chrome on macOS',
		],
		[
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
			'Edge on Windows',
		],
		[
			'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
			'Safari on iPhone',
		],
		[
			'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
			'Chrome on Android',
		],
		[
			'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.6723.90 Mobile/15E148 Safari/604.1',
			'Chrome on iPhone',
		],
		[
			'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/131.0 Mobile/15E148 Safari/605.1.15',
			'Firefox on iPhone',
		],
		[
			'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 EdgA/130.0.0.0',
			'Edge on Android',
		],
		['Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0', 'Firefox on Linux'],
		[
			'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Rocket.Chat/4.0.0 Chrome/128.0.0.0 Electron/32.0.0 Safari/537.36',
			'Rocket.Chat Desktop on macOS',
		],
	])('names a passkey created on this device after the browser and platform of %s', (userAgent, name) => {
		expect(getDefaultPasskeyName(t, 'platform', userAgent)).toBe(name);
	});

	it('gives a passkey kept on another device, such as a security key or a phone, a generic name', () => {
		expect(
			getDefaultPasskeyName(
				t,
				'cross-platform',
				'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
			),
		).toBe('Passkey');
	});

	it('gives a generic name when the browser is not recognized', () => {
		expect(getDefaultPasskeyName(t, 'platform', 'curl/8.7.1')).toBe('Passkey');
	});
});
