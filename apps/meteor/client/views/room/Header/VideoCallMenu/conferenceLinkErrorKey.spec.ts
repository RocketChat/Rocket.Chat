import en from '@rocket.chat/i18n/dist/resources/en.i18n.json';

import { conferenceLinkErrorKey } from './conferenceLinkErrorKey';

const enStrings: Record<string, unknown> = en;

const LINK_ERROR_CODES = [
	'error-invalid-title',
	'error-invalid-conference-room',
	'error-video-conf-links-not-supported',
	'error-not-allowed',
];

it('maps the codes of the link endpoints to their keys', () => {
	LINK_ERROR_CODES.forEach((code) => {
		expect(conferenceLinkErrorKey({ success: false, error: code })).toBe(code);
	});
});

it('falls back to the unexpected error for anything else', () => {
	[
		{ success: false, error: 'error-something-else' },
		{ success: false, error: 'toString' },
		{ success: false, error: 'hasOwnProperty' },
		{ success: false },
		{ status: 500 },
		new Error('error-invalid-title'),
		'error-invalid-title',
		undefined,
		null,
	].forEach((error) => {
		expect(conferenceLinkErrorKey(error)).toBe('error-videoconf-unexpected');
	});
});

// The modals and the delete toast show these; a missing key would show the error code itself.
it('defines every key it can return in en.i18n.json, without placeholders', () => {
	[...LINK_ERROR_CODES, 'error-videoconf-unexpected'].forEach((key) => {
		const value = String(enStrings[key] ?? '');

		expect({ key, defined: value.length > 0, placeholders: value.match(/{{\w+}}|__\w+__|%[sd]/g) }).toEqual({
			key,
			defined: true,
			placeholders: null,
		});
	});
});
