import en from './locales/en.i18n.json';

describe('en.i18n.json', () => {
	it.each([
		'Failed_to_copy',
		'FileUpload_NotAllowed',
		'Message_not_found',
		'Omnichannel_is_not_enabled',
		'You_cant_send_unencrypted_files_in_an_encrypted_room',
	])('should define %s, which the app looks up by name', (key) => {
		expect((en as Record<string, string>)[key]).toMatch(/\S/);
	});
});
