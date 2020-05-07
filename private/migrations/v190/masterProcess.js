const moduleRequire = require('./moduleRequire');
const config = require('./config');

const { MongoClient } = moduleRequire('mongodb');

function benchmark(message) {
	const startTime = new Date();

	console.info(message);

	return () => {
		console.info(`${ message } - execution time: %dms`, new Date() - startTime);
	};
}

module.exports.getMasterProcess = () => ({
	async start(workers, onAllProcessesFinishedCallback) {
		this.workers = workers;
		this.onAllProcessesFinishedCallback = onAllProcessesFinishedCallback;

		// Setup database
		const databaseName = config.get('MONGO_URL').split('/')[3].split('?')[0];

		this.client = new MongoClient(config.get('MONGO_URL'), { useNewUrlParser: true, useUnifiedTopology: true });

		await this.client.connect();

		this.db = this.client.db(databaseName);

		// Models
		this.Rooms = this.db.collection('rocketchat_room');
		this.RoomEvents = this.db.collection('rocketchat_room_event');

		// Set message handler
		for (const worker of this.workers) {
			// eslint-disable-next-line no-loop-func
			worker.on('message', async ({ method, result }) => {
				console.log(`Master: ${ method }(${ result || '' })`);

				await this[method](worker, result);
			});

			worker.on('exit', () => {
				this.workers = this.workers.filter((w) => w.id !== worker.id);

				if (this.workers.length === 0) {
					this.onAllWorkersExit();
				}
			});
		}

		//
		// Rooms
		// - A timeout is needed to wait for the workers to be setup
		setTimeout(this.buildRooms.bind(this), 1000);

		console.log(`Master ${ process.pid } started`);
	},

	onAllWorkersExitCallback: null,

	async onAllWorkersExit() {
		console.log('All workers have closed');

		this.onAllWorkersExitCallback && this.onAllWorkersExitCallback();

		this.onAllProcessesFinishedCallback && this.onAllProcessesFinishedCallback();

		this.client.close();
	},

	//
	// Rooms
	//
	roomIds: [],
	roomsCount: 0,
	currentRoomBatch: 0,
	totalRoomBatches: 0,
	roomEvents: [],
	// -- Control
	roomsBenchmarkEnd: null,

	async buildRooms() {
		this.roomsBenchmarkEnd = benchmark('Rooms');

		const ROOM_BATCH_SIZE = config.get('ROOM_BATCH_SIZE');

		this.roomIds = await this.Rooms.distinct('_id');
		this.roomsCount = this.roomIds.length;
		this.totalRoomBatches = Math.ceil(this.roomsCount / ROOM_BATCH_SIZE);

		console.log(`Rooms - ${ this.roomsCount } rooms splitted in ${ this.totalRoomBatches } batches of ${ ROOM_BATCH_SIZE } each`);

		const initialWorkers = this.totalRoomBatches < this.workers.length ? this.totalRoomBatches : this.workers.length;

		for (let i = 0; i < initialWorkers; i++) {
			this.workers[i].send({ method: 'buildRooms', params: { batchIndex: this.currentRoomBatch++ } });
		}
	},

	async resultBuildRooms(worker, { roomEvents }) {
		this.roomEvents = [...this.roomEvents, ...roomEvents];

		if (this.currentRoomBatch < this.totalRoomBatches) {
			worker.send({ method: 'buildRooms', params: { batchIndex: this.currentRoomBatch++ } });
		} else if (this.roomsCount === this.roomEvents.length) {
			this.persistRoomEvents();
		}
	},

	async persistRoomEvents() {
		const chunkSize = 10000;

		for (let i = 0; i < this.roomEvents.length; i += chunkSize) {
			// eslint-disable-next-line no-await-in-loop
			await this.RoomEvents.insertMany(this.roomEvents.slice(i, chunkSize + i), { ordered: false });
		}

		this.roomsBenchmarkEnd();

		// Build the messages now
		this.buildMessages();
	},

	//
	// Messages
	//
	messagesProgressByRoom: {},
	currentMessageRoom: 0,
	// -- Control
	messagesBenchmarkEnd: null,

	async buildMessages() {
		this.messagesBenchmarkEnd = benchmark('Messages');

		// Set the exit callback
		this.onAllWorkersExitCallback = () => { this.messagesBenchmarkEnd(); };

		this.messagesProgressByRoom = this.roomIds.reduce((acc, id) => {
			acc[id] = { status: 'waiting' };

			return acc;
		}, {});

		console.log(`Messages - ${ this.roomsCount } messages splitted in ${ this.roomsCount } rooms`);

		const initialWorkers = this.roomsCount < this.workers.length ? this.roomsCount : this.workers.length;

		for (let i = 0; i < initialWorkers; i++) {
			const rid = this.roomIds[this.currentMessageRoom++];
			this.workers[i].send({ method: 'buildMessages', params: { rid, data: this.messagesProgressByRoom[rid] } });
		}
	},

	async resultBuildMessages(worker, { success }) {
		if (!success) {
			throw new Error('Could not insert messages');
		}

		if (this.currentMessageRoom < this.roomsCount) {
			const rid = this.roomIds[this.currentMessageRoom++];
			worker.send({ method: 'buildMessages', params: { rid, data: this.messagesProgressByRoom[rid] } });
		} else {
			worker.send({ method: 'close' });
		}
	},
});
