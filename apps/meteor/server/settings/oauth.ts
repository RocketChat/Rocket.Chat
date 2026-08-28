import { Random } from '@rocket.chat/random';

import { settingsRegistry } from '.';

export const createOauthSettings = () =>
	settingsRegistry.addGroup('OAuth', async function () {
		await this.add('Accounts_OAuth_Use_Modern_Flow', false, {
			type: 'boolean',
			public: true,
			i18nLabel: 'Accounts_OAuth_Use_Modern_Flow_Label',
			i18nDescription: 'Accounts_OAuth_Use_Modern_Flow_Description',
		});

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
		await this.section('Google', async function () {
			const enableQuery = {
				_id: 'Accounts_OAuth_Google',
				value: true,
			};
			await this.add('Accounts_OAuth_Google', false, {
				type: 'boolean',
				public: true,
			});
			await this.add('Accounts_OAuth_Google_id', '', {
				type: 'string',
				enableQuery,
			});
			await this.add('Accounts_OAuth_Google_secret', '', {
				type: 'string',
				enableQuery,
				secret: true,
			});
			return this.add('Accounts_OAuth_Google_callback_url', '_oauth/google', {
				type: 'relativeUrl',
				readonly: true,
				enableQuery,
			});
		});
		await this.section('GitHub', async function () {
			const enableQuery = {
				_id: 'Accounts_OAuth_Github',
				value: true,
			};
			await this.add('Accounts_OAuth_Github', false, {
				type: 'boolean',
				public: true,
			});
			await this.add('Accounts_OAuth_Github_id', '', {
				type: 'string',
				enableQuery,
			});
			await this.add('Accounts_OAuth_Github_secret', '', {
				type: 'string',
				enableQuery,
				secret: true,
			});
			return this.add('Accounts_OAuth_Github_callback_url', '_oauth/github', {
				type: 'relativeUrl',
				readonly: true,
				enableQuery,
			});
		});
		await this.add('Accounts_OAuth_Session_Secret', Random.secret(), {
			type: 'string',
			secret: true,
			hidden: true,
		});
		return this.section('Proxy', async function () {
			await this.add('Accounts_OAuth_Proxy_host', 'https://oauth-proxy.rocket.chat', {
				type: 'string',
				public: true,
			});
			return this.add('Accounts_OAuth_Proxy_services', '', {
				type: 'string',
				public: true,
			});
		});
	});
