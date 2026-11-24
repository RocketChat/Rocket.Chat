import { LoginServiceConfiguration } from '@rocket.chat/models';

import { notifyOnLoginServiceConfigurationChanged } from '../notifyListener';

export async function removeOAuthService(mainSettingId: string): Promise<void> {
	const serviceName = mainSettingId.replace('Accounts_OAuth_Custom-', '');

	const service = await LoginServiceConfiguration.removeByService(serviceName);
	if (service) {
		void notifyOnLoginServiceConfigurationChanged({ _id: service._id }, 'removed');
	}
}
