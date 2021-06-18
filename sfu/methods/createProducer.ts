import { types } from 'mediasoup';

import { IPeer, ICreateProducerData } from '../types';

export const createProducer = async (peer: IPeer, data: ICreateProducerData): Promise<types.Producer> => {
	const { transportId, rtpParameters, appData, kind } = data;

	const transport = peer.data.transports.get(transportId);

	if (!transport) {
		throw new Error(`Transport with id: ${ transportId } not found.`);
	}


	const producer = await transport.produce({
		kind,
		rtpParameters,
		appData: { ...appData, peerId: peer.id },
	});

	peer.data.producers.set(producer.id, producer);

	return producer;
};
