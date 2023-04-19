import { settingsRegistry } from '../../settings/server';

void settingsRegistry.addGroup('OAuth', async function () {
	await this.section('GitHub Enterprise', async function () {
		const enableQuery = {
			_id: 'Accounts_OAuth_GitHub_Enterprise',
			value: true,
		};

		await this.add('Accounts_OAuth_GitHub_Enterprise', false, { type: 'boolean' });
		await this.add('API_GitHub_Enterprise_URL', '', {
			type: 'string',
			public: true,
			enableQuery,
			i18nDescription: 'API_GitHub_Enterprise_URL_Description',
		});
		await this.add('Accounts_OAuth_GitHub_Enterprise_id', '', {
			type: 'string',
			enableQuery,
			secret: true,
		});
		await this.add('Accounts_OAuth_GitHub_Enterprise_secret', '', {
			type: 'string',
			enableQuery,
			secret: true,
		});
		await this.add('Accounts_OAuth_GitHub_Enterprise_callback_url', '_oauth/github_enterprise', {
			type: 'relativeUrl',
			readonly: true,
			enableQuery,
		});
	});
});
