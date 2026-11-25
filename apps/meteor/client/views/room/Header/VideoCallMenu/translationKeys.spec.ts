import en from '@rocket.chat/i18n/dist/resources/en.i18n.json';

const enStrings: Record<string, unknown> = en;

// Units wiring the menu, the modals and the toasts only read these keys, so all of them must already exist.
const FEATURE_KEYS = [
	'Start_conference',
	'Create_link',
	'Conference_links',
	'Conference_link_name',
	'Rename_conference_link',
	'Rename_conference_link_description',
	'Delete_conference_link',
	'Delete_conference_link_description',
	'Conference_link_created',
	'Conference_link_renamed',
	'Conference_link_deleted',
	'Conference_not_started_yet',
	'Conference_not_started_yet_description',
	'Ongoing',
	'Rename',
];

const KEYS_NAMING_THE_LINK = ['Conference_not_started_yet', 'Delete_conference_link_description'];

it('defines every key of the feature in en.i18n.json with its placeholders', () => {
	FEATURE_KEYS.forEach((key) => {
		const value = String(enStrings[key] ?? '');
		const placeholders = value.match(/{{\w+}}|__\w+__|%[sd]/g) ?? [];

		expect({ key, defined: value.length > 0 }).toEqual({ key, defined: true });
		expect({ key, placeholders }).toEqual({ key, placeholders: KEYS_NAMING_THE_LINK.includes(key) ? ['{{title}}'] : [] });
	});
});
