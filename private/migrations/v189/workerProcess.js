const { MongoClient } = require('mongodb');

const config = require('./config');
const { Events, RoomEvents } = require('./modelExtractions');

module.exports.getWorkerProcess = () => ({
	async start() {
		try {
			const databaseName = config.get('MONGO_URL').split('/')[3].split('?')[0];

			this.client = new MongoClient(config.get('MONGO_URL'), { useNewUrlParser: true, useUnifiedTopology: true });

			await this.client.connect();

			this.db = this.client.db(databaseName);

			// Models
			this.Rooms = this.db.collection('rocketchat_room');
			this.RoomEvents = this.db.collection('rocketchat_message');
			this.Messages = this.db.collection('rocketchat_message_old');

			// Message handler
			process.on('message', async ({ method, params }) => {
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

	buildEvent(src, rid, t, d, _pids = []) {
		const contextQuery = { rid };

		const event = {
			_pids,
			v: 2,
			ts: new Date(),
			src,
			...contextQuery,
			t,
			d,
		};

		event._id = Events.createEventId(contextQuery, event);

		return event;
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
			const event = Events.buildEvent(config.get('LOCAL_SRC'), room._id, 'room', room);

			roomEvents.push(event);
		}

		return { roomEvents };
	},

	//
	// Messages
	async buildMessages({ rid }) {
		const count = await this.Messages.find({ rid }).count();

		if (count === 0) {
			console.log(`Messages - Room ${ rid } has no messages`);
			return { success: true };
		}

		const batches = Math.ceil(count / config.get('MESSAGE_BATCH_SIZE'));

		console.log(`Messages - Room ${ rid } with ${ count } messages splitted in ${ batches } batches`);

		const messageEvents = [];

		let lastEventId = (await this.RoomEvents.findOne({ rid }))._id;

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

				// Generate message hash
				v2Data._msgSha = v2Data.msg ? Events.SHA256(v2Data.msg) : null;

				const event = this.buildEvent(config.get('LOCAL_SRC'), message.rid, 'msg', v2Data, [lastEventId]);

				lastEventId = event._id;

				messageEvents.push(event);
			}
		}

		// Add the has_children flag
		if (messageEvents.length > 0) {
			messageEvents[messageEvents.length - 1].has_children = false;
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
