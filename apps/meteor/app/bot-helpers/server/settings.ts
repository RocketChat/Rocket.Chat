import { onStartup } from '../../../server/lib/onStartup';
import { settingsRegistry } from '../../settings/server';

onStartup(async () => {
	await settingsRegistry.addGroup('Bots', async function () {
		await this.add('BotHelpers_userFields', '_id, name, username, emails, language, utcOffset', {
			type: 'string',
			section: 'Helpers',
			i18nLabel: 'BotHelpers_userFields',
			i18nDescription: 'BotHelpers_userFields_Description',
		});
	});
});
