import { types } from 'mediasoup';

import { IPeer } from '../types/IPeer';

export const createConsumer = async (router: types.Router, consumerPeer: IPeer, producerPeer: IPeer, producer: types.Producer): Promise<void> => {
	if (!consumerPeer.data.rtpCapabilities || !router.canConsume({
		producerId: producer.id,
		rtpCapabilities: consumerPeer.data.rtpCapabilities,
	})) {
		return;
	}

	const transport = Array.from(consumerPeer.data.transports.values())
		.find((t) => t.appData.consuming);


	if (!transport) {
		return;
	}

	let consumer: types.Consumer;

	try {
		consumer = await transport.consume({
			producerId: producer.id,
			rtpCapabilities: consumerPeer.data.rtpCapabilities,
			paused: true,
		});
	} catch (err) {
		console.log(err);
		return;
	}

	consumerPeer.data.consumers.set(consumer.id, consumer);

	consumer.on('transportclose', () => consumerPeer.data.consumers.delete(consumer.id));

	consumer.on('producerclose', () => consumerPeer.data.consumers.delete(consumer.id));

	consumer.on('producerpause', () => {
		consumerPeer.notify('consumerPaused', { consumerId: consumer.id })
			.catch((err) => { console.log(err); });
	});

	consumer.on('producerresume', () => {
		consumerPeer.notify('consumerResumed', { consumerId: consumer.id })
			.catch((err) => { console.log(err); });
	});


	try {
		await consumerPeer.request('newConsumer', {
			peerID: producerPeer.id,
			producerID: producer.id,
			id: consumer.id,
			kind: consumer.kind,
			rtpParameters: consumer.rtpParameters,
			type: consumer.type,
			appData: producer.appData,
			producerPaused: consumer.producerPaused,
		});

		await consumer.resume();
	} catch (err) {
		console.log(err);
	}
};
