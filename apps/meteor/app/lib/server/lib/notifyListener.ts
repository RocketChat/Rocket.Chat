import { api, dbWatchersDisabled } from '@rocket.chat/core-services';
import type { ILoginServiceConfiguration } from '@rocket.chat/core-typings';
import { LoginServiceConfiguration } from '@rocket.chat/models';

type ClientAction = 'inserted' | 'updated' | 'removed';

export async function broadcastOnLoginServiceConfiguration<T extends ILoginServiceConfiguration>(
	service: T['service'],
	clientAction: ClientAction = 'updated',
): Promise<void> {
	if (dbWatchersDisabled) {
		const serviceConfiguration = await LoginServiceConfiguration.findOne({ service });
		if (serviceConfiguration) {
			void api.broadcast('watch.loginServiceConfiguration', {
				clientAction,
				id: serviceConfiguration._id,
				data: serviceConfiguration,
			});
		}
	}
}
