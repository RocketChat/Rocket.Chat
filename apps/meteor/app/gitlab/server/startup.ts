import { settingsRegistry } from '../../settings/server';

void settingsRegistry.addGroup('OAuth', async function () {
	await this.section('GitLab', async function () {
		const enableQuery = {
			_id: 'Accounts_OAuth_Gitlab',
			value: true,
		};

		await this.add('Accounts_OAuth_Gitlab', false, { type: 'boolean', public: true });
		await this.add('API_Gitlab_URL', '', { type: 'string', enableQuery, public: true, secret: true });
		await this.add('Accounts_OAuth_Gitlab_id', '', { type: 'string', enableQuery });
		await this.add('Accounts_OAuth_Gitlab_secret', '', { type: 'string', enableQuery, secret: true });
		await this.add('Accounts_OAuth_Gitlab_identity_path', '/api/v4/user', {
			type: 'string',
			public: true,
			enableQuery,
		});
		await this.add('Accounts_OAuth_Gitlab_merge_users', false, {
			type: 'boolean',
			public: true,
			enableQuery,
		});
		await this.add('Accounts_OAuth_Gitlab_callback_url', '_oauth/gitlab', {
			type: 'relativeUrl',
			readonly: true,
			enableQuery,
		});
	});
});
