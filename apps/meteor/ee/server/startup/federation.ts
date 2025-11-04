import { api, FederationMatrix as FederationMatrixService } from '@rocket.chat/core-services';
import { FederationMatrix, setupFederationMatrix } from '@rocket.chat/federation-matrix';
import { InstanceStatus } from '@rocket.chat/instance-status';
import { Logger } from '@rocket.chat/logger';

import { StreamerCentral } from '../../../server/modules/streamer/streamer.module';
import { registerFederationRoutes } from '../api/federation';

const logger = new Logger('Federation');

export const startFederationService = async (): Promise<void> => {
	try {
		const isEnabled = await setupFederationMatrix(InstanceStatus.id());

		api.registerService(new FederationMatrix());

		await registerFederationRoutes();

		// only registers the typing listener if the service is enabled
		if (!isEnabled) {
			return;
		}

		// TODO move to service/setup?
		StreamerCentral.on('broadcast', (name, eventName, args) => {
			if (name === 'notify-room' && eventName.endsWith('user-activity')) {
				const [rid] = eventName.split('/');
				const [user, activity] = args;
				void FederationMatrixService.notifyUserTyping(rid, user, activity.includes('user-typing'));
			}
		});
	} catch (error) {
		logger.error('Failed to start federation-matrix service:', error);
	}
};
