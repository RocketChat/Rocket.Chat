import { settingsRegistry } from '../../app/settings/server';

export const createEmojiPermissionsSettings = () =>
	settingsRegistry.addGroup('Emoji', async function () {
		await this.add('Emoji_Restricted_For_Users', '', {
			type: 'string',
			public: true,
			i18nLabel: 'Emoji_Restricted_For_Users',
			i18nDescription: 'Emoji_Restricted_For_Users_Description',
		});
	});
