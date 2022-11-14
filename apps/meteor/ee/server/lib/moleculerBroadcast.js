import { ServiceBroker } from 'moleculer';

import { StreamerCentral } from '../../../server/modules/streamer/streamer.module';

let started = false;

const broker = new ServiceBroker({
	transporter: {
		type: 'TCP',
		options: {
			port: parseInt(process.env.TCP_PORT),
			udpDiscovery: false,
		},
	},
});

export function startMatrix() {
	if (started) {
		console.log('skip startMatrix');
		return;
	}
	started = true;

	broker.createService({
		name: 'matrix',
		events: {
			broadcast(ctx) {
				console.log('received broadcast', ctx.params);

				const { eventName, streamName, args } = ctx.params;

				const instance = StreamerCentral.instances[streamName];
				if (!instance) {
					return 'stream-not-exists';
				}

				if (instance.serverOnly) {
					instance.__emit(eventName, ...args);
				} else {
					StreamerCentral.instances[streamName]._emit(eventName, args);
				}
			},
		},
	});

	broker.start();
}

export function broadcast(streamName, eventName, args) {
	// console.log('broadcast ->', streamName, eventName, args);
	broker.broadcast('broadcast', { streamName, eventName, args }).then((res) => console.log(res));
}

export function connect(record) {
	console.log('record ->', record);

	// TODO check if not itself
	if (record._id === broker.nodeID) {
		return;
	}

	const { host, tcpPort } = record.extraInformation;

	broker.transit.tx.addOfflineNode(record._id, host, tcpPort);
}
