import { federationSDK } from '@rocket.chat/federation-sdk';

export const ping = async () => {
	federationSDK.eventEmitterService.on('homeserver.ping', async (data) => {
		// eslint-disable-next-line no-console
		console.log('Message received from homeserver', data);
	});
};
