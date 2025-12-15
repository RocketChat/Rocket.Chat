import { api, FederationMatrix as FederationMatrixService } from '@rocket.chat/core-services';
import { FederationMatrix, configureFederationMatrixSettings, setupFederationMatrix } from '@rocket.chat/federation-matrix';
import { InstanceStatus } from '@rocket.chat/instance-status';
import { License } from '@rocket.chat/license';
import { Logger } from '@rocket.chat/logger';

import { settings } from '../../../app/settings/server';
import { StreamerCentral } from '../../../server/modules/streamer/streamer.module';
import { registerFederationRoutes } from '../api/federation';

const logger = new Logger('Federation');

let serviceEnabled = false;

const configureFederation = async () => {
	// only registers the typing listener if the service is enabled
	serviceEnabled = (await License.hasModule('federation')) && settings.get('Federation_Service_Enabled');
	if (!serviceEnabled) {
		return;
	}

	try {
		configureFederationMatrixSettings({
			instanceId: InstanceStatus.id(),
			domain: settings.get('Federation_Service_Domain'),
			signingKey: settings.get('Federation_Service_Matrix_Signing_Key'),
			signingAlgorithm: settings.get('Federation_Service_Matrix_Signing_Algorithm'),
			signingVersion: settings.get('Federation_Service_Matrix_Signing_Version'),
			allowedEncryptedRooms: settings.get('Federation_Service_Join_Encrypted_Rooms'),
			allowedNonPrivateRooms: settings.get('Federation_Service_Join_Non_Private_Rooms'),
			processEDUTyping: settings.get('Federation_Service_EDU_Process_Typing'),
			processEDUPresence: settings.get('Federation_Service_EDU_Process_Presence'),
		});
	} catch (error) {
		logger.error('Failed to start federation-matrix service:', error);
	}
};

export const startFederationService = async (): Promise<void> => {
	api.registerService(new FederationMatrix());

	await registerFederationRoutes();

	// TODO move to service/setup?
	StreamerCentral.on('broadcast', (name, eventName, args) => {
		if (!serviceEnabled) {
			return;
		}

		if (name === 'notify-room' && eventName.endsWith('user-activity')) {
			const [rid] = eventName.split('/');
			const [user, activity] = args;
			void FederationMatrixService.notifyUserTyping(rid, user, activity.includes('user-typing'));
		}
	});

	settings.watchMultiple(
		[
			'Federation_Service_Enabled',
			'Federation_Service_Domain',
			'Federation_Service_EDU_Process_Typing',
			'Federation_Service_EDU_Process_Presence',
			'Federation_Service_Matrix_Signing_Key',
			'Federation_Service_Matrix_Signing_Algorithm',
			'Federation_Service_Matrix_Signing_Version',
			'Federation_Service_Join_Encrypted_Rooms',
			'Federation_Service_Join_Non_Private_Rooms',
		],
		async () => {
			await configureFederation();
		},
	);

	try {
		await setupFederationMatrix();
	} catch (err) {
		logger.error({ msg: 'Failed to setup federation-matrix:', err });
	}
};
