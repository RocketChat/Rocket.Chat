/* eslint-disable @typescript-eslint/camelcase */
import { settingsRegistry } from '../../settings/server';
import './appleOauthManifest';
import './appleOauthRegisterService';

settingsRegistry.addGroup('OAuth', function () {
	this.section('Apple', function () {
		this.add('Accounts_OAuth_Apple', false, { type: 'boolean', public: true });
		this.add('Accounts_OAuth_Apple_clientId', '', { type: 'string', public: true });
		this.add('Accounts_OAuth_Apple_secret', '', { type: 'string', public: true });
		this.add('Accounts_OAuth_Apple_manifest', '', { type: 'string' });

		this.add('Accounts_OAuth_Apple_iss', '', { type: 'string' });
		this.add('Accounts_OAuth_Apple_kid', '', { type: 'string' });
	});
});
