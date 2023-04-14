import { onStartup } from '../../../server/lib/onStartup';
import { settingsRegistry } from '../../settings/server';

onStartup(async () => {
	await settingsRegistry.addGroup('Accounts', async function () {
		await this.section('Iframe', async function () {
			await this.add('Accounts_iframe_enabled', false, { type: 'boolean', public: true });
			await this.add('Accounts_iframe_url', '', { type: 'string', public: true });
			await this.add('Accounts_Iframe_api_url', '', { type: 'string', public: true });
			await this.add('Accounts_Iframe_api_method', 'POST', { type: 'string', public: true });
		});
	});
});
