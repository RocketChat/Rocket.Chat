import { settingsRegistry } from '../../../app/settings/server';
import { ServiceConfiguration } from 'meteor/service-configuration';

export async function removeOpenIDService(mainSettingId: string): Promise<void> {
	const serviceName = mainSettingId.replace('Accounts_OpenID-', '');

	await ServiceConfiguration.configurations.removeAsync({ service: serviceName });
	await settingsRegistry.removeSection(`OpenID Connect: ${serviceName}`);
}
