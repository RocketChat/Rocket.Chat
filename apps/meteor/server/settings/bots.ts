import { settingsRegistry } from '../../app/settings/server';

export const createBotsSettings = () =>
	settingsRegistry.addGroup('Bots', async function () {
		await this.add('BotHelpers_userFields', '_id, name, username, emails, language, utcOffset', {
			type: 'string',
			section: 'Helpers',
			i18nLabel: 'BotHelpers_userFields',
			i18nDescription: 'BotHelpers_userFields_Description',
		});
	});
