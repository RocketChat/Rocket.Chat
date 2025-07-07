import type { Emitter } from '@rocket.chat/emitter';
import type { HomeserverEventSignatures } from '@hs/federation-sdk';

export const ping = async (emitter: Emitter<HomeserverEventSignatures>) => {
	emitter.on('homeserver.ping', async (data) => {
		console.log('Message received from homeserver', data);
	});
};
