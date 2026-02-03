import { federationSDK, type HomeserverEventSignatures } from '@rocket.chat/federation-sdk';
import { Logger } from '@rocket.chat/logger';

const logger = new Logger('federation-matrix:ping');

export const ping = async () => {
	federationSDK.eventEmitterService.on(
		'homeserver.ping',
		async (data: HomeserverEventSignatures['homeserver.ping']) => {
			logger.debug({ msg: 'Message received from homeserver', data });
		},
		(err: Error) => logger.error({ msg: 'Error handling homeserver ping', err }),
	);
};
