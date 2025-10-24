import { api, FederationMatrix as FederationMatrixService } from '@rocket.chat/core-services';
import { FederationMatrix, setupFederationMatrix } from '@rocket.chat/federation-matrix';
import { InstanceStatus } from '@rocket.chat/instance-status';
import { Logger } from '@rocket.chat/logger';

import { settings } from '../../../app/settings/server';
import { StreamerCentral } from '../../../server/modules/streamer/streamer.module';
import { registerFederationRoutes } from '../api/federation';

const logger = new Logger('Federation');

const CRITICAL_SETTINGS = [
	'Federation_Service_Enabled',
	'Federation_Service_Domain',
	'Federation_Service_Matrix_Signing_Key',
	'Federation_Service_Matrix_Signing_Algorithm',
	'Federation_Service_Matrix_Signing_Version',
	'Federation_Service_Join_Encrypted_Rooms',
	'Federation_Service_Join_Non_Private_Rooms',
	'Federation_Service_EDU_Process_Typing',
	'Federation_Service_EDU_Process_Presence',
];

let serviceRegistered = false;

export const startFederationService = async (): Promise<void> => {
	try {
		const isEnabled = await setupFederationMatrix(InstanceStatus.id());

		if (!serviceRegistered) {
			api.registerService(new FederationMatrix());
			serviceRegistered = true;
		}

		await registerFederationRoutes();

		if (isEnabled) {
			// TODO move to service/setup?
			StreamerCentral.on('broadcast', (name, eventName, args) => {
				if (name === 'notify-room' && eventName.endsWith('user-activity')) {
					const [rid] = eventName.split('/');
					const [user, activity] = args;
					void FederationMatrixService.notifyUserTyping(rid, user, activity.includes('user-typing'));
				}
			});
		}

		settings.watchMultiple(CRITICAL_SETTINGS, async () => {
			await startFederationService();
		});
	} catch (error) {
		logger.error('Failed to start federation service', { error });
		throw error;
	}
};
