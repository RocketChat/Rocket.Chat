import { federationSDK } from '@rocket.chat/federation-sdk';

export const ping = async () => {
	federationSDK.eventEmitterService.on('homeserver.ping', async (data) => {
		console.log('Message received from homeserver', data);
	});
};
