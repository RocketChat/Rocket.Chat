import en from './locales/en.i18n.json';

describe('en.i18n.json', () => {
	it.each(['Actions', 'Code', 'Debug', 'Emails', 'Empty', 'Event', 'Phones', 'Severity'])(
		'should define %s, which the client looks up by name',
		(key) => {
			expect((en as Record<string, string>)[key]).toMatch(/\S/);
		},
	);
});
