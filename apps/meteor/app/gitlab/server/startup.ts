import _ from 'underscore';

import { settings, settingsRegistry } from '../../settings/server';
import { config, Gitlab } from '../lib/common';

settingsRegistry.addGroup('OAuth', function () {
	this.section('GitLab', function () {
		const enableQuery = {
			_id: 'Accounts_OAuth_Gitlab',
			value: true,
		};

		this.add('Accounts_OAuth_Gitlab', false, { type: 'boolean', public: true });
		this.add('API_Gitlab_URL', '', { type: 'string', enableQuery, public: true, secret: true });
		this.add('Accounts_OAuth_Gitlab_id', '', { type: 'string', enableQuery });
		this.add('Accounts_OAuth_Gitlab_secret', '', { type: 'string', enableQuery, secret: true });
		this.add('Accounts_OAuth_Gitlab_identity_path', '/api/v4/user', {
			type: 'string',
			public: true,
			enableQuery,
		});
		this.add('Accounts_OAuth_Gitlab_merge_users', false, {
			type: 'boolean',
			public: true,
			enableQuery,
		});
		this.add('Accounts_OAuth_Gitlab_callback_url', '_oauth/gitlab', {
			type: 'relativeUrl',
			readonly: true,
			enableQuery,
		});
	});
});

Meteor.startup(() => {
	const updateConfig = _.debounce(() => {
		config.serverURL = settings.get<string>('API_Gitlab_URL').trim().replace(/\/*$/, '') || config.serverURL;
		config.identityPath = settings.get('Accounts_OAuth_Gitlab_identity_path') || config.identityPath;
		config.mergeUsers = Boolean(settings.get('Accounts_OAuth_Gitlab_merge_users'));
		Gitlab.configure(config);
	}, 300);

	settings.watchMultiple(['API_Gitlab_URL', 'Accounts_OAuth_Gitlab_identity_path', 'Accounts_OAuth_Gitlab_merge_users'], updateConfig);
});
