import mediasoup, { types } from 'mediasoup';

import config from '../config';

const mediasoupWorkers: Array<types.Worker> = [];
let nextMediasoupWorkerIdx = 0;

export const runWorkers = async (): Promise<void> => {
	const { numWorkers } = config.mediasoup;

	new Array(numWorkers).fill(0).forEach(async () => {
		const worker = await mediasoup.createWorker({
			logLevel: config.mediasoup.workerSettings.logLevel,
			logTags: config.mediasoup.workerSettings.logTags,
			rtcMinPort: Number(config.mediasoup.workerSettings.rtcMinPort),
			rtcMaxPort: Number(config.mediasoup.workerSettings.rtcMaxPort),
		});

		worker.on('died', () => {
			console.log('Mediasoup Worker Died.\n');
			setTimeout(() => process.exit(1), 2000);
		});

		mediasoupWorkers.push(worker);
	});
};

export const getWorker = (): types.Worker => {
	const worker = mediasoupWorkers[nextMediasoupWorkerIdx];

	if (++nextMediasoupWorkerIdx === mediasoupWorkers.length) { nextMediasoupWorkerIdx = 0; }

	return worker;
};
