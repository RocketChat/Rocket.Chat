import { settingsRegistry } from '../../settings/server';

void settingsRegistry.addGroup('OAuth', async function () {
	await this.section('Drupal', async function () {
		const enableQuery = {
			_id: 'Accounts_OAuth_Drupal',
			value: true,
		};

		await this.add('Accounts_OAuth_Drupal', false, { type: 'boolean' });
		await this.add('API_Drupal_URL', '', {
			type: 'string',
			public: true,
			enableQuery,
			i18nDescription: 'API_Drupal_URL_Description',
		});
		await this.add('Accounts_OAuth_Drupal_id', '', { type: 'string', enableQuery });
		await this.add('Accounts_OAuth_Drupal_secret', '', { type: 'string', enableQuery, secret: true });
		await this.add('Accounts_OAuth_Drupal_callback_url', '_oauth/drupal', {
			type: 'relativeUrl',
			readonly: true,
			enableQuery,
		});
	});
});
