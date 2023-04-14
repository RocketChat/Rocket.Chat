import { settingsRegistry } from '../../settings/server';

void settingsRegistry.addGroup('OAuth', async function () {
	await this.section('Tokenpass', async function () {
		const enableQuery = {
			_id: 'Accounts_OAuth_Tokenpass',
			value: true,
		};

		await this.add('Accounts_OAuth_Tokenpass', false, { type: 'boolean' });
		await this.add('API_Tokenpass_URL', '', {
			type: 'string',
			public: true,
			enableQuery,
			i18nDescription: 'API_Tokenpass_URL_Description',
		});
		await this.add('Accounts_OAuth_Tokenpass_id', '', { type: 'string', enableQuery });
		await this.add('Accounts_OAuth_Tokenpass_secret', '', { type: 'string', enableQuery });
		await this.add('Accounts_OAuth_Tokenpass_callback_url', '_oauth/tokenpass', {
			type: 'relativeUrl',
			readonly: true,
			force: true,
			enableQuery,
		});
	});
});
