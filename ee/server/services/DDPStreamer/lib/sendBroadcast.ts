import { Sender } from 'ws';

import { ISubscription } from '../Streamer';

const broadcastData = (message: string): Buffer[] => {
	const data = Sender.frame(Buffer.from(message), {
		fin: true, // sending a single fragment message
		rsv1: false, // don"t set rsv1 bit (no compression)
		opcode: 1, // opcode for a text frame
		mask: false, // set false for client-side
		readOnly: false, // the data can be modified as needed
	});

	return [Buffer.concat(data)];
};

export const sendBroadcast = async (subscriptions: Set<ISubscription>, message: string): Promise<void> => {
	const frames: {[k: string]: Buffer[]} = {
		default: broadcastData(message),
		meteor: broadcastData(`a${ JSON.stringify([message]) }`),
	};

	for (const subscription of subscriptions) {
		// eslint-disable-next-line
		await new Promise((resolve) => {
			// TODO: missing typing
			(subscription.client.ws as any)._sender.sendFrame(
				frames[subscription.client.kind],
				resolve,
			);
		});
	}
};
