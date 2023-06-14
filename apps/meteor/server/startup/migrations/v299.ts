import { Settings } from '@rocket.chat/models';

import { settingsRegistry } from '../../../app/settings/server';
import { addMigration } from '../../lib/migrations';

addMigration({
	version: 299,
	async up() {
		const customOauthServices = await Settings.find({ _id: /Accounts_OAuth_Custom-[^-]+$/im }).toArray();
		const serviceNames = customOauthServices.map(({ _id }) => _id.replace('Accounts_OAuth_Custom-', ''));

		serviceNames.forEach(async (serviceName) => {
			await settingsRegistry.add(`Accounts_OAuth_Custom-${serviceName}-merge_users_distinct_services`, '', {
				type: 'boolean',
				group: 'OAuth',
				section: `Custom OAuth: ${serviceName}`,
				i18nLabel: 'Accounts_OAuth_Custom_Merge_Users_Distinct_Services',
				i18nDescription: 'Accounts_OAuth_Custom_Merge_Users_Distinct_Services_Description',
				enableQuery: {
					_id: `Accounts_OAuth_Custom-${serviceName}-merge_users`,
					value: true,
				},
				persistent: true,
			});
		});
	},
});
