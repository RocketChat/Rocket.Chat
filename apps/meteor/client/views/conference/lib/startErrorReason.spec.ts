import en from '@rocket.chat/i18n/dist/resources/en.i18n.json';

import { startErrorReason } from './startErrorReason';

const enStrings: Record<string, unknown> = en;

it('maps the two start errors to their keys', () => {
	expect(startErrorReason({ success: false, error: 'error-video-conf-links-not-supported' })).toBe('error-video-conf-links-not-supported');
	expect(startErrorReason({ success: false, error: 'error-invalid-conference-room' })).toBe('error-invalid-conference-room');
});

it('maps nothing else', () => {
	expect(startErrorReason({ success: false, error: 'error-invalid-title' })).toBeUndefined();
	expect(startErrorReason({ success: false, error: 'toString' })).toBeUndefined();
	expect(startErrorReason({ success: false })).toBeUndefined();
	expect(startErrorReason(new Error('error-invalid-conference-room'))).toBeUndefined();
	expect(startErrorReason('error-invalid-conference-room')).toBeUndefined();
	expect(startErrorReason(undefined)).toBeUndefined();
	expect(startErrorReason(null)).toBeUndefined();
	expect(startErrorReason({ status: 400 })).toBeUndefined();
});

// The page shows these as the reason of a failed start; a missing key would show the error code itself.
it('defines both keys in en.i18n.json', () => {
	['error-video-conf-links-not-supported', 'error-invalid-conference-room'].forEach((key) => {
		const value = String(enStrings[key] ?? '');

		expect({ key, defined: value.length > 0, placeholders: value.match(/{{\w+}}|__\w+__|%[sd]/g) }).toEqual({
			key,
			defined: true,
			placeholders: null,
		});
	});
});
