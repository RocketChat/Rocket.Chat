import { AppPermissions } from '@rocket.chat/apps-engine/definition/metadata/AppPermissions';
import en from '@rocket.chat/i18n/dist/resources/en.i18n.json';

const permissionNames = Object.values(AppPermissions).flatMap((scope) => Object.values(scope).map(({ name }) => name));

describe('App permission translations', () => {
	it.each(permissionNames)('should have an English label for the %s permission', (name) => {
		expect(en).toHaveProperty([`Apps_Permissions_${name.replaceAll('.', '_')}`]);
	});
});
