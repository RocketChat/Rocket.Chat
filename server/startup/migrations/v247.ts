import { settings, settingsRegistry } from '../../../app/settings/server';
import { addMigration } from '../../lib/migrations';

addMigration({
	version: 247,
	up() {
		const customOauthServices = settings.getByRegexp(/Accounts_OAuth_Custom-[^-]+$/im);
		const serviceNames = customOauthServices.map(([key]) => key.replace('Accounts_OAuth_Custom-', ''));

		serviceNames.forEach((serviceName) => {
			settingsRegistry.add(`Accounts_OAuth_Custom-${serviceName}-roles_to_sync`, '', {
				type: 'string',
				group: 'OAuth',
				section: `Custom OAuth: ${serviceName}`,
				i18nLabel: 'Accounts_OAuth_Custom_Roles_To_Sync',
				i18nDescription: 'Accounts_OAuth_Custom_Roles_To_Sync_Description',
				enterprise: true,
				enableQuery: {
					_id: `Accounts_OAuth_Custom-${serviceName}-merge_roles`,
					value: true,
				},
				invalidValue: '',
				modules: ['oauth-enterprise'],
			});
		});
	},
});
