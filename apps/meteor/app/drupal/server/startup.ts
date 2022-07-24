import { settingsRegistry } from '../../settings/server';

settingsRegistry.addGroup('OAuth', function () {
	this.section('Drupal', function () {
		const enableQuery = {
			_id: 'Accounts_OAuth_Drupal',
			value: true,
		};

		this.add('Accounts_OAuth_Drupal', false, { type: 'boolean' });
		this.add('API_Drupal_URL', '', {
			type: 'string',
			public: true,
			enableQuery,
			i18nDescription: 'API_Drupal_URL_Description',
		});
		this.add('Accounts_OAuth_Drupal_id', '', { type: 'string', enableQuery });
		this.add('Accounts_OAuth_Drupal_secret', '', { type: 'string', enableQuery, secret: true });
		this.add('Accounts_OAuth_Drupal_callback_url', '_oauth/drupal', {
			type: 'relativeUrl',
			readonly: true,
			enableQuery,
		});
	});
});
