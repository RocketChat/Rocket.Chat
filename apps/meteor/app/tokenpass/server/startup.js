import { settingsRegistry } from '../../settings/server';

settingsRegistry.addGroup('OAuth', function () {
	this.section('Tokenpass', function () {
		const enableQuery = {
			_id: 'Accounts_OAuth_Tokenpass',
			value: true,
		};

		this.add('Accounts_OAuth_Tokenpass', false, { type: 'boolean' });
		this.add('API_Tokenpass_URL', '', {
			type: 'string',
			public: true,
			enableQuery,
			i18nDescription: 'API_Tokenpass_URL_Description',
		});
		this.add('Accounts_OAuth_Tokenpass_id', '', { type: 'string', enableQuery });
		this.add('Accounts_OAuth_Tokenpass_secret', '', { type: 'string', enableQuery });
		this.add('Accounts_OAuth_Tokenpass_callback_url', '_oauth/tokenpass', {
			type: 'relativeUrl',
			readonly: true,
			force: true,
			enableQuery,
		});
	});
});
