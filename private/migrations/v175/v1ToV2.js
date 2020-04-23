const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

const { getMasterProcess } = require('./masterProcess');
const { getWorkerProcess } = require('./workerProcess');
const config = require('./config');

const { ROOM_BATCH_SIZE, MESSAGE_BATCH_SIZE, LOCAL_SRC, FEDERATION_DOMAIN, MONGO_URL } = process.env;

// Set the config
config.set('ROOM_BATCH_SIZE', ROOM_BATCH_SIZE || 1000);
config.set('MESSAGE_BATCH_SIZE', MESSAGE_BATCH_SIZE || 1000);
config.set('FEDERATION_DOMAIN', FEDERATION_DOMAIN);
config.set('LOCAL_SRC', LOCAL_SRC);
config.set('MONGO_URL', MONGO_URL);

const workers = [];

async function run() {
	if (cluster.isMaster) {
		cluster.on('exit', (worker) => {
			console.log(`worker ${ worker.process.pid } died`);
		});

		const masterProcess = getMasterProcess();

		// Fork workers
		for (let i = 0; i < numCPUs; i++) {
			const worker = cluster.fork();

			workers.push(worker);
		}

		await masterProcess.start(workers, () => {
			process.exit(0);
		});
	} else {
		const workerProcess = getWorkerProcess();

		await workerProcess.start();
	}
}

run();
