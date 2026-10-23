import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import en from '@rocket.chat/i18n/dist/resources/en.i18n.json';

describe('App status translations', () => {
	it.each(Object.values(AppStatus))('should have an English label for the %s status', (status) => {
		expect(en).toHaveProperty([`App_status_${status}`]);
	});
});
