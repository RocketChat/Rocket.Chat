const moduleRequire = require('./moduleRequire');
const config = require('./config');
const { Events, RoomEvents } = require('./modelExtractions');

const { MongoClient } = moduleRequire('mongodb');

module.exports.getWorkerProcess = () => ({
	async start() {
		try {
			const databaseName = config.get('MONGO_URL').split('/')[3].split('?')[0];

			this.client = new MongoClient(config.get('MONGO_URL'), { useNewUrlParser: true, useUnifiedTopology: true });

			await this.client.connect();

			this.db = this.client.db(databaseName);

			// Models
			this.Rooms = this.db.collection('rocketchat_room');
			this.RoomEvents = this.db.collection('rocketchat_room_event');
			this.Messages = this.db.collection('rocketchat_message');

			// Add a timeout to close the worker if no first message is received after 15 seconds
			this.timeout = setTimeout(this.close.bind(this), 15000);

			// Message handler
			process.on('message', async ({ method, params }) => {
				clearTimeout(this.timeout);

				console.log(`Worker ${ process.pid }: ${ method }`);

				const result = await this[method](params);

				process.send({ method: `result${ method.charAt(0).toUpperCase() + method.slice(1) }`, result });
			});

			console.log(`Worker ${ process.pid } started`);
		} catch (err) {
			console.log(`Worker ${ process.pid } failed to start: ${ err.toString() } => ${ err.stack }`);
		}
	},

	async close() {
		this.client.close();

		process.exit(0);
	},

	//
	// Rooms
	async buildRooms({ batchIndex }) {
		const rooms = await this.Rooms.find({}, {
			limit: config.get('ROOM_BATCH_SIZE'),
			sort: { ts: 1 },
			skip: batchIndex * config.get('ROOM_BATCH_SIZE'),
		}).toArray();

		const roomEvents = [];

		for (const room of rooms) {
			const event = Events.buildEvent(config.get('LOCAL_SRC'), null, room._id, 'room', room);

			roomEvents.push(event);
		}

		return { roomEvents };
	},

	//
	// Messages
	async buildMessages({ rid }) {
		const cid = rid;

		const count = await this.Messages.find({ rid }).count();

		if (count === 0) {
			console.log(`Messages - Room ${ rid } has no messages`);

			// If there are no messages, set the isLeaf true
			await this.RoomEvents.updateOne({ cid }, { $set: { isLeaf: true } });

			return { success: true };
		}

		const batches = Math.ceil(count / config.get('MESSAGE_BATCH_SIZE'));

		console.log(`Messages - Room ${ rid } with ${ count } messages splitted in ${ batches } batches`);

		const messageEvents = [];

		let lastEventId = (await this.RoomEvents.findOne({ cid }))._id;

		for (let i = 0; i < batches; i++) {
			console.log(`Messages - Room ${ rid }, running batch ${ i }/${ batches }`);

			// eslint-disable-next-line no-await-in-loop
			const messages = await this.Messages.find({ rid }, {
				limit: config.get('MESSAGE_BATCH_SIZE'),
				sort: { ts: 1 },
				skip: i * config.get('MESSAGE_BATCH_SIZE'),
			}).toArray();

			for (const message of messages) {
				const v2Data = RoomEvents.fromV1Data(message);

				const event = Events.buildEvent(config.get('LOCAL_SRC'), message._id, message.rid, 'msg', v2Data, [lastEventId]);

				lastEventId = event._id;

				messageEvents.push(event);
			}
		}

		// Add the isLeaf flag
		if (messageEvents.length > 0) {
			messageEvents[messageEvents.length - 1].isLeaf = true;
		}

		console.log(`Messages - Room ${ rid }, persisting ${ messageEvents.length }`);

		const chunkSize = 10000;

		for (let i = 0; i < messageEvents.length; i += chunkSize) {
			// eslint-disable-next-line no-await-in-loop
			await this.RoomEvents.insertMany(messageEvents.slice(i, chunkSize + i), { ordered: false });
		}

		return { success: true };
	},
});
